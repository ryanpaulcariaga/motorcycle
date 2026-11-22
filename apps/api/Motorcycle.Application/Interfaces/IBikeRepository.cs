using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public record FanRankedBikeMatch(Bike Bike, int FanCount, decimal AverageRating);

public interface IBikeRepository
{
    Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
        string? search, int? brandId, int? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default);

    Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<List<Bike>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);

    Task<List<FanRankedBikeMatch>> GetTopByFansAsync(int limit, CancellationToken ct = default);
}
