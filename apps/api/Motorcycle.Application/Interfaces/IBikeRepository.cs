using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public record FanRankedBikeMatch(Bike Bike, int FanCount, decimal AverageRating);
public record DailyInterestRankedBikeMatch(Bike Bike, long ViewCount);

public interface IBikeRepository
{
    Task<List<Bike>> GetWithStaticFiltersAsync(
        string? search, int? brandId, int? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default,
        bool includeTestData = false, bool includeDiscontinued = false);

    Task<Bike?> GetBySlugAsync(
        string slug,
        CancellationToken ct = default,
        bool includeTestData = false,
        bool isPublished = true);

    Task<List<Bike>> GetByIdsAsync(
        IEnumerable<int> ids,
        CancellationToken ct = default,
        bool includeTestData = false);

    Task<List<FanRankedBikeMatch>> GetTopByFansAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);

    Task<List<DailyInterestRankedBikeMatch>> GetTopByDailyInterestAsync(
        DateOnly day,
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);
}
