using Motorcycle.Application.Services;

namespace Motorcycle.Api;

public sealed class AnalyticsRetentionService(IServiceScopeFactory scopeFactory, ILogger<AnalyticsRetentionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        do
        {
            foreach (var serviceType in new[] { typeof(IAnalyticsService), typeof(IUserInterestService) })
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    if (serviceType == typeof(IAnalyticsService))
                    {
                        await scope.ServiceProvider.GetRequiredService<IAnalyticsService>().DeleteExpiredAsync(stoppingToken);
                    }
                    else
                    {
                        await scope.ServiceProvider.GetRequiredService<IUserInterestService>().DeleteExpiredAsync(stoppingToken);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to delete expired counts for {ServiceType}.", serviceType.Name);
                }
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
