using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BikeCommentRepository(MotorcycleDbContext db, TimeProvider clock) : IBikeCommentRepository
{
    public async Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(
        int bikeId,
        int limit,
        CancellationToken ct)
    {
        if (!await db.Bikes.AsNoTracking().AnyAsync(b => b.Id == bikeId && b.IsPublished, ct))
        {
            return null;
        }

        return await db.BikeDiscussionComments.AsNoTracking()
            .Where(c => c.BikeId == bikeId && c.User.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .Take(limit)
            .Select(c => new BikeCommentDto(
                c.Id,
                c.User.DisplayName ?? "MotoCompare rider",
                c.Body,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct)
    {
        if (!await db.Bikes.AsNoTracking().AnyAsync(b => b.Id == bikeId && b.IsPublished, ct))
        {
            return null;
        }

        return await db.BikeDiscussionComments.AsNoTracking()
            .Where(c => c.BikeId == bikeId && c.UserId == userId && c.User.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .Select(c => new BikeCommentDto(
                c.Id,
                c.User.DisplayName ?? "MotoCompare rider",
                c.Body,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }

    public async Task<BikeCommentDto?> CreateAsync(
        int bikeId,
        int userId,
        string body,
        CancellationToken ct)
    {
        if (!await db.Bikes.AnyAsync(b => b.Id == bikeId && b.IsPublished, ct) ||
            !await db.Users.AnyAsync(u => u.Id == userId && u.IsActive, ct))
        {
            return null;
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var comment = new BikeDiscussionComment
        {
            BikeId = bikeId,
            UserId = userId,
            Body = body,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.BikeDiscussionComments.Add(comment);
        await db.SaveChangesAsync(ct);
        var authorName = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.DisplayName ?? "MotoCompare rider")
            .SingleAsync(ct);
        return new BikeCommentDto(comment.Id, authorName, comment.Body, comment.CreatedAt, comment.UpdatedAt);
    }

    public async Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        string body,
        CancellationToken ct)
    {
        var comment = await db.BikeDiscussionComments
            .Include(c => c.User)
            .SingleOrDefaultAsync(c =>
                c.Id == commentId &&
                c.BikeId == bikeId &&
                c.UserId == userId &&
                c.User.IsActive &&
                c.Bike.IsPublished, ct);
        if (comment is null)
        {
            return null;
        }

        comment.Body = body;
        comment.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(ct);
        return new BikeCommentDto(
            comment.Id,
            comment.User.DisplayName ?? "MotoCompare rider",
            comment.Body,
            comment.CreatedAt,
            comment.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(
        int bikeId,
        int commentId,
        int userId,
        CancellationToken ct)
    {
        var comment = await db.BikeDiscussionComments.SingleOrDefaultAsync(c =>
            c.Id == commentId &&
            c.BikeId == bikeId &&
            c.UserId == userId &&
            c.User.IsActive &&
            c.Bike.IsPublished, ct);
        if (comment is null)
        {
            return false;
        }

        db.BikeDiscussionComments.Remove(comment);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
