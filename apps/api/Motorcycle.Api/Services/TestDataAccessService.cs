using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Services;

public sealed class TestDataAccessService(
    IAdminRoleRepository roles,
    IMemoryCache cache,
    ILogger<TestDataAccessService> logger)
{
    private const string RequestResultKey = "test-data-access-result";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(5);
    private static long _cacheGeneration;

    public async Task<bool> CanViewAsync(
        HttpContext httpContext,
        CancellationToken ct)
    {
        if (httpContext.Items.TryGetValue(RequestResultKey, out var requestResult) &&
            requestResult is Task<bool> cachedResult) {
            return await cachedResult;
        }

        var resultTask = ResolveAsync(httpContext, ct);
        httpContext.Items[RequestResultKey] = resultTask;
        return await resultTask;
    }

    public void InvalidateAll() =>
        Interlocked.Increment(ref _cacheGeneration);

    public void InvalidateUser(int userId) =>
        cache.Remove(CacheKey(userId));

    private async Task<bool> ResolveAsync(
        HttpContext httpContext,
        CancellationToken ct)
    {
        var authentication = await httpContext.AuthenticateAsync(
            Controllers.UserAuthenticationController.SchemeName);
        if (authentication.Failure is not null) {
            logger.LogDebug(
                authentication.Failure,
                "The public-user cookie could not be authenticated.");
        }
        var subject = authentication.Principal?.FindFirst("sub")?.Value;
        if (!authentication.Succeeded ||
            !int.TryParse(subject, out var userId)) {
            return false;
        }

        var cacheKey = CacheKey(userId);
        var cached = cache.GetOrCreate(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return new Lazy<Task<bool>>(
                () => roles.CanViewTestDataAsync(userId, ct),
                LazyThreadSafetyMode.ExecutionAndPublication);
        });
        bool allowed;
        try {
            allowed = await cached!.Value;
        } catch (OperationCanceledException) {
            cache.Remove(cacheKey);
            throw;
        }

        logger.LogDebug(
            "Public test-data access evaluated for user {UserId}: {Allowed}.",
            userId,
            allowed);
        return allowed;
    }

    private static string CacheKey(int userId) =>
        $"test-data-access:{Volatile.Read(ref _cacheGeneration)}:{userId}";
}
