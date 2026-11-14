using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IAnalyticsService
{
    Task<bool> RecordAsync(AnalyticsEventRequest request, CancellationToken ct);
    Task<AnalyticsDashboardResponse> GetDashboardAsync(DateOnly from, DateOnly to, CancellationToken ct);
    Task DeleteExpiredAsync(CancellationToken ct);
}

public sealed class AnalyticsService(IAnalyticsRepository repository, TimeProvider clock) : IAnalyticsService
{
    public Task<bool> RecordAsync(AnalyticsEventRequest request, CancellationToken ct)
    {
        var valid = request.Type switch
        {
            "bike_view" or "brand_filter" or "category_filter" =>
                request.Id > 0 && request.BikeIds is null && request.ZeroResults is null,
            "comparison" =>
                request.Id is null && request.ZeroResults is null &&
                request.BikeIds is { Length: >= 2 and <= 25 } &&
                request.BikeIds.All(id => id > 0) &&
                request.BikeIds.Distinct().Count() == request.BikeIds.Length,
            "search" => request.Id is null && request.BikeIds is null && request.ZeroResults.HasValue,
            _ => false
        };
        return valid ? repository.RecordAsync(request, ct) : Task.FromResult(false);
    }

    public Task<AnalyticsDashboardResponse> GetDashboardAsync(DateOnly from, DateOnly to, CancellationToken ct) =>
        repository.GetDashboardAsync(from, to, ct);

    public Task DeleteExpiredAsync(CancellationToken ct) =>
        repository.DeleteBeforeAsync(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime).AddMonths(-12), ct);
}
