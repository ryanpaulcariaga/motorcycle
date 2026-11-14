using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class UserInterestRepository(MotorcycleDbContext db, TimeProvider clock) : IUserInterestRepository
{
    public async Task<bool?> GetPreferenceAsync(int userId, CancellationToken ct) =>
        await db.Users.AsNoTracking().Where(u => u.Id == userId && u.IsActive)
            .Select(u => (bool?)u.InterestTrackingEnabled).SingleOrDefaultAsync(ct);

    public async Task<bool> SetPreferenceAsync(int userId, bool enabled, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var user = await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE id = {userId} FOR UPDATE").AsNoTracking().SingleOrDefaultAsync(ct);
        if (user is null || !user.IsActive)
        {
            return false;
        }
        await db.Users.Where(u => u.Id == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.InterestTrackingEnabled, enabled), ct);
        if (!enabled)
        {
            await db.UserInterestDailyCounts.Where(x => x.UserId == userId).ExecuteDeleteAsync(ct);
        }
        await transaction.CommitAsync(ct);
        return true;
    }

    public async Task<UserInterestRecordResult> RecordAsync(int userId, UserInterestEventRequest request, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var user = await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE id = {userId} FOR UPDATE").AsNoTracking().SingleOrDefaultAsync(ct);
        if (user is null || !user.IsActive)
        {
            return UserInterestRecordResult.InactiveUser;
        }
        if (!user.InterestTrackingEnabled)
        {
            return UserInterestRecordResult.NotEnabled;
        }
        var ids = request.BikeIds ?? (request.Type is "bike_view" or "bike_search_selection" ? [request.Id!.Value] : []);
        if (ids.Length > 0 && await db.Bikes.CountAsync(b => ids.Contains(b.Id) && b.IsPublished, ct) != ids.Length ||
            request.Type == "brand_filter" && !await db.Brands.AnyAsync(b => b.Id == request.Id, ct) ||
            request.Type == "category_filter" && !await db.Categories.AnyAsync(c => c.Id == request.Id, ct))
        {
            return UserInterestRecordResult.Invalid;
        }
        if (ids.Length == 0)
        {
            ids = [request.Id!.Value];
        }
        var day = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        foreach (var id in ids.Order())
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO user_interest_daily_counts (user_id, day, metric, catalog_id, count)
                VALUES ({userId}, {day}, {request.Type}, {id}, 1)
                ON CONFLICT (user_id, day, metric, catalog_id)
                DO UPDATE SET count = user_interest_daily_counts.count + 1
                """, ct);
        }
        await transaction.CommitAsync(ct);
        return UserInterestRecordResult.Recorded;
    }

    public async Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct) =>
        await db.UserInterestDailyCounts.Where(x => x.Day < cutoff).ExecuteDeleteAsync(ct);
}
