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
        string? search, int? brandId, int? categoryId, int? yearMin, int? yearMax,
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default)
    {
        var query = _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => b.IsPublished);

        if (!string.IsNullOrWhiteSpace(search)) {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(b =>
                EF.Functions.ILike(b.Model.Name, pattern) ||
                EF.Functions.ILike(b.VariantName, pattern) ||
                EF.Functions.ILike(b.Model.Brand.Name, pattern));
        }

        if (brandId.HasValue) {
            query = query.Where(b => b.Model.BrandId == brandId.Value);
        }

        if (categoryId.HasValue) {
            query = query.Where(b => b.Model.CategoryId == categoryId.Value);
        }

        if (yearMin.HasValue) {
            query = query.Where(b => b.Year >= yearMin.Value);
        }

        if (yearMax.HasValue) {
            query = query.Where(b => b.Year <= yearMax.Value);
        }

        if (priceMin.HasValue) {
            query = query.Where(b => b.MsrpPrice >= priceMin.Value);
        }

        if (priceMax.HasValue) {
            query = query.Where(b => b.MsrpPrice <= priceMax.Value);
        }

        return await query.ToListAsync(ct);
    }

    public async Task<Bike?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .FirstOrDefaultAsync(b => b.Slug == slug && b.IsPublished, ct);
    }

    public async Task<List<Bike>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
    {
        var idList = ids.ToList();
        return await _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => idList.Contains(b.Id) && b.IsPublished)
            .ToListAsync(ct);
    }

    public async Task<List<FanRankedBikeMatch>> GetTopByFansAsync(
        int limit,
        CancellationToken ct = default)
    {
        var rows = await _context.BikeComments
            .AsNoTracking()
            .Where(review => review.Bike.IsPublished && review.User.IsActive)
            .GroupBy(review => review.BikeId)
            .Select(group => new
            {
                BikeId = group.Key,
                FanCount = group.Count(),
                AverageRating = group.Average(review => (decimal)review.Rating)
            })
            .OrderByDescending(row => row.FanCount)
            .ThenByDescending(row => row.AverageRating)
            .ThenBy(row => row.BikeId)
            .Take(limit)
            .ToListAsync(ct);

        var ids = rows.Select(row => row.BikeId).ToList();
        var bikes = await _context.Bikes
            .AsNoTracking()
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => ids.Contains(b.Id) && b.IsPublished)
            .ToDictionaryAsync(b => b.Id, ct);

        return rows
            .Select(row => new FanRankedBikeMatch(
                bikes[row.BikeId],
                row.FanCount,
                row.AverageRating))
            .ToList();
    }
}
