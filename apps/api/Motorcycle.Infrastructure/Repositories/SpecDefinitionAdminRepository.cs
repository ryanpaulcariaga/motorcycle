using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class SpecDefinitionAdminRepository : ISpecDefinitionAdminRepository
{
    private readonly MotorcycleDbContext _context;

    public SpecDefinitionAdminRepository(MotorcycleDbContext context) => _context = context;

    public Task<List<SpecDefinition>> GetAllAsync(int? groupId = null, CancellationToken ct = default) =>
        _context.SpecDefinitions
            .Include(x => x.Group)
            .Where(x => groupId == null || x.GroupId == groupId)
            .OrderBy(x => x.GroupId).ThenBy(x => x.SortOrder)
            .ToListAsync(ct);

    public Task<SpecDefinition?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.SpecDefinitions.Include(x => x.Group).SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> GroupExistsAsync(int groupId, CancellationToken ct = default) =>
        _context.SpecGroups.AnyAsync(x => x.Id == groupId, ct);

    public Task<bool> CodeExistsAsync(string code, int? excludingId = null, CancellationToken ct = default) =>
        _context.SpecDefinitions.AnyAsync(x => x.Code == code && (excludingId == null || x.Id != excludingId), ct);

    // Bike.Specs is a JSONB column mapped through a value converter (not queryable via LINQ-to-SQL), so
    // this pulls every bike's spec map into memory and filters in C#. Admin-only, infrequent operation.
    public async Task<List<BikeSpecValue>> GetBikeValuesForCodeAsync(string code, CancellationToken ct = default)
    {
        var bikes = await _context.Bikes.AsNoTracking().Select(b => new { b.Id, b.Specs }).ToListAsync(ct);
        return bikes
            .Where(b => b.Specs.TryGetValue(code, out var value) && value is not null)
            .Select(b => new BikeSpecValue(b.Id, b.Specs[code]))
            .ToList();
    }

    public async Task AddAsync(SpecDefinition definition, CancellationToken ct = default) =>
        await _context.SpecDefinitions.AddAsync(definition, ct);

    // One-pass scan so listing N definitions doesn't require N separate bikes-table scans.
    public async Task<Dictionary<string, int>> CountBikesWithValueByCodeAsync(CancellationToken ct = default)
    {
        var bikes = await _context.Bikes.AsNoTracking().Select(b => b.Specs).ToListAsync(ct);
        var counts = new Dictionary<string, int>();
        foreach (var specs in bikes) {
            foreach (var (code, value) in specs) {
                if (value is null) {
                    continue;
                }

                counts[code] = counts.GetValueOrDefault(code) + 1;
            }
        }

        return counts;
    }

    public void Remove(SpecDefinition definition) => _context.SpecDefinitions.Remove(definition);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    public async Task SaveWithOptionalRenameAsync(SpecDefinition definition, string? renamedFromCode,
        IReadOnlyDictionary<int, object?>? convertedValues, string valueCode, CancellationToken ct = default)
    {
        if (convertedValues is { Count: > 0 }) {
            var ids = convertedValues.Keys.ToList();
            var bikes = await _context.Bikes.Where(b => ids.Contains(b.Id)).ToListAsync(ct);
            foreach (var bike in bikes) {
                // Replace the dictionary so EF detects the JSONB change.
                var specs = new Dictionary<string, object>(bike.Specs) { [valueCode] = convertedValues[bike.Id]! };
                bike.Specs = specs;
            }
        }

        if (string.IsNullOrEmpty(renamedFromCode) || renamedFromCode == definition.Code) {
            await _context.SaveChangesAsync(ct);
            return;
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        var allBikes = await _context.Bikes.ToListAsync(ct);
        foreach (var bike in allBikes) {
            if (!bike.Specs.TryGetValue(renamedFromCode, out var oldValue)) {
                continue;
            }

            var specs = new Dictionary<string, object>(bike.Specs);
            specs.Remove(renamedFromCode);
            specs[definition.Code] = oldValue;
            bike.Specs = specs;
        }

        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
