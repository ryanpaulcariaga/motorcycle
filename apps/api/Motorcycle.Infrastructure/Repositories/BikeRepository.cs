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
        decimal? priceMin, decimal? priceMax, CancellationToken ct = default,
        bool includeTestData = false)
    {
        var query = _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b =>
                (b.IsPublished && (!b.IsTestData && !b.Model.IsTestData)) ||
                (includeTestData && (b.IsTestData || b.Model.IsTestData)));

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

    public async Task<Bike?> GetBySlugAsync(
        string slug,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        return await _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .FirstOrDefaultAsync(
                b => b.Slug == slug &&
                    ((b.IsPublished && (!b.IsTestData && !b.Model.IsTestData)) ||
                     (includeTestData && (b.IsTestData || b.Model.IsTestData))),
                ct);
    }

    public async Task<List<Bike>> GetByIdsAsync(
        IEnumerable<int> ids,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var idList = ids.ToList();
        return await _context.Bikes
            .Include(b => b.Model)
                .ThenInclude(m => m.Brand)
            .Include(b => b.Model)
                .ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => idList.Contains(b.Id) &&
                ((b.IsPublished && (!b.IsTestData && !b.Model.IsTestData)) ||
                 (includeTestData && (b.IsTestData || b.Model.IsTestData))))
            .ToListAsync(ct);
    }

    public async Task<List<FanRankedBikeMatch>> GetTopByFansAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var rows = await _context.BikeComments
            .AsNoTracking()
            .Where(review =>
                ((review.Bike.IsPublished &&
                  !review.Bike.IsTestData &&
                  !review.Bike.Model.IsTestData) ||
                 (includeTestData &&
                  (review.Bike.IsTestData || review.Bike.Model.IsTestData))) &&
                review.User.IsActive)
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
            .Where(b => ids.Contains(b.Id) &&
                ((b.IsPublished && !b.IsTestData && !b.Model.IsTestData) ||
                 (includeTestData && (b.IsTestData || b.Model.IsTestData))))
            .ToDictionaryAsync(b => b.Id, ct);

        return rows
            .Select(row => new FanRankedBikeMatch(
                bikes[row.BikeId],
                row.FanCount,
                row.AverageRating))
            .ToList();
    }

    public async Task<List<DailyInterestRankedBikeMatch>> GetTopByDailyInterestAsync(
        DateOnly day,
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var rows = await (
            from activity in _context.AnalyticsDailyCounts.AsNoTracking()
            join bike in _context.Bikes on activity.Dimension1 equals bike.Id
            where activity.Day == day &&
                  activity.Metric == "bike_view" &&
                  ((bike.IsPublished && !bike.IsTestData && !bike.Model.IsTestData) ||
                   (includeTestData && (bike.IsTestData || bike.Model.IsTestData)))
            group activity by bike.Id into grouped
            orderby grouped.Sum(row => row.Count) descending, grouped.Key
            select new
            {
                BikeId = grouped.Key,
                ViewCount = grouped.Sum(row => row.Count)
            })
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
            .Where(b => ids.Contains(b.Id) &&
                ((b.IsPublished && !b.IsTestData && !b.Model.IsTestData) ||
                 (includeTestData && (b.IsTestData || b.Model.IsTestData))))
            .ToDictionaryAsync(b => b.Id, ct);

        return rows
            .Select(row => new DailyInterestRankedBikeMatch(
                bikes[row.BikeId],
                row.ViewCount))
            .ToList();
    }
}
