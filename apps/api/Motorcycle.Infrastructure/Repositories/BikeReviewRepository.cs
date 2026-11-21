using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BikeReviewRepository(MotorcycleDbContext db, TimeProvider clock) : IBikeReviewRepository
{
    public async Task<BikeReviewsDto?> GetByBikeAsync(int bikeId, CancellationToken ct)
    {
        if (!await db.Bikes.AsNoTracking().AnyAsync(b => b.Id == bikeId && b.IsPublished, ct))
        {
            return null;
        }

        var reviews = await db.BikeComments.AsNoTracking()
            .Where(r => r.BikeId == bikeId && r.User.IsActive)
            .OrderByDescending(r => r.UpdatedAt)
            .ThenByDescending(r => r.Id)
            .Select(r => new BikeReviewDto(
                r.Id,
                r.User.DisplayName ?? "MotoCompare rider",
                r.Rating,
                r.Body,
                r.CreatedAt,
                r.UpdatedAt))
            .ToListAsync(ct);

        var average = reviews.Count == 0
            ? (decimal?)null
            : Math.Round(reviews.Average(r => (decimal)r.Rating), 1);
        return new BikeReviewsDto(average, reviews.Count, reviews);
    }

    public Task<BikeReviewDto?> GetByUserAsync(int bikeId, int userId, CancellationToken ct) =>
        db.BikeComments.AsNoTracking()
            .Where(r => r.BikeId == bikeId && r.UserId == userId && r.Bike.IsPublished && r.User.IsActive)
            .Select(r => new BikeReviewDto(
                r.Id,
                r.User.DisplayName ?? "MotoCompare rider",
                r.Rating,
                r.Body,
                r.CreatedAt,
                r.UpdatedAt))
            .SingleOrDefaultAsync(ct);

    public async Task<BikeReviewWriteResult> UpsertAsync(
        int bikeId,
        int userId,
        int rating,
        string? body,
        CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        if (!await db.Bikes.AnyAsync(b => b.Id == bikeId && b.IsPublished, ct) ||
            !await db.Users.AnyAsync(u => u.Id == userId && u.IsActive, ct))
        {
            return BikeReviewWriteResult.Unavailable;
        }

        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO bike_comments (bike_id, user_id, rating, body, created_at, updated_at)
            VALUES ({bikeId}, {userId}, {rating}, {body}, {now}, {now})
            ON CONFLICT (bike_id, user_id)
            DO UPDATE SET
                rating = EXCLUDED.rating,
                body = EXCLUDED.body,
                updated_at = EXCLUDED.updated_at
            """, ct);
        return BikeReviewWriteResult.Saved;
    }

    public async Task<bool> DeleteAsync(int bikeId, int userId, CancellationToken ct)
    {
        var review = await db.BikeComments.SingleOrDefaultAsync(
            r => r.BikeId == bikeId && r.UserId == userId && r.User.IsActive && r.Bike.IsPublished, ct);
        if (review is null)
        {
            return false;
        }

        db.BikeComments.Remove(review);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
