using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public sealed class BikeImageAdminServiceTests
{
    [Theory]
    [InlineData("image/jpeg", "FFD8FF112233445566778899")]
    [InlineData("image/png", "89504E470D0A1A0A00000000")]
    [InlineData("image/webp", "524946460000000057454250")]
    [InlineData("image/gif", "474946383961000000000000")]
    public async Task UploadAsync_AcceptsMatchingImageSignature(string contentType, string headerHex)
    {
        var repository = new FakeBikeImageAdminRepository();
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage);
        var content = Convert.FromHexString(headerHex);

        await service.UploadAsync(1, new MemoryStream(content), "image", contentType, content.Length);

        Assert.Equal(1, storage.UploadCount);
        Assert.Equal(content, storage.UploadedContent);
        Assert.Single(repository.AddedImages);
    }

    [Fact]
    public async Task UploadAsync_RejectsContentThatDoesNotMatchDeclaredType()
    {
        var repository = new FakeBikeImageAdminRepository();
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage);
        var content = Convert.FromHexString("89504E470D0A1A0A00000000");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new MemoryStream(content), "image.jpg", "image/jpeg", content.Length));

        Assert.Contains("does not match", exception.Message);
        Assert.Equal(0, storage.UploadCount);
        Assert.Empty(repository.AddedImages);
    }

    private sealed class FakeBikeImageAdminRepository : IBikeImageAdminRepository
    {
        public List<BikeImage> AddedImages { get; } = [];

        public Task<bool> BikeExistsAsync(int bikeId, CancellationToken ct = default) => Task.FromResult(bikeId == 1);
        public Task<List<BikeImage>> GetAllAsync(int bikeId, CancellationToken ct = default) => Task.FromResult(new List<BikeImage>());
        public Task<BikeImage?> GetByIdAsync(int bikeId, int imageId, CancellationToken ct = default) => Task.FromResult<BikeImage?>(null);

        public Task AddAsync(BikeImage image, CancellationToken ct = default)
        {
            AddedImages.Add(image);
            return Task.CompletedTask;
        }

        public void Remove(BikeImage image)
        {
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeImageStorage : IImageStorage
    {
        public int UploadCount { get; private set; }
        public byte[]? UploadedContent { get; private set; }

        public async Task<StoredImage> UploadAsync(Stream content, string blobName, string contentType, CancellationToken ct = default)
        {
            UploadCount++;
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, ct);
            UploadedContent = buffer.ToArray();
            return new StoredImage(blobName, $"https://images.example/{blobName}");
        }

        public Task DeleteAsync(string blobUrl, CancellationToken ct = default) => Task.CompletedTask;
    }
}
