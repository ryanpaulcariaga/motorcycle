using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface ISpecGroupAdminRepository
{
    Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default);
    Task<SpecGroup?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> CodeExistsAsync(string code, int? excludingId = null, CancellationToken ct = default);
    Task<int> CountDefinitionsAsync(int groupId, CancellationToken ct = default);
    Task AddAsync(SpecGroup group, CancellationToken ct = default);
    void Remove(SpecGroup group);
    Task SaveChangesAsync(CancellationToken ct = default);
}
