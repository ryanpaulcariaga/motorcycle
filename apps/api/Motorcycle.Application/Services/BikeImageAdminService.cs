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
    private readonly IBikeImageAdminRepository _repository;
    private readonly IImageStorage _storage;

    public BikeImageAdminService(IBikeImageAdminRepository repository, IImageStorage storage)
    {
        _repository = repository;
        _storage = storage;
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

        using var bufferedContent = content.CanSeek ? null : new MemoryStream();
        var uploadContent = content;
        if (bufferedContent is not null) {
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

            bufferedContent.Position = 0;
            uploadContent = bufferedContent;
        }

        var initialPosition = uploadContent.Position;
        var header = new byte[12];
        var bytesRead = 0;
        try {
            while (bytesRead < header.Length) {
                var read = await uploadContent.ReadAsync(header.AsMemory(bytesRead), ct);
                if (read == 0) {
                    break;
                }

                bytesRead += read;
            }
        } finally {
            uploadContent.Position = initialPosition;
        }

        if (!HasExpectedSignature(contentType, header.AsSpan(0, bytesRead))) {
            throw new ArgumentException("The image content does not match its declared file type.");
        }

        var images = await _repository.GetAllAsync(bikeId, ct);
        var blobName = $"bikes/{bikeId}/{Guid.NewGuid():N}{extension}";
        var stored = await _storage.UploadAsync(uploadContent, blobName, contentType, ct);
        var image = new BikeImage
        {
            BikeId = bikeId,
            BlobUrl = stored.BlobUrl,
            SortOrder = images.Count == 0 ? 1 : images.Max(x => x.SortOrder) + 1,
            IsPrimary = images.Count == 0,
        };

        await _repository.AddAsync(image, ct);
        await _repository.SaveChangesAsync(ct);
        return ToDto(image);
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
        await _storage.DeleteAsync(image.BlobUrl, ct);
    }

    private async Task EnsureBikeExistsAsync(int bikeId, CancellationToken ct)
    {
        if (!await _repository.BikeExistsAsync(bikeId, ct)) {
            throw new KeyNotFoundException("Bike was not found.");
        }
    }

    private static BikeImageAdminDto ToDto(BikeImage image) => new(image.Id, image.BlobUrl, image.SortOrder, image.IsPrimary);
}
