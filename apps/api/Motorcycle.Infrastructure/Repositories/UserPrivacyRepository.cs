using System.Data;
using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class UserPrivacyRepository(MotorcycleDbContext context) : IUserPrivacyRepository
{
    public async Task<UserDataExportDto?> ExportAsync(
        int userId,
        DateTime generatedAtUtc,
        CancellationToken ct = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead,
            ct);
        var account = await context.Users
            .AsNoTracking()
            .Where(x => x.Id == userId && x.IsActive)
            .Select(x => new UserAccountExportDto(
                x.Id,
                x.Email,
                x.EmailVerified,
                x.DisplayName,
                x.InterestTrackingEnabled,
                x.CreatedAt,
                x.UpdatedAt))
            .SingleOrDefaultAsync(ct);
        if (account is null)
        {
            await transaction.RollbackAsync(ct);
            return null;
        }

        var externalLogins = await context.UserExternalLogins
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new UserExternalLoginExportDto(
                x.Provider,
                x.ProviderUserId,
                x.EmailAtProvider,
                x.CreatedAt))
            .ToListAsync(ct);
        var interestActivity = await context.UserInterestDailyCounts
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Day)
            .ThenBy(x => x.Metric)
            .ThenBy(x => x.CatalogId)
            .Select(x => new UserInterestExportDto(x.Day, x.Metric, x.CatalogId, x.Count))
            .ToListAsync(ct);
        var reviews = await context.BikeComments
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new UserReviewExportDto(
                x.Id,
                x.BikeId,
                x.Rating,
                x.Body,
                x.CreatedAt,
                x.UpdatedAt))
            .ToListAsync(ct);
        var comments = await context.BikeDiscussionComments
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new UserDiscussionCommentExportDto(
                x.Id,
                x.BikeId,
                x.Body,
                x.CreatedAt,
                x.UpdatedAt))
            .ToListAsync(ct);

        var export = new UserDataExportDto(
            "1.0",
            generatedAtUtc,
            account,
            externalLogins,
            interestActivity,
            reviews,
            comments);
        await transaction.CommitAsync(ct);
        return export;
    }

    public async Task<bool> DeleteAsync(int userId, CancellationToken ct = default)
    {
        var user = await context.Users.SingleOrDefaultAsync(x => x.Id == userId && x.IsActive, ct);
        if (user is null)
        {
            return false;
        }

        context.Users.Remove(user);
        await context.SaveChangesAsync(ct);
        return true;
    }
}
