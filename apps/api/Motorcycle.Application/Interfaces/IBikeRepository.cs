using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBikeRepository
{
    Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
        Guid? brandId, Guid? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default);

    Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<List<Bike>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
}
