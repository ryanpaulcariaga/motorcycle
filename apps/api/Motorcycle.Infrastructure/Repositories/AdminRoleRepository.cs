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

    public async Task AddAsync(AdminRole role, CancellationToken ct = default) =>
        await _context.AdminRoles.AddAsync(role, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
