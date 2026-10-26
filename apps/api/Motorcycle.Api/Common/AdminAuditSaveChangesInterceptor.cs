using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Motorcycle.Domain;

namespace Motorcycle.Api.Common;

public sealed class AdminAuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminAuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor) =>
        _httpContextAccessor = httpContextAccessor;

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        AddAuditEntries(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AddAuditEntries(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private void AddAuditEntries(DbContext? db)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (db is null || httpContext is null ||
            !httpContext.Request.Path.StartsWithSegments("/api/admin") ||
            httpContext.User.Identity?.IsAuthenticated != true ||
            !string.Equals(
                httpContext.User.Identity.AuthenticationType,
                CookieAuthenticationDefaults.AuthenticationScheme,
                StringComparison.Ordinal)) {
            return;
        }

        var actorId = httpContext.User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(actorId)) {
            throw new InvalidOperationException("An authenticated admin mutation must have a subject claim to be audited.");
        }

        var entries = db.ChangeTracker.Entries()
            .Where(entry =>
                entry.Entity is not AdminAuditLog &&
                entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToArray();

        foreach (var entry in entries) {
            db.Set<AdminAuditLog>().Add(CreateAuditLog(entry, httpContext, actorId));
        }
    }

    private static AdminAuditLog CreateAuditLog(EntityEntry entry, HttpContext httpContext, string actorId)
    {
        var action = entry.State switch
        {
            EntityState.Added => "Created",
            EntityState.Modified => "Updated",
            EntityState.Deleted => "Deleted",
            _ => throw new InvalidOperationException("Only entity mutations can be audited."),
        };
        var changedProperties = entry.Properties
            .Where(property => entry.State != EntityState.Modified || property.IsModified)
            .Select(property => property.Metadata.Name)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();
        var primaryKey = entry.Metadata.FindPrimaryKey();
        var entityKey = entry.State == EntityState.Added || primaryKey is null
            ? null
            : string.Join(",", primaryKey.Properties.Select(property =>
                $"{property.Name}={entry.Property(property.Name).CurrentValue?.ToString() ?? "null"}"));

        return new AdminAuditLog
        {
            OccurredAt = DateTimeOffset.UtcNow,
            ActorId = actorId,
            ActorDisplayName = httpContext.User.Identity?.Name,
            Action = action,
            EntityType = entry.Metadata.ClrType.Name,
            EntityKey = entityKey,
            ChangedFields = string.Join(",", changedProperties),
            RequestId = httpContext.TraceIdentifier,
        };
    }
}
