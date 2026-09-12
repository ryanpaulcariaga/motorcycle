using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBikeRepository
{
    Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
        int? brandId, int? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default);

    Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<List<Bike>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);
}
