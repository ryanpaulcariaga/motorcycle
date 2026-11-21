using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IUserPrivacyService
{
    Task<UserDataExportDto?> ExportAsync(int userId, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, CancellationToken ct = default);
}
