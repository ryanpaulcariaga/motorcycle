using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class AdminRoleRepository : IAdminRoleRepository
{
    private readonly MotorcycleDbContext _context;

    public AdminRoleRepository(MotorcycleDbContext context) => _context = context;

    public Task<List<AdminRole>> GetAllAsync(CancellationToken ct = default) =>
        _context.AdminRoles.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);

    public Task<AdminRole?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.AdminRoles.SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<AdminRole?> GetByFacebookUserIdAsync(string facebookUserId, CancellationToken ct = default) =>
        _context.AdminRoles.SingleOrDefaultAsync(x => x.FacebookUserId == facebookUserId, ct);

    public Task<bool> IsActiveAdministratorUserAsync(
        int userId,
        CancellationToken ct = default) =>
        (from role in _context.AdminRoles
         from user in _context.Users.Where(user => user.Id == userId)
         where role.IsActive &&
             role.Role == Domain.AdminRoles.Administrator &&
             (_context.UserExternalLogins.Any(login =>
                 login.UserId == userId &&
                 login.Provider == ExternalAuthProviders.Facebook &&
                 login.ProviderUserId == role.FacebookUserId) ||
              user.EmailVerified &&
              user.Email != null &&
              role.EmailSnapshot != null &&
              user.Email.ToLower() == role.EmailSnapshot.ToLower())
         select role.Id).AnyAsync(ct);

    public Task<bool> CanViewTestDataAsync(
        int userId,
        CancellationToken ct = default) =>
        (from role in _context.AdminRoles
         from user in _context.Users.Where(user => user.Id == userId)
         where role.IsActive &&
             user.IsActive &&
             role.IncludeTestData &&
             role.Role == Domain.AdminRoles.Administrator &&
             (_context.UserExternalLogins.Any(login =>
                 login.UserId == userId &&
                 login.Provider == ExternalAuthProviders.Facebook &&
                 login.ProviderUserId == role.FacebookUserId) ||
              user.EmailVerified &&
              user.Email != null &&
              role.EmailSnapshot != null &&
              user.Email.ToLower() == role.EmailSnapshot.ToLower())
         select role.Id).AnyAsync(ct);

    public async Task AddAsync(AdminRole role, CancellationToken ct = default) =>
        await _context.AdminRoles.AddAsync(role, ct);

    public void Remove(AdminRole role) => _context.AdminRoles.Remove(role);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
