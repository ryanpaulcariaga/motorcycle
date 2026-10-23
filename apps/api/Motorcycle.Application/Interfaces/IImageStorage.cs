namespace Motorcycle.Application.Interfaces;

public sealed record StoredImage(string BlobName, string BlobUrl);

public interface IImageStorage
{
    Task<StoredImage> UploadAsync(Stream content, string blobName, string contentType, CancellationToken ct = default);
    Task<byte[]> DownloadAsync(string blobUrl, CancellationToken ct = default);
    Task DeleteAsync(string blobUrl, CancellationToken ct = default);
}
