using System.Runtime.ExceptionServices;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class BikeImageAdminService : IBikeImageAdminService
{
    private static readonly IReadOnlyDictionary<string, string> AllowedContentTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
    };

    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private const long MaxFileSize = 10 * 1024 * 1024;
    private const int MinimumLongEdge = 1200;
    private const double RequiredAspectRatio = 4.0 / 3.0;
    private const double AspectRatioTolerance = 0.02;
    private readonly IBikeImageAdminRepository _repository;
    private readonly IImageStorage _storage;
    private readonly IImageProcessor _processor;

    public BikeImageAdminService(IBikeImageAdminRepository repository, IImageStorage storage, IImageProcessor processor)
    {
        _repository = repository;
        _storage = storage;
        _processor = processor;
    }

    public async Task<IReadOnlyList<BikeImageAdminDto>> GetAllAsync(int bikeId, CancellationToken ct = default)
    {
        await EnsureBikeExistsAsync(bikeId, ct);
        return (await _repository.GetAllAsync(bikeId, ct)).Select(ToDto).ToList();
    }

    public async Task<BikeImageAdminDto> UploadAsync(int bikeId, Stream content, string fileName, string contentType, long length, CancellationToken ct = default)
    {
        await EnsureBikeExistsAsync(bikeId, ct);
        if (length <= 0) {
            throw new ArgumentException("Image file is empty.");
        }

        if (length > MaxFileSize) {
            throw new ArgumentException("Image file must be 10 MB or smaller.");
        }

        if (!AllowedContentTypes.TryGetValue(contentType, out var extension)) {
            throw new ArgumentException("Only JPEG, PNG, WebP, and GIF images are supported.");
        }

        using var bufferedContent = new MemoryStream();
        var copyBuffer = new byte[81920];
        int read;
        while ((read = await content.ReadAsync(copyBuffer, ct)) > 0) {
            if (bufferedContent.Length + read > MaxFileSize) {
                throw new ArgumentException("Image file must be 10 MB or smaller.");
            }

            await bufferedContent.WriteAsync(copyBuffer.AsMemory(0, read), ct);
        }

        if (bufferedContent.Length is <= 0 or > MaxFileSize) {
            throw new ArgumentException("Image content must be non-empty and 10 MB or smaller.");
        }

        var imageBytes = bufferedContent.ToArray();
        var header = new byte[12];
        imageBytes.AsSpan(0, Math.Min(imageBytes.Length, header.Length)).CopyTo(header);
        var bytesRead = Math.Min(imageBytes.Length, header.Length);

        if (!HasExpectedSignature(contentType, header.AsSpan(0, bytesRead))) {
            throw new ArgumentException("The image content does not match its declared file type.");
        }

        ProcessedImage processed;
        try {
            using var imageStream = new MemoryStream(imageBytes, writable: false);
            processed = _processor.CreateVariants(imageStream);
        } catch (InvalidDataException exception) {
            throw new ArgumentException(exception.Message, nameof(content), exception);
        }

        if (processed.Width < MinimumLongEdge) {
            throw new ArgumentException($"Image must be a landscape image at least {MinimumLongEdge} pixels wide.");
        }

        var ratio = (double)processed.Width / processed.Height;
        if (Math.Abs(ratio / RequiredAspectRatio - 1) > AspectRatioTolerance) {
            throw new ArgumentException("Image must have a 4:3 landscape aspect ratio.");
        }

        var images = await _repository.GetAllAsync(bikeId, ct);
        var assetPath = $"bikes/{bikeId}/{Guid.NewGuid():N}";
        var image = new BikeImage
        {
            BikeId = bikeId,
            Width = processed.Width,
            Height = processed.Height,
            SortOrder = images.Count == 0 ? 1 : images.Max(x => x.SortOrder) + 1,
            IsPrimary = images.Count == 0,
        };

        var uploaded = new List<StoredImage>();
        try {
            using var original = new MemoryStream(imageBytes, writable: false);
            var storedOriginal = await _storage.UploadAsync(original, $"{assetPath}/original{extension}", contentType, ct);
            uploaded.Add(storedOriginal);
            image.BlobUrl = storedOriginal.BlobUrl;

            foreach (var variant in processed.Variants) {
                using var variantStream = new MemoryStream(variant.Value, writable: false);
                var storedVariant = await _storage.UploadAsync(variantStream, $"{assetPath}/{variant.Key}.webp", "image/webp", ct);
                uploaded.Add(storedVariant);
                SetVariantUrl(image, variant.Key, storedVariant.BlobUrl);
            }

            await _repository.AddAsync(image, ct);
            await _repository.SaveChangesAsync(ct);
        } catch (Exception uploadFailure) {
            var cleanupFailures = new List<Exception>();
            foreach (var stored in uploaded) {
                try {
                    await _storage.DeleteAsync(stored.BlobUrl, ct);
                } catch (Exception cleanupFailure) {
                    cleanupFailures.Add(cleanupFailure);
                }
            }

            if (cleanupFailures.Count > 0) {
                throw new AggregateException("Image upload failed and one or more uploaded blobs could not be removed.", [uploadFailure, .. cleanupFailures]);
            }

            ExceptionDispatchInfo.Capture(uploadFailure).Throw();
            throw;
        }

        return ToDto(image);
    }

    public async Task<BikeImageVariantBackfillResult> BackfillVariantsAsync(CancellationToken ct = default)
    {
        var images = await _repository.GetAllForVariantBackfillAsync(ct);
        var lowResolutionImages = 0;
        foreach (var image in images) {
            if (image.Width > 0 && image.Height > 0) {
                if (Math.Max(image.Width, image.Height) < MinimumLongEdge) {
                    lowResolutionImages++;
                    continue;
                }

                if (HasAllAvailableVariants(image)) {
                    continue;
                }
            }

            var originalBytes = await _storage.DownloadAsync(image.BlobUrl, ct);
            ProcessedImage processed;
            using (var original = new MemoryStream(originalBytes, writable: false)) {
                processed = _processor.CreateVariants(original);
            }

            image.Width = processed.Width;
            image.Height = processed.Height;
            if (Math.Max(processed.Width, processed.Height) < MinimumLongEdge) {
                lowResolutionImages++;
                await _repository.SaveChangesAsync(ct);
                continue;
            }

            var uploaded = new List<StoredImage>();
            try {
                foreach (var variant in processed.Variants) {
                    if (GetVariantUrl(image, variant.Key) is not null) {
                        continue;
                    }

                    using var variantStream = new MemoryStream(variant.Value, writable: false);
                    var stored = await _storage.UploadAsync(
                        variantStream,
                        $"bikes/{image.BikeId}/image-{image.Id}/{variant.Key}.webp",
                        "image/webp",
                        ct);
                    uploaded.Add(stored);
                    SetVariantUrl(image, variant.Key, stored.BlobUrl);
                }

                await _repository.SaveChangesAsync(ct);
            } catch (Exception backfillFailure) {
                var cleanupFailures = new List<Exception>();
                foreach (var stored in uploaded) {
                    try {
                        await _storage.DeleteAsync(stored.BlobUrl, ct);
                    } catch (Exception cleanupFailure) {
                        cleanupFailures.Add(cleanupFailure);
                    }
                }

                if (cleanupFailures.Count > 0) {
                    throw new AggregateException("Variant backfill failed and one or more uploaded blobs could not be removed.", [backfillFailure, .. cleanupFailures]);
                }

                ExceptionDispatchInfo.Capture(backfillFailure).Throw();
                throw;
            }
        }

        return new BikeImageVariantBackfillResult(images.Count, lowResolutionImages);
    }

    private static bool HasExpectedSignature(string contentType, ReadOnlySpan<byte> header)
    {
        if (string.Equals(contentType, "image/jpeg", StringComparison.OrdinalIgnoreCase)) {
            return header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        }

        if (string.Equals(contentType, "image/png", StringComparison.OrdinalIgnoreCase)) {
            return header.Length >= PngSignature.Length && header[..PngSignature.Length].SequenceEqual(PngSignature);
        }

        if (string.Equals(contentType, "image/webp", StringComparison.OrdinalIgnoreCase)) {
            return header.Length >= 12 &&
                header[..4].SequenceEqual("RIFF"u8) &&
                header.Slice(8, 4).SequenceEqual("WEBP"u8);
        }

        if (string.Equals(contentType, "image/gif", StringComparison.OrdinalIgnoreCase)) {
            return header.StartsWith("GIF87a"u8) || header.StartsWith("GIF89a"u8);
        }

        return false;
    }

    public async Task<BikeImageAdminDto> SetPrimaryAsync(int bikeId, int imageId, CancellationToken ct = default)
    {
        await EnsureBikeExistsAsync(bikeId, ct);
        var image = await _repository.GetByIdAsync(bikeId, imageId, ct) ?? throw new KeyNotFoundException("Image was not found.");
        var images = await _repository.GetAllAsync(bikeId, ct);
        foreach (var candidate in images) {
            candidate.IsPrimary = candidate.Id == image.Id;
        }

        await _repository.SaveChangesAsync(ct);
        return ToDto(image);
    }

    public async Task<IReadOnlyList<BikeImageAdminDto>> ReorderAsync(int bikeId, ReorderBikeImagesRequest request, CancellationToken ct = default)
    {
        await EnsureBikeExistsAsync(bikeId, ct);
        var images = await _repository.GetAllAsync(bikeId, ct);
        if (request.ImageIds.Count != images.Count || request.ImageIds.Distinct().Count() != request.ImageIds.Count || request.ImageIds.Any(id => images.All(x => x.Id != id))) {
            throw new ArgumentException("ImageIds must contain every assigned image exactly once.");
        }

        var positions = request.ImageIds.Select((id, index) => (id, sortOrder: index + 1)).ToDictionary(x => x.id, x => x.sortOrder);
        foreach (var image in images) {
            image.SortOrder = positions[image.Id];
        }

        await _repository.SaveChangesAsync(ct);
        return images.OrderBy(x => x.SortOrder).Select(ToDto).ToList();
    }

    public async Task DeleteAsync(int bikeId, int imageId, CancellationToken ct = default)
    {
        await EnsureBikeExistsAsync(bikeId, ct);
        var image = await _repository.GetByIdAsync(bikeId, imageId, ct) ?? throw new KeyNotFoundException("Image was not found.");
        _repository.Remove(image);
        await _repository.SaveChangesAsync(ct);

        var failures = new List<Exception>();
        foreach (var blobUrl in new[] { image.BlobUrl }.Concat(GetVariantUrls(image))) {
            try {
                await _storage.DeleteAsync(blobUrl, ct);
            } catch (Exception exception) {
                failures.Add(exception);
            }
        }

        if (failures.Count > 0) {
            throw new AggregateException("Image record was deleted, but one or more image blobs could not be removed.", failures);
        }
    }

    private async Task EnsureBikeExistsAsync(int bikeId, CancellationToken ct)
    {
        if (!await _repository.BikeExistsAsync(bikeId, ct)) {
            throw new KeyNotFoundException("Bike was not found.");
        }
    }

    private static BikeImageAdminDto ToDto(BikeImage image) =>
        new(image.Id, image.BlobUrl, image.SortOrder, image.IsPrimary, image.Width, image.Height, ToVariants(image));

    private static BikeImageVariantsDto? ToVariants(BikeImage image) =>
        image.SmallUrl is null && image.MediumUrl is null && image.LargeUrl is null && image.XlUrl is null
            ? null
            : new BikeImageVariantsDto(image.SmallUrl, image.MediumUrl, image.LargeUrl, image.XlUrl);

    private static IEnumerable<string> GetVariantUrls(BikeImage image) =>
        new[] { image.SmallUrl, image.MediumUrl, image.LargeUrl, image.XlUrl }.OfType<string>();

    private static string? GetVariantUrl(BikeImage image, string name) => name switch
    {
        "small" => image.SmallUrl,
        "medium" => image.MediumUrl,
        "large" => image.LargeUrl,
        "xl" => image.XlUrl,
        _ => throw new ArgumentOutOfRangeException(nameof(name), name, "Unknown image variant."),
    };

    private static void SetVariantUrl(BikeImage image, string name, string url)
    {
        switch (name) {
            case "small":
                image.SmallUrl = url;
                break;
            case "medium":
                image.MediumUrl = url;
                break;
            case "large":
                image.LargeUrl = url;
                break;
            case "xl":
                image.XlUrl = url;
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(name), name, "Unknown image variant.");
        }
    }

    private static bool HasAllAvailableVariants(BikeImage image) =>
        image.SmallUrl is not null &&
        image.MediumUrl is not null &&
        image.LargeUrl is not null &&
        image.XlUrl is not null;
}
