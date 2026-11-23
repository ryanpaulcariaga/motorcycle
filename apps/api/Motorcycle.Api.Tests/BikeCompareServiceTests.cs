using Motorcycle.Application.Common;
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
            new[] { 3, 1, 2 }.Select(id => CreateBike(id)).ToList());
        var service = new BikeService(
            repository,
            new EmptySpecGroupRepository(),
            new UnusedSpecFilterStrategyFactory(),
            new EmptyBikeComparisonRepository(),
            TimeProvider.System);

        var result = await service.CompareBikesAsync(requestedOrder.ToList());

        Assert.Equal(new[] { 2, 3, 1 }, result.Bikes.Select(bike => bike.Id));
    }

    [Fact]
    public async Task GetBikesAsync_AppliesMultipleSortCriteriaBeforePaging()
    {
        var bikes = new List<Bike>
        {
            CreateBike(1, year: 2024, price: 100),
            CreateBike(2, year: 2024, price: 100),
            CreateBike(3, year: 2024, price: 90),
            CreateBike(4, year: 2023, price: 50)
        };
        bikes[0].Model.Name = "Honda";
        bikes[1].Model.Name = "Yamaha";
        bikes[2].Model.Name = "Suzuki";
        var repository = new FakeBikeRepository(bikes);
        var service = new BikeService(
            repository,
            new EmptySpecGroupRepository(),
            new UnusedSpecFilterStrategyFactory(),
            new EmptyBikeComparisonRepository(),
            TimeProvider.System);

        var result = await service.GetBikesAsync(new BikeQueryParameters
        {
            Page = 1,
            PageSize = 2,
            Sorts =
            [
                new BikeSortCriterion("year", true),
                new BikeSortCriterion("price", false),
                new BikeSortCriterion("model_name", false)
            ]
        });

        Assert.Equal(new[] { 3, 1 }, result.Items.Select(bike => bike.Id));
        Assert.Equal(4, result.TotalCount);
    }

    [Fact]
    public async Task GetTopBikesByFansAsync_MapsFanRanking()
    {
        var bike = CreateBike(7);
        var repository = new FakeBikeRepository([bike]);
        var service = new BikeService(
            repository,
            new EmptySpecGroupRepository(),
            new UnusedSpecFilterStrategyFactory(),
            new EmptyBikeComparisonRepository(),
            TimeProvider.System);

        var result = await service.GetTopBikesByFansAsync(10);

        var ranked = Assert.Single(result);
        Assert.Equal(7, ranked.Bike.Id);
        Assert.Equal(12, ranked.FanCount);
        Assert.Equal(4.3m, ranked.AverageRating);
        repository.AssertTopFansLimit(10);
    }

    [Fact]
    public async Task GetTopBikesByDailyInterestAsync_UsesCurrentUtcDayAndMapsViews()
    {
        var bike = CreateBike(7);
        var repository = new FakeBikeRepository([bike]);
        var service = new BikeService(
            repository,
            new EmptySpecGroupRepository(),
            new UnusedSpecFilterStrategyFactory(),
            new EmptyBikeComparisonRepository(),
            new FixedClock(new DateTimeOffset(2026, 11, 22, 23, 30, 0, TimeSpan.Zero)));

        var result = await service.GetTopBikesByDailyInterestAsync(10);

        var ranked = Assert.Single(result);
        Assert.Equal(7, ranked.Bike.Id);
        Assert.Equal(23, ranked.ViewCount);
        repository.AssertDailyInterestQuery(new DateOnly(2026, 11, 22), 10);
    }

    private static Bike CreateBike(int id, int year = 2024, decimal? price = 100) => new()
    {
        Id = id,
        ModelId = id,
        VariantName = $"Variant {id}",
        Slug = $"bike-{id}",
        Year = year,
        MsrpPrice = price,
        Model = new BikeModel
        {
            Id = id,
            Name = $"Model {id}",
            Brand = new Brand { Name = "Brand" },
            Category = new Category { Name = "Category" }
        }
    };

    private sealed class FakeBikeRepository(List<Bike> bikes) : IBikeRepository
    {
        public Task<List<Bike>> GetByIdsAsync(
            IEnumerable<int> ids,
            CancellationToken ct = default,
            bool includeTestData = false) =>
            Task.FromResult(bikes);

        public Task<Bike?> GetBySlugAsync(
            string slug,
            CancellationToken ct = default,
            bool includeTestData = false) =>
            Task.FromResult<Bike?>(null);

        public Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
            string? search,
            int? brandId,
            int? categoryId,
            int? yearMin,
            int? yearMax,
            decimal? priceMin,
            decimal? priceMax,
            CancellationToken ct = default,
            bool includeTestData = false) =>
            Task.FromResult(bikes);

        private int? TopFansLimit { get; set; }
        private DateOnly? DailyInterestDay { get; set; }
        private int? DailyInterestLimit { get; set; }

        public Task<List<FanRankedBikeMatch>> GetTopByFansAsync(
            int limit,
            CancellationToken ct = default,
            bool includeTestData = false)
        {
            TopFansLimit = limit;
            return Task.FromResult(
                bikes.Select(b => new FanRankedBikeMatch(b, 12, 4.26m)).ToList());
        }

        public void AssertTopFansLimit(int expected) => Assert.Equal(expected, TopFansLimit);

        public Task<List<DailyInterestRankedBikeMatch>> GetTopByDailyInterestAsync(
            DateOnly day,
            int limit,
            CancellationToken ct = default,
            bool includeTestData = false)
        {
            DailyInterestDay = day;
            DailyInterestLimit = limit;
            return Task.FromResult(
                bikes.Select(b => new DailyInterestRankedBikeMatch(b, 23)).ToList());
        }

        public void AssertDailyInterestQuery(DateOnly expectedDay, int expectedLimit)
        {
            Assert.Equal(expectedDay, DailyInterestDay);
            Assert.Equal(expectedLimit, DailyInterestLimit);
        }
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
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
            CancellationToken ct = default,
            bool includeTestData = false) =>
            Task.FromResult(new List<PopularComparisonMatch>());

        public Task RecordAsync(IEnumerable<(int BikeAId, int BikeBId)> pairs, CancellationToken ct = default) =>
            Task.CompletedTask;

        public Task<List<ComparedBikeMatch>> GetMostComparedWithAsync(
            int bikeId,
            int limit,
            CancellationToken ct = default,
            bool includeTestData = false) =>
            Task.FromResult(new List<ComparedBikeMatch>());
    }
}
