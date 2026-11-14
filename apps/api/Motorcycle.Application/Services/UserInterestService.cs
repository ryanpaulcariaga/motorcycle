using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IUserInterestService
{
    Task<bool?> GetPreferenceAsync(int userId, CancellationToken ct);
    Task<bool> SetPreferenceAsync(int userId, bool enabled, CancellationToken ct);
    Task<UserInterestRecordResult> RecordAsync(int userId, UserInterestEventRequest request, CancellationToken ct);
    Task DeleteExpiredAsync(CancellationToken ct);
}

public sealed class UserInterestService(IUserInterestRepository repository, TimeProvider clock) : IUserInterestService
{
    public Task<bool?> GetPreferenceAsync(int userId, CancellationToken ct) => repository.GetPreferenceAsync(userId, ct);
    public Task<bool> SetPreferenceAsync(int userId, bool enabled, CancellationToken ct) => repository.SetPreferenceAsync(userId, enabled, ct);

    public Task<UserInterestRecordResult> RecordAsync(int userId, UserInterestEventRequest request, CancellationToken ct)
    {
        var valid = request.Type switch
        {
            "bike_view" or "bike_search_selection" or "brand_filter" or "category_filter" =>
                request.Id > 0 && request.BikeIds is null,
            "comparison" => request.Id is null && request.BikeIds is { Length: >= 2 and <= 25 } &&
                request.BikeIds.All(id => id > 0) && request.BikeIds.Distinct().Count() == request.BikeIds.Length,
            _ => false
        };
        return valid ? repository.RecordAsync(userId, request, ct) : Task.FromResult(UserInterestRecordResult.Invalid);
    }

    public Task DeleteExpiredAsync(CancellationToken ct) =>
        repository.DeleteBeforeAsync(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime).AddMonths(-12), ct);
}
