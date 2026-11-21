using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public sealed class UserPrivacyService(IUserPrivacyRepository repository, TimeProvider clock) : IUserPrivacyService
{
    public Task<UserDataExportDto?> ExportAsync(int userId, CancellationToken ct = default) =>
        repository.ExportAsync(userId, clock.GetUtcNow().UtcDateTime, ct);

    public Task<bool> DeleteAsync(int userId, CancellationToken ct = default) =>
        repository.DeleteAsync(userId, ct);
}
