using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Storage;

public sealed class AzureBlobImageStorage : IImageStorage
{
    private readonly BlobContainerClient _container;
    private readonly string _containerName;

    public AzureBlobImageStorage(IConfiguration configuration)
    {
        var connectionString = configuration["Storage:ConnectionString"]
            ?? throw new InvalidOperationException("Storage:ConnectionString is required.");
        _containerName = configuration["Storage:ContainerName"] ?? "images";
        _container = new BlobContainerClient(connectionString, _containerName);
    }

    public async Task<StoredImage> UploadAsync(Stream content, string blobName, string contentType, CancellationToken ct = default)
    {
        await _container.CreateIfNotExistsAsync(cancellationToken: ct);
        var blob = _container.GetBlobClient(blobName);
        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        }, ct);
        return new StoredImage(blobName, blob.Uri.AbsoluteUri);
    }

    public async Task<byte[]> DownloadAsync(string blobUrl, CancellationToken ct = default)
    {
        var blob = GetBlobClient(blobUrl);
        var response = await blob.DownloadContentAsync(ct);
        return response.Value.Content.ToArray();
    }

    public async Task DeleteAsync(string blobUrl, CancellationToken ct = default)
    {
        await GetBlobClient(blobUrl).DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: ct);
    }

    private BlobClient GetBlobClient(string blobUrl)
    {
        if (!Uri.TryCreate(blobUrl, UriKind.Absolute, out var uri)) {
            throw new ArgumentException("Image URL is not a valid absolute URL.", nameof(blobUrl));
        }

        var segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2 || !string.Equals(segments[0], _containerName, StringComparison.OrdinalIgnoreCase)) {
            throw new ArgumentException("Image URL does not belong to the configured storage container.", nameof(blobUrl));
        }

        var blobName = string.Join('/', segments.Skip(1).Select(Uri.UnescapeDataString));
        return _container.GetBlobClient(blobName);
    }
}
