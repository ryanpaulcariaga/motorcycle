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
        var service = new BikeImageAdminService(repository, storage, new FakeImageProcessor());
        var content = Convert.FromHexString(headerHex);

        await service.UploadAsync(1, new MemoryStream(content), "image", contentType, content.Length);

        Assert.Equal(4, storage.UploadCount);
        Assert.Equal(content, storage.UploadedContents[0]);
        Assert.Single(repository.AddedImages);
        Assert.NotNull(repository.AddedImages[0].SmallUrl);
        Assert.NotNull(repository.AddedImages[0].LargeUrl);
        Assert.Null(repository.AddedImages[0].XlUrl);
    }

    [Fact]
    public async Task UploadAsync_RejectsContentThatDoesNotMatchDeclaredType()
    {
        var repository = new FakeBikeImageAdminRepository();
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage, new FakeImageProcessor());
        var content = Convert.FromHexString("89504E470D0A1A0A00000000");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new MemoryStream(content), "image.jpg", "image/jpeg", content.Length));

        Assert.Contains("does not match", exception.Message);
        Assert.Equal(0, storage.UploadCount);
        Assert.Empty(repository.AddedImages);
    }

    [Fact]
    public async Task UploadAsync_RejectsImagesBelowMinimumLongEdge()
    {
        var repository = new FakeBikeImageAdminRepository();
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage, new         FakeImageProcessor(1199, 899));
        var content = Convert.FromHexString("FFD8FF112233445566778899");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new MemoryStream(content), "image.jpg", "image/jpeg", content.Length));

        Assert.Contains("1200 pixels", exception.Message);
        Assert.Empty(storage.UploadedContents);
        Assert.Empty(repository.AddedImages);
    }

            [Theory]
            [InlineData(1200, 1200)]
            [InlineData(1920, 1080)]
            [InlineData(1200, 1600)]
            public async Task UploadAsync_RejectsImagesThatAreNotFourByThree(int width, int height)
            {
                var repository = new FakeBikeImageAdminRepository();
                var storage = new FakeImageStorage();
                var service = new BikeImageAdminService(repository, storage, new FakeImageProcessor(width, height));
                var content = Convert.FromHexString("FFD8FF112233445566778899");

                var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
                    service.UploadAsync(1, new MemoryStream(content), "image.jpg", "image/jpeg", content.Length));

                Assert.Contains("4:3", exception.Message);
                Assert.Empty(storage.UploadedContents);
                Assert.Empty(repository.AddedImages);
            }

    [Fact]
    public async Task BackfillVariantsAsync_GeneratesMissingVariantsForExistingImage()
    {
        var image = new BikeImage { Id = 10, BikeId = 1, BlobUrl = "https://images.example/original.jpg" };
        var repository = new FakeBikeImageAdminRepository();
        repository.ExistingImages.Add(image);
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage, new FakeImageProcessor());

        var result = await service.BackfillVariantsAsync();

        Assert.Equal(1, result.ProcessedImages);
        Assert.Equal(0, result.LowResolutionImages);
        Assert.Equal(3, storage.UploadCount);
        Assert.Equal(2000, image.Width);
        Assert.NotNull(image.SmallUrl);
        Assert.NotNull(image.LargeUrl);
    }

    [Fact]
    public async Task BackfillVariantsAsync_RecordsLowResolutionImageWithoutGeneratingVariants()
    {
        var image = new BikeImage { Id = 10, BikeId = 1, BlobUrl = "https://images.example/original.jpg" };
        var repository = new FakeBikeImageAdminRepository();
        repository.ExistingImages.Add(image);
        var storage = new FakeImageStorage();
        var service = new BikeImageAdminService(repository, storage, new FakeImageProcessor(1100, 800));

        var result = await service.BackfillVariantsAsync();

        Assert.Equal(1, result.ProcessedImages);
        Assert.Equal(1, result.LowResolutionImages);
        Assert.Equal(0, storage.UploadCount);
        Assert.Equal(1100, image.Width);
        Assert.Null(image.SmallUrl);
    }

    private sealed class FakeBikeImageAdminRepository : IBikeImageAdminRepository
    {
        public List<BikeImage> AddedImages { get; } = [];
        public List<BikeImage> ExistingImages { get; } = [];

        public Task<bool> BikeExistsAsync(int bikeId, CancellationToken ct = default) => Task.FromResult(bikeId == 1);
        public Task<List<BikeImage>> GetAllAsync(int bikeId, CancellationToken ct = default) =>
            Task.FromResult(ExistingImages.Where(image => image.BikeId == bikeId).ToList());
        public Task<List<BikeImage>> GetAllForVariantBackfillAsync(CancellationToken ct = default) =>
            Task.FromResult(ExistingImages);
        public Task<BikeImage?> GetByIdAsync(int bikeId, int imageId, CancellationToken ct = default) =>
            Task.FromResult(ExistingImages.SingleOrDefault(image => image.BikeId == bikeId && image.Id == imageId));

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
        public List<byte[]> UploadedContents { get; } = [];
        public List<string> DeletedBlobUrls { get; } = [];
        public byte[] DownloadedContent { get; set; } = [1, 2, 3];

        public async Task<StoredImage> UploadAsync(Stream content, string blobName, string contentType, CancellationToken ct = default)
        {
            UploadCount++;
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, ct);
            UploadedContents.Add(buffer.ToArray());
            return new StoredImage(blobName, $"https://images.example/{blobName}");
        }

        public Task<byte[]> DownloadAsync(string blobUrl, CancellationToken ct = default) => Task.FromResult(DownloadedContent);
        public Task DeleteAsync(string blobUrl, CancellationToken ct = default)
        {
            DeletedBlobUrls.Add(blobUrl);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeImageProcessor(int width = 2000, int height = 1500) : IImageProcessor
    {
        public ProcessedImage CreateVariants(Stream source)
        {
            var longEdge = Math.Max(width, height);
            var variants = new Dictionary<string, byte[]>();
            foreach (var (name, size) in new[] { ("small", 320), ("medium", 640), ("large", 1280), ("xl", 2048) }) {
                if (size <= longEdge) {
                    variants.Add(name, [1, 2, 3]);
                }
            }

            return new ProcessedImage(width, height, variants);
        }
    }
}
