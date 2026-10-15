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

    [Fact]
    public async Task ReassignModelAsync_ChangesOnlyModelAssociation()
    {
        var (service, repository) = CreateService();
        var images = new List<BikeImage>();
        var bike = new Bike
        {
            ModelId = 1,
            VariantName = "SE",
            Year = 2024,
            MsrpPrice = 6199m,
            Slug = "kawasaki-ninja-400-se-2024",
            Specs = new() { ["engine_displacement_cc"] = 399 },
            IsPublished = true,
            Images = images
        };
        await repository.AddAsync(bike);
        var originalSpecs = bike.Specs;
        var originalCreatedAt = bike.CreatedAt;
        var originalUpdatedAt = bike.UpdatedAt;

        await service.ReassignModelAsync(bike.Id, new ReassignBikeModelRequest(2));

        Assert.Equal(2, bike.ModelId);
        Assert.Equal(2, bike.Model.Id);
        Assert.Equal("SE", bike.VariantName);
        Assert.Equal(2024, bike.Year);
        Assert.Equal(6199m, bike.MsrpPrice);
        Assert.Equal("kawasaki-ninja-400-se-2024", bike.Slug);
        Assert.Same(originalSpecs, bike.Specs);
        Assert.Equal(399, bike.Specs["engine_displacement_cc"]);
        Assert.True(bike.IsPublished);
        Assert.Same(images, bike.Images);
        Assert.Equal(originalCreatedAt, bike.CreatedAt);
        Assert.NotEqual(originalUpdatedAt, bike.UpdatedAt);
    }

    [Fact]
    public async Task ReassignModelAsync_WithUnknownBike_ThrowsKeyNotFound()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.ReassignModelAsync(999, new ReassignBikeModelRequest(2)));
    }

    [Fact]
    public async Task ReassignModelAsync_WithUnknownModel_LeavesBikeUnchanged()
    {
        var (service, repository) = CreateService();
        var bike = new Bike { ModelId = 1, VariantName = "SE", Year = 2024 };
        await repository.AddAsync(bike);
        var originalUpdatedAt = bike.UpdatedAt;

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.ReassignModelAsync(bike.Id, new ReassignBikeModelRequest(999)));

        Assert.Equal(1, bike.ModelId);
        Assert.Equal(originalUpdatedAt, bike.UpdatedAt);
    }

    [Fact]
    public async Task ReassignModelAsync_WithDuplicateTargetVariant_LeavesBikeUnchanged()
    {
        var (service, repository) = CreateService();
        var bike = new Bike { ModelId = 1, VariantName = "SE", Year = 2024 };
        var duplicate = new Bike { ModelId = 2, VariantName = "SE", Year = 2024 };
        await repository.AddAsync(bike);
        await repository.AddAsync(duplicate);
        var originalUpdatedAt = bike.UpdatedAt;

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ReassignModelAsync(bike.Id, new ReassignBikeModelRequest(2)));

        Assert.Equal(1, bike.ModelId);
        Assert.Equal(originalUpdatedAt, bike.UpdatedAt);
    }

    [Fact]
    public async Task ReassignModelAsync_ToCurrentModel_DoesNotChangeUpdatedAt()
    {
        var (service, repository) = CreateService();
        var bike = new Bike { ModelId = 1, VariantName = "SE", Year = 2024 };
        await repository.AddAsync(bike);
        var originalUpdatedAt = bike.UpdatedAt;

        await service.ReassignModelAsync(bike.Id, new ReassignBikeModelRequest(1));

        Assert.Equal(1, bike.ModelId);
        Assert.Equal(originalUpdatedAt, bike.UpdatedAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task ReassignModelAsync_WithInvalidModelId_ThrowsArgumentException(int modelId)
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.ReassignModelAsync(1, new ReassignBikeModelRequest(modelId)));
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
