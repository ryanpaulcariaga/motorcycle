using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public interface ISpecGroupAdminService
{
    Task<IReadOnlyList<SpecGroupAdminDto>> GetAllAsync(CancellationToken ct = default);
    Task<SpecGroupAdminDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<SpecGroupAdminDto> CreateAsync(CreateSpecGroupRequest request, CancellationToken ct = default);
    Task<SpecGroupAdminDto> UpdateAsync(int id, UpdateSpecGroupRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<SpecGroupAdminDto>> ReorderAsync(ReorderSpecGroupsRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class SpecGroupAdminService : ISpecGroupAdminService
{
    private readonly ISpecGroupAdminRepository _repository;

    public SpecGroupAdminService(ISpecGroupAdminRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<SpecGroupAdminDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _repository.GetAllWithDefinitionsAsync(ct)).Select(ToDto).ToList();

    public async Task<SpecGroupAdminDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDto(await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec group was not found."));

    public async Task<SpecGroupAdminDto> CreateAsync(CreateSpecGroupRequest request, CancellationToken ct = default)
    {
        var code = SpecMetadataValidators.ValidateCode(request.Code, nameof(request.Code));
        var name = SpecMetadataValidators.ValidateRequiredText(request.Name, nameof(request.Name));
        if (await _repository.CodeExistsAsync(code, null, ct))
            throw new SpecGroupCodeExistsException(code);

        var groups = await _repository.GetAllWithDefinitionsAsync(ct);
        var group = new SpecGroup
        {
            Code = code,
            Name = name,
            IconName = string.IsNullOrWhiteSpace(request.IconName) ? null : request.IconName.Trim(),
            SortOrder = groups.Count == 0 ? 1 : groups.Max(x => x.SortOrder) + 1,
        };
        await _repository.AddAsync(group, ct);
        await _repository.SaveChangesAsync(ct);
        return ToDto(group);
    }

    public async Task<SpecGroupAdminDto> UpdateAsync(int id, UpdateSpecGroupRequest request, CancellationToken ct = default)
    {
        var group = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec group was not found.");
        var code = SpecMetadataValidators.ValidateCode(request.Code, nameof(request.Code));
        var name = SpecMetadataValidators.ValidateRequiredText(request.Name, nameof(request.Name));
        if (await _repository.CodeExistsAsync(code, id, ct))
            throw new SpecGroupCodeExistsException(code);

        group.Code = code;
        group.Name = name;
        group.IconName = string.IsNullOrWhiteSpace(request.IconName) ? null : request.IconName.Trim();
        await _repository.SaveChangesAsync(ct);
        return ToDto(group);
    }

    public async Task<IReadOnlyList<SpecGroupAdminDto>> ReorderAsync(ReorderSpecGroupsRequest request, CancellationToken ct = default)
    {
        var groups = await _repository.GetAllWithDefinitionsAsync(ct);
        if (request.GroupIds.Count != groups.Count || request.GroupIds.Distinct().Count() != request.GroupIds.Count ||
            request.GroupIds.Any(id => groups.All(x => x.Id != id)))
            throw new ArgumentException("groupIds must contain every existing spec group exactly once.");

        var positions = request.GroupIds.Select((id, index) => (id, sortOrder: index + 1)).ToDictionary(x => x.id, x => x.sortOrder);
        foreach (var group in groups) group.SortOrder = positions[group.Id];
        await _repository.SaveChangesAsync(ct);
        return groups.OrderBy(x => x.SortOrder).Select(ToDto).ToList();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var group = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec group was not found.");
        var dependentCount = await _repository.CountDefinitionsAsync(id, ct);
        if (dependentCount > 0) throw new SpecGroupReferencedException(dependentCount);
        _repository.Remove(group);
        await _repository.SaveChangesAsync(ct);
    }

    private static SpecGroupAdminDto ToDto(SpecGroup group) => new(
        group.Id, group.Code, group.Name, group.IconName, group.SortOrder, group.Definitions?.Count ?? 0);
}

public sealed class SpecGroupCodeExistsException : Exception
{
    public SpecGroupCodeExistsException(string code) : base($"A spec group with code '{code}' already exists.") { }
}

public sealed class SpecGroupReferencedException : Exception
{
    public int DependentCount { get; }
    public SpecGroupReferencedException(int dependentCount) : base($"Spec group is referenced by {dependentCount} spec definition(s).") => DependentCount = dependentCount;
}
