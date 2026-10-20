using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public class BikeComparisonRepository : IBikeComparisonRepository
{
    private readonly MotorcycleDbContext _context;

    public BikeComparisonRepository(MotorcycleDbContext context)
    {
        _context = context;
    }

    public async Task RecordAsync(IEnumerable<(int BikeAId, int BikeBId)> pairs, CancellationToken ct = default)
    {
        foreach (var (a, b) in pairs) {
            // Atomic upsert keeps the counter correct under concurrent comparisons.
            await _context.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO bike_comparisons (bike_a_id, bike_b_id, compare_count, first_compared_at, last_compared_at)
                VALUES ({a}, {b}, 1, now(), now())
                ON CONFLICT (bike_a_id, bike_b_id) DO UPDATE
                SET compare_count = bike_comparisons.compare_count + 1,
                    last_compared_at = now()", ct);
        }
    }

    public async Task<List<PopularComparisonMatch>> GetMostComparedPairsAsync(int limit, CancellationToken ct = default)
    {
        var rows = await _context.BikeComparisons
            .Where(c => _context.Bikes.Any(b => b.Id == c.BikeAId && b.IsPublished)
                && _context.Bikes.Any(b => b.Id == c.BikeBId && b.IsPublished))
            .OrderByDescending(c => c.CompareCount)
            .ThenByDescending(c => c.LastComparedAt)
            .Take(limit)
            .Select(c => new { c.BikeAId, c.BikeBId, c.CompareCount })
            .ToListAsync(ct);

        var ids = rows.SelectMany(r => new[] { r.BikeAId, r.BikeBId }).Distinct().ToList();
        var bikes = await _context.Bikes
            .Include(b => b.Model).ThenInclude(m => m.Brand)
            .Include(b => b.Model).ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => ids.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, ct);

        return rows.Select(r => new PopularComparisonMatch(bikes[r.BikeAId], bikes[r.BikeBId], r.CompareCount)).ToList();
    }

    public async Task<List<ComparedBikeMatch>> GetMostComparedWithAsync(int bikeId, int limit, CancellationToken ct = default)
    {
        var rows = await _context.BikeComparisons
            .Where(c => c.BikeAId == bikeId || c.BikeBId == bikeId)
            .Select(c => new
            {
                OtherId = c.BikeAId == bikeId ? c.BikeBId : c.BikeAId,
                c.CompareCount,
                c.LastComparedAt
            })
            .Join(_context.Bikes.Where(b => b.IsPublished), r => r.OtherId, b => b.Id, (r, b) => new { r.CompareCount, r.LastComparedAt, b.Id })
            .OrderByDescending(r => r.CompareCount)
            .ThenByDescending(r => r.LastComparedAt)
            .Take(limit)
            .ToListAsync(ct);

        var ids = rows.Select(r => r.Id).ToList();
        var bikes = await _context.Bikes
            .Include(b => b.Model).ThenInclude(m => m.Brand)
            .Include(b => b.Model).ThenInclude(m => m.Category)
            .Include(b => b.Images)
            .Where(b => ids.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, ct);

        return rows.Select(r => new ComparedBikeMatch(bikes[r.Id], r.CompareCount)).ToList();
    }
}
