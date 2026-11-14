using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IAnalyticsRepository
{
    Task<bool> RecordAsync(AnalyticsEventRequest request, CancellationToken ct);
    Task<AnalyticsDashboardResponse> GetDashboardAsync(DateOnly from, DateOnly to, CancellationToken ct);
    Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct);
}
