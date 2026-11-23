using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IAdminRoleRepository
{
    Task<List<AdminRole>> GetAllAsync(CancellationToken ct = default);
    Task<AdminRole?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AdminRole?> GetByFacebookUserIdAsync(string facebookUserId, CancellationToken ct = default);
    Task<bool> IsActiveAdministratorUserAsync(int userId, CancellationToken ct = default);
    Task<bool> CanViewTestDataAsync(int userId, CancellationToken ct = default);
    Task AddAsync(AdminRole role, CancellationToken ct = default);
    void Remove(AdminRole role);
    Task SaveChangesAsync(CancellationToken ct = default);
}
