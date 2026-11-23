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
        CancellationToken ct,
        bool includeTestData = false)
    {
        if (!await IsPubliclyAvailableAsync(bikeId, ct, includeTestData))
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
                c.ParentCommentId,
                c.User.DisplayName ?? "MotoCompare rider",
                c.Body,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false)
    {
        if (!await IsPubliclyAvailableAsync(bikeId, ct, includeTestData))
        {
            return null;
        }

        return await db.BikeDiscussionComments.AsNoTracking()
            .Where(c => c.BikeId == bikeId && c.UserId == userId && c.User.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .Select(c => new BikeCommentDto(
                c.Id,
                c.ParentCommentId,
                c.User.DisplayName ?? "MotoCompare rider",
                c.Body,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }

    public async Task<BikeCommentDto?> CreateAsync(
        int bikeId,
        int userId,
        int? parentCommentId,
        string body,
        CancellationToken ct,
        bool includeTestData = false)
    {
        if (!await IsPubliclyAvailableAsync(bikeId, ct, includeTestData) ||
            !await db.Users.AnyAsync(u => u.Id == userId && u.IsActive, ct))
        {
            return null;
        }

        if (parentCommentId.HasValue &&
            !await db.BikeDiscussionComments.AnyAsync(c =>
                c.Id == parentCommentId &&
                c.BikeId == bikeId &&
                c.ParentCommentId == null &&
                c.User.IsActive, ct))
        {
            return null;
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var comment = new BikeDiscussionComment
        {
            BikeId = bikeId,
            UserId = userId,
            ParentCommentId = parentCommentId,
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
        return new BikeCommentDto(
            comment.Id,
            comment.ParentCommentId,
            authorName,
            comment.Body,
            comment.CreatedAt,
            comment.UpdatedAt);
    }

    public async Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        string body,
        CancellationToken ct,
        bool includeTestData = false)
    {
        var comment = await db.BikeDiscussionComments
            .Include(c => c.User)
            .SingleOrDefaultAsync(c =>
                c.Id == commentId &&
                c.BikeId == bikeId &&
                c.UserId == userId &&
                c.User.IsActive &&
                ((c.Bike.IsPublished &&
                  !c.Bike.IsTestData &&
                  !c.Bike.Model.IsTestData) ||
                 (includeTestData &&
                  (c.Bike.IsTestData || c.Bike.Model.IsTestData))), ct);
        if (comment is null)
        {
            return null;
        }

        comment.Body = body;
        comment.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(ct);
        return new BikeCommentDto(
            comment.Id,
            comment.ParentCommentId,
            comment.User.DisplayName ?? "MotoCompare rider",
            comment.Body,
            comment.CreatedAt,
            comment.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(
        int bikeId,
        int commentId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false)
    {
        var comment = await db.BikeDiscussionComments.SingleOrDefaultAsync(c =>
            c.Id == commentId &&
            c.BikeId == bikeId &&
            c.UserId == userId &&
            c.User.IsActive &&
            ((c.Bike.IsPublished &&
              !c.Bike.IsTestData &&
              !c.Bike.Model.IsTestData) ||
             (includeTestData &&
              (c.Bike.IsTestData || c.Bike.Model.IsTestData))), ct);
        if (comment is null)
        {
            return false;
        }

        db.BikeDiscussionComments.Remove(comment);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private Task<bool> IsPubliclyAvailableAsync(
        int bikeId,
        CancellationToken ct,
        bool includeTestData) =>
        db.Bikes.AsNoTracking().AnyAsync(
            b => b.Id == bikeId &&
                ((b.IsPublished && !b.IsTestData && !b.Model.IsTestData) ||
                 (includeTestData && (b.IsTestData || b.Model.IsTestData))),
            ct);
}
