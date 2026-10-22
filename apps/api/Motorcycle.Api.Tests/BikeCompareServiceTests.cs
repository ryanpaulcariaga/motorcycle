using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public class BikeCompareServiceTests
{
    [Fact]
    public async Task CompareBikesAsync_PreservesRequestedBikeOrder()
    {
        var requestedOrder = new[] { 2, 3, 1, 2 };
        var repository = new FakeBikeRepository(
            new[] { 3, 1, 2 }.Select(CreateBike).ToList());
        var service = new BikeService(
            repository,
            new EmptySpecGroupRepository(),
            new UnusedSpecFilterStrategyFactory(),
            new EmptyBikeComparisonRepository());

        var result = await service.CompareBikesAsync(requestedOrder.ToList());

        Assert.Equal(new[] { 2, 3, 1 }, result.Bikes.Select(bike => bike.Id));
    }

    private static Bike CreateBike(int id) => new()
    {
        Id = id,
        ModelId = id,
        VariantName = $"Variant {id}",
        Slug = $"bike-{id}",
        Model = new BikeModel
        {
            Id = id,
            Name = $"Model {id}",
            Brand = new Brand { Name = "Brand" }
        }
    };

    private sealed class FakeBikeRepository(List<Bike> bikes) : IBikeRepository
    {
        public Task<List<Bike>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default) =>
            Task.FromResult(bikes);

        public Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
            Task.FromResult<Bike?>(null);

        public Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
            string? search,
            int? brandId,
            int? categoryId,
            int? yearMin,
            int? yearMax,
            decimal? priceMin,
            decimal? priceMax,
            CancellationToken ct = default) =>
            Task.FromResult(new List<Bike>());
    }

    private sealed class EmptySpecGroupRepository : ISpecGroupRepository
    {
        public Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default) =>
            Task.FromResult(new List<SpecGroup>());
    }

    private sealed class UnusedSpecFilterStrategyFactory : ISpecFilterStrategyFactory
    {
        public IReadOnlyCollection<string> SupportedFilterTypes => Array.Empty<string>();

        public ISpecFilterStrategy Resolve(string filterType) =>
            throw new InvalidOperationException("No spec filters are used in this test.");
    }

    private sealed class EmptyBikeComparisonRepository : IBikeComparisonRepository
    {
        public Task<List<PopularComparisonMatch>> GetMostComparedPairsAsync(
            int limit,
            CancellationToken ct = default) =>
            Task.FromResult(new List<PopularComparisonMatch>());

        public Task RecordAsync(IEnumerable<(int BikeAId, int BikeBId)> pairs, CancellationToken ct = default) =>
            Task.CompletedTask;

        public Task<List<ComparedBikeMatch>> GetMostComparedWithAsync(
            int bikeId,
            int limit,
            CancellationToken ct = default) =>
            Task.FromResult(new List<ComparedBikeMatch>());
    }
}
