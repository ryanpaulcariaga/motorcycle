using Motorcycle.Api.Tests.Fakes;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public class BikeAdminServiceTests
{
    private static (BikeAdminService Service, FakeBikeAdminRepository Repository) CreateService()
    {
        var repository = new FakeBikeAdminRepository();
        var service = new BikeAdminService(repository, new FakeBikeModelRepository(), new FakeSpecGroupRepository());
        return (service, repository);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_PersistsUnpublishedBike()
    {
        var (service, _) = CreateService();

        var result = await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, 6199.00m, new() { ["engine_displacement_cc"] = 399 }));

        Assert.False(result.IsPublished);
        Assert.Equal("SE", result.VariantName);
        Assert.Equal(2024, result.Year);
    }

    [Fact]
    public async Task CreateAsync_WithUnknownModel_ThrowsKeyNotFound()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(new CreateBikeRequest(999, "SE", 2024, null, null)));
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateVariant_ThrowsInvalidOperation()
    {
        var (service, _) = CreateService();
        await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null)));
    }

    [Theory]
    [InlineData("", 2024)]
    [InlineData("SE", 0)]
    public async Task CreateAsync_WithMissingCoreFields_ThrowsArgumentException(string variantName, int year)
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(new CreateBikeRequest(1, variantName, year, null, null)));
    }

    [Fact]
    public async Task CreateAsync_WithUnrecognizedSpecCode_ThrowsArgumentException()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, new() { ["not_a_real_spec"] = 1 })));
    }

    [Fact]
    public async Task CreateAsync_WithMismatchedSpecType_ThrowsArgumentException()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, new() { ["engine_displacement_cc"] = "not-a-number" })));
    }

    [Fact]
    public async Task PublishAsync_WithMissingCoreFields_ThrowsInvalidOperation()
    {
        var (service, repository) = CreateService();
        await repository.AddAsync(new Bike { ModelId = 1, VariantName = "", Year = 0 });

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.PublishAsync(1));
    }

    [Fact]
    public async Task PublishAsync_WithValidBike_SetsIsPublished()
    {
        var (service, _) = CreateService();
        var created = await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null));

        var published = await service.PublishAsync(created.Id);

        Assert.True(published.IsPublished);
    }

    [Fact]
    public async Task UnpublishAsync_SetsIsPublishedFalse()
    {
        var (service, _) = CreateService();
        var created = await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null));
        await service.PublishAsync(created.Id);

        var result = await service.UnpublishAsync(created.Id);

        Assert.False(result.IsPublished);
    }

    [Fact]
    public async Task DeleteAsync_WithDependentImages_ThrowsBikeReferenced()
    {
        var (service, repository) = CreateService();
        var created = await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null));
        repository.SetDependentImageCount(created.Id, 2);

        var ex = await Assert.ThrowsAsync<BikeReferencedException>(() => service.DeleteAsync(created.Id));
        Assert.Equal(2, ex.DependentCount);
    }

    [Fact]
    public async Task DeleteAsync_WithNoDependentImages_RemovesBike()
    {
        var (service, repository) = CreateService();
        var created = await service.CreateAsync(new CreateBikeRequest(1, "SE", 2024, null, null));

        await service.DeleteAsync(created.Id);

        Assert.Empty(repository.Bikes);
    }
}
