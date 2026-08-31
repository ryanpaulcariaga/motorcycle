using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public class BikeRepository : IBikeRepository
{
    private readonly MotorcycleDbContext _context;

    public BikeRepository(MotorcycleDbContext context)
    {
        _context = context;
    }

    public async Task<List<Bike>> GetPublishedWithStaticFiltersAsync(
        Guid? brandId, Guid? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default)
    {
        var query = _context.Bikes
            .Include(b => b.Brand)
            .Include(b => b.Category)
            .Include(b => b.Images)
            .Where(b => b.IsPublished);

        if (brandId.HasValue) query = query.Where(b => b.BrandId == brandId.Value);
        if (categoryId.HasValue) query = query.Where(b => b.CategoryId == categoryId.Value);
        if (yearMin.HasValue) query = query.Where(b => b.Year >= yearMin.Value);
        if (yearMax.HasValue) query = query.Where(b => b.Year <= yearMax.Value);
        if (priceMin.HasValue) query = query.Where(b => b.MsrpPrice >= priceMin.Value);
        if (priceMax.HasValue) query = query.Where(b => b.MsrpPrice <= priceMax.Value);

        return await query.ToListAsync(ct);
    }

    public async Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _context.Bikes
            .Include(b => b.Brand)
            .Include(b => b.Category)
            .Include(b => b.Images)
            .FirstOrDefaultAsync(b => b.Slug == slug && b.IsPublished, ct);
    }

    public async Task<List<Bike>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var idList = ids.ToList();
        return await _context.Bikes
            .Include(b => b.Brand)
            .Include(b => b.Category)
            .Include(b => b.Images)
            .Where(b => idList.Contains(b.Id) && b.IsPublished)
            .ToListAsync(ct);
    }
}
