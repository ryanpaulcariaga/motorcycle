using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class SpecGroupAdminRepository : ISpecGroupAdminRepository
{
    private readonly MotorcycleDbContext _context;

    public SpecGroupAdminRepository(MotorcycleDbContext context) => _context = context;

    public Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default) =>
        _context.SpecGroups.Include(x => x.Definitions).OrderBy(x => x.SortOrder).ToListAsync(ct);

    public Task<SpecGroup?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.SpecGroups.Include(x => x.Definitions).SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> CodeExistsAsync(string code, int? excludingId = null, CancellationToken ct = default) =>
        _context.SpecGroups.AnyAsync(x => x.Code == code && (excludingId == null || x.Id != excludingId), ct);

    public Task<int> CountDefinitionsAsync(int groupId, CancellationToken ct = default) =>
        _context.SpecDefinitions.CountAsync(x => x.GroupId == groupId, ct);

    public async Task AddAsync(SpecGroup group, CancellationToken ct = default) =>
        await _context.SpecGroups.AddAsync(group, ct);

    public void Remove(SpecGroup group) => _context.SpecGroups.Remove(group);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
