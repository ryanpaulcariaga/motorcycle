using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class AnalyticsRepository(MotorcycleDbContext db, TimeProvider clock) : IAnalyticsRepository
{
    public async Task<bool> RecordAsync(AnalyticsEventRequest request, CancellationToken ct)
    {
        var ids = request.BikeIds ?? (request.Type == "bike_view" ? [request.Id!.Value] : []);
        if (ids.Length > 0 && await db.Bikes.CountAsync(b =>
            ids.Contains(b.Id) &&
            b.IsPublished &&
            !b.IsTestData &&
            !b.Model.IsTestData, ct) != ids.Length)
        {
            return false;
        }
        if (request.Type == "brand_filter" && !await db.Brands.AnyAsync(b => b.Id == request.Id, ct))
        {
            return false;
        }
        if (request.Type == "category_filter" && !await db.Categories.AnyAsync(c => c.Id == request.Id, ct))
        {
            return false;
        }

        var day = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await IncrementAsync(day, request.Type, request.Id ?? 0, 0, ct);
        if (request.Type == "search" && request.ZeroResults == true)
        {
            await IncrementAsync(day, "zero_results", 0, 0, ct);
        }
        if (request.Type == "comparison")
        {
            Array.Sort(ids);
            for (var i = 0; i < ids.Length; i++)
            {
                for (var j = i + 1; j < ids.Length; j++)
                {
                    await IncrementAsync(day, "comparison_pair", ids[i], ids[j], ct);
                }
            }
        }
        await transaction.CommitAsync(ct);
        return true;
    }

    private Task<int> IncrementAsync(DateOnly day, string metric, int dimension1, int dimension2, CancellationToken ct) =>
        db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO analytics_daily_counts (day, metric, dimension1, dimension2, count)
            VALUES ({day}, {metric}, {dimension1}, {dimension2}, 1)
            ON CONFLICT (day, metric, dimension1, dimension2)
            DO UPDATE SET count = analytics_daily_counts.count + 1
            """, ct);

    public async Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct) =>
        await db.AnalyticsDailyCounts.Where(x => x.Day < cutoff).ExecuteDeleteAsync(ct);

    public async Task<AnalyticsDashboardResponse> GetDashboardAsync(DateOnly from, DateOnly to, CancellationToken ct)
    {
        var rows = await db.AnalyticsDailyCounts.AsNoTracking()
            .Where(x => x.Day >= from && x.Day <= to).ToListAsync(ct);
        long Total(string metric) => rows.Where(x => x.Metric == metric).Sum(x => x.Count);
        var bikeIds = rows.Where(x => x.Metric is "bike_view" or "comparison_pair")
            .SelectMany(x => new[] { x.Dimension1, x.Dimension2 }).Where(x => x > 0).Distinct().ToArray();
        var bikes = await db.Bikes.AsNoTracking().Where(x => bikeIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.VariantName, ct);
        var brands = await db.Brands.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, ct);
        var categories = await db.Categories.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, ct);
        string Label(Dictionary<int, string> names, int id) => names.GetValueOrDefault(id) ?? $"Deleted #{id}";
        List<AnalyticsCountResponse> Counts(string metric, Dictionary<int, string> names) =>
            rows.Where(x => x.Metric == metric).GroupBy(x => x.Dimension1)
                .Select(g => new AnalyticsCountResponse(g.Key, Label(names, g.Key), g.Sum(x => x.Count)))
                .OrderByDescending(x => x.Count).ThenBy(x => x.Name).Take(20).ToList();
        var daily = rows.GroupBy(x => x.Day).OrderBy(g => g.Key)
            .Select(g => new AnalyticsDayResponse(g.Key,
                g.Where(x => x.Metric == "bike_view").Sum(x => x.Count),
                g.Where(x => x.Metric == "comparison").Sum(x => x.Count),
                g.Where(x => x.Metric == "search").Sum(x => x.Count),
                g.Where(x => x.Metric == "zero_results").Sum(x => x.Count))).ToList();
        var pairs = rows.Where(x => x.Metric == "comparison_pair")
            .GroupBy(x => new { x.Dimension1, x.Dimension2 })
            .Select(g => new AnalyticsPairResponse(g.Key.Dimension1, Label(bikes, g.Key.Dimension1),
                g.Key.Dimension2, Label(bikes, g.Key.Dimension2), g.Sum(x => x.Count)))
            .OrderByDescending(x => x.Count).ThenBy(x => x.BikeAId).ThenBy(x => x.BikeBId).Take(20).ToList();
        return new AnalyticsDashboardResponse(from, to, Total("bike_view"), Total("comparison"), Total("search"),
            Total("zero_results"), daily, Counts("bike_view", bikes), Counts("brand_filter", brands),
            Counts("category_filter", categories), pairs);
    }
}
