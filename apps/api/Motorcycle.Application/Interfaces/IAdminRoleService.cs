using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IAdminRoleService
{
    Task<IReadOnlyList<AdminRole>> GetAllAsync(CancellationToken ct = default);
    Task<AdminRole> BootstrapAsync(string facebookUserId, string? email, string? displayName, CancellationToken ct = default);
    Task<AdminRole> ProvisionAsync(string facebookUserId, string? email, string? displayName, string role, bool includeTestData, CancellationToken ct = default);
    Task<AdminRole> UpdateAsync(int id, string? email, string? displayName, string role, bool isActive, bool includeTestData, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
