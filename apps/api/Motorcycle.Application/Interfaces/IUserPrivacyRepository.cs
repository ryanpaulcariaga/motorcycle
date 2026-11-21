using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IUserPrivacyRepository
{
    Task<UserDataExportDto?> ExportAsync(int userId, DateTime generatedAtUtc, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, CancellationToken ct = default);
}
