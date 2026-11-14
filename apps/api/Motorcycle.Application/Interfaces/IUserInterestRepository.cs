using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IUserInterestRepository
{
    Task<bool?> GetPreferenceAsync(int userId, CancellationToken ct);
    Task<bool> SetPreferenceAsync(int userId, bool enabled, CancellationToken ct);
    Task<UserInterestRecordResult> RecordAsync(int userId, UserInterestEventRequest request, CancellationToken ct);
    Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct);
}

public enum UserInterestRecordResult
{
    Recorded,
    Invalid,
    NotEnabled,
    InactiveUser
}
