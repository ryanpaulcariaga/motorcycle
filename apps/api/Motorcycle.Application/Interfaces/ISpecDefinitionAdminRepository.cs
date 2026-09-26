using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public sealed record BikeSpecValue(int BikeId, object? Value);

public interface ISpecDefinitionAdminRepository
{
    Task<List<SpecDefinition>> GetAllAsync(int? groupId = null, CancellationToken ct = default);
    Task<SpecDefinition?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> GroupExistsAsync(int groupId, CancellationToken ct = default);
    Task<bool> CodeExistsAsync(string code, int? excludingId = null, CancellationToken ct = default);
    /// <summary>Every bike currently holding a non-null value under <paramref name="code"/>, used both to count
    /// dependents for delete-blocking and to hard-block an incompatible dataType change.</summary>
    Task<List<BikeSpecValue>> GetBikeValuesForCodeAsync(string code, CancellationToken ct = default);
    /// <summary>One-pass count of how many bikes hold a non-null value per code, for list rendering
    /// (avoids one full bikes scan per definition).</summary>
    Task<Dictionary<string, int>> CountBikesWithValueByCodeAsync(CancellationToken ct = default);
    Task AddAsync(SpecDefinition definition, CancellationToken ct = default);
    void Remove(SpecDefinition definition);
    Task SaveChangesAsync(CancellationToken ct = default);

    /// <summary>Persists pending changes already applied to the tracked <paramref name="definition"/> entity.
    /// When <paramref name="renamedFromCode"/> is non-null and differs from <paramref name="definition"/>.Code,
    /// the bikes.specs key-rename cascade runs in the same database transaction as this save (FR-005/FR-006).</summary>
    Task SaveWithOptionalRenameAsync(SpecDefinition definition, string? renamedFromCode, CancellationToken ct = default);
}

