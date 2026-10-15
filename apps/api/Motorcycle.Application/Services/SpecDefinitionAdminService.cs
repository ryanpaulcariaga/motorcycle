using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public interface ISpecDefinitionAdminService
{
    Task<IReadOnlyList<SpecDefinitionAdminDto>> GetAllAsync(int? groupId, CancellationToken ct = default);
    Task<SpecDefinitionAdminDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<SpecDefinitionAdminDto> CreateAsync(CreateSpecDefinitionRequest request, CancellationToken ct = default);
    Task<SpecDefinitionAdminDto> UpdateAsync(int id, UpdateSpecDefinitionRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<SpecDefinitionAdminDto>> ReorderAsync(int groupId, ReorderSpecDefinitionsRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class SpecDefinitionAdminService : ISpecDefinitionAdminService
{
    private readonly ISpecDefinitionAdminRepository _repository;
    private readonly ISpecFilterStrategyFactory _filterStrategyFactory;

    public SpecDefinitionAdminService(ISpecDefinitionAdminRepository repository, ISpecFilterStrategyFactory filterStrategyFactory)
    {
        _repository = repository;
        _filterStrategyFactory = filterStrategyFactory;
    }

    public async Task<IReadOnlyList<SpecDefinitionAdminDto>> GetAllAsync(int? groupId, CancellationToken ct = default)
    {
        var definitions = await _repository.GetAllAsync(groupId, ct);
        var counts = await _repository.CountBikesWithValueByCodeAsync(ct);
        return definitions.Select(d => ToDto(d, counts.GetValueOrDefault(d.Code))).ToList();
    }

    public async Task<SpecDefinitionAdminDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var definition = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec definition was not found.");
        var bikesWithValue = await _repository.GetBikeValuesForCodeAsync(definition.Code, ct);
        return ToDto(definition, bikesWithValue.Count);
    }

    public async Task<SpecDefinitionAdminDto> CreateAsync(CreateSpecDefinitionRequest request, CancellationToken ct = default)
    {
        var (code, label, dataType, unit, filterType) = await ValidateFieldsAsync(request.GroupId, request.Code, request.Label,
            request.DataType, request.Unit, request.IsFilterable, request.FilterType, excludingId: null, ct);

        var siblings = await _repository.GetAllAsync(request.GroupId, ct);
        var definition = new SpecDefinition
        {
            GroupId = request.GroupId,
            Code = code,
            Label = label,
            DataType = dataType,
            Unit = unit,
            IsFilterable = request.IsFilterable,
            FilterType = filterType,
            SortOrder = siblings.Count == 0 ? 1 : siblings.Max(x => x.SortOrder) + 1,
        };
        await _repository.AddAsync(definition, ct);
        await _repository.SaveChangesAsync(ct);
        return ToDto(definition, 0);
    }

    public async Task<SpecDefinitionAdminDto> UpdateAsync(int id, UpdateSpecDefinitionRequest request, CancellationToken ct = default)
    {
        var definition = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec definition was not found.");
        var (code, label, dataType, unit, filterType) = await ValidateFieldsAsync(request.GroupId, request.Code, request.Label,
            request.DataType, request.Unit, request.IsFilterable, request.FilterType, excludingId: id, ct);

        var oldCode = definition.Code;
        var isRename = !string.Equals(oldCode, code, StringComparison.Ordinal);
        var isGroupMove = definition.GroupId != request.GroupId;
        var isDataTypeChange = !string.Equals(definition.DataType, dataType, StringComparison.Ordinal);

        // A dataType change converts every stored value; if any cannot be converted, nothing changes.
        Dictionary<int, object?>? convertedValues = null;
        if (isDataTypeChange) {
            var values = await _repository.GetBikeValuesForCodeAsync(oldCode, ct);
            var failures = new List<SpecValueConversionFailure>();
            convertedValues = new Dictionary<int, object?>();
            foreach (var v in values) {
                if (!SpecValueConverter.TryConvert(v.Value, dataType, out var converted, out var reason)) {
                    failures.Add(new SpecValueConversionFailure(v.BikeId, v.Value?.ToString() ?? string.Empty, reason!));
                }
                else if (!ReferenceEquals(converted, v.Value)) {
                    convertedValues[v.BikeId] = converted;
                }
            }
            if (failures.Count > 0) {
                throw new SpecDefinitionDataTypeIncompatibleException(failures);
            }
        }

        definition.Code = code;
        definition.Label = label;
        definition.DataType = dataType;
        definition.Unit = unit;
        definition.IsFilterable = request.IsFilterable;
        definition.FilterType = filterType;
        if (isGroupMove) {
            definition.GroupId = request.GroupId;
            var newSiblings = await _repository.GetAllAsync(request.GroupId, ct);
            definition.SortOrder = newSiblings.Count == 0 ? 1 : newSiblings.Max(x => x.SortOrder) + 1;
        }

        await _repository.SaveWithOptionalRenameAsync(definition, isRename ? oldCode : null, convertedValues, oldCode, ct);
        var bikesWithValue = await _repository.GetBikeValuesForCodeAsync(definition.Code, ct);
        return ToDto(definition, bikesWithValue.Count);
    }

    public async Task<IReadOnlyList<SpecDefinitionAdminDto>> ReorderAsync(int groupId, ReorderSpecDefinitionsRequest request, CancellationToken ct = default)
    {
        var definitions = await _repository.GetAllAsync(groupId, ct);
        if (request.DefinitionIds.Count != definitions.Count || request.DefinitionIds.Distinct().Count() != request.DefinitionIds.Count ||
            request.DefinitionIds.Any(id => definitions.All(x => x.Id != id))) {
            throw new ArgumentException("definitionIds must contain every spec definition currently in this group, exactly once.");
        }

        var positions = request.DefinitionIds.Select((id, index) => (id, sortOrder: index + 1)).ToDictionary(x => x.id, x => x.sortOrder);
        foreach (var definition in definitions) {
            definition.SortOrder = positions[definition.Id];
        }

        await _repository.SaveChangesAsync(ct);

        var counts = await _repository.CountBikesWithValueByCodeAsync(ct);
        return definitions.OrderBy(x => x.SortOrder).Select(d => ToDto(d, counts.GetValueOrDefault(d.Code))).ToList();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var definition = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Spec definition was not found.");
        var affectedBikes = await _repository.GetBikeValuesForCodeAsync(definition.Code, ct);
        if (affectedBikes.Count > 0) {
            throw new SpecDefinitionReferencedException(affectedBikes.Count);
        }

        _repository.Remove(definition);
        await _repository.SaveChangesAsync(ct);
    }

    private async Task<(string Code, string Label, string DataType, string? Unit, string? FilterType)> ValidateFieldsAsync(
        int groupId, string? code, string? label, string? dataType, string? unit, bool isFilterable, string? filterType, int? excludingId, CancellationToken ct)
    {
        if (!await _repository.GroupExistsAsync(groupId, ct)) {
            throw new ArgumentException("Spec group does not exist.", nameof(groupId));
        }

        var validatedCode = SpecMetadataValidators.ValidateCode(code, nameof(code));
        var validatedLabel = SpecMetadataValidators.ValidateRequiredText(label, nameof(label));
        var validatedDataType = SpecMetadataValidators.ValidateDataType(dataType);
        var validatedFilterType = SpecMetadataValidators.ValidateFilterType(isFilterable, filterType, _filterStrategyFactory.SupportedFilterTypes);
        var normalizedUnit = string.IsNullOrWhiteSpace(unit) ? null : unit.Trim();

        if (await _repository.CodeExistsAsync(validatedCode, excludingId, ct)) {
            throw new SpecDefinitionCodeExistsException(validatedCode);
        }

        return (validatedCode, validatedLabel, validatedDataType, normalizedUnit, validatedFilterType);
    }

    private static SpecDefinitionAdminDto ToDto(SpecDefinition definition, int bikesWithValueCount) => new(
        definition.Id,
        definition.GroupId,
        definition.Group?.Name ?? string.Empty,
        definition.Code,
        definition.Label,
        definition.DataType,
        definition.Unit,
        definition.SortOrder,
        definition.IsFilterable,
        definition.FilterType,
        bikesWithValueCount);
}

public sealed class SpecDefinitionCodeExistsException : Exception
{
    public SpecDefinitionCodeExistsException(string code) : base($"A spec definition with code '{code}' already exists.") { }
}

public sealed class SpecDefinitionReferencedException : Exception
{
    public int AffectedBikeCount { get; }
    public SpecDefinitionReferencedException(int affectedBikeCount) : base($"Spec definition is referenced by {affectedBikeCount} bike(s) with a stored value.") => AffectedBikeCount = affectedBikeCount;
}

public sealed class SpecDefinitionDataTypeIncompatibleException : Exception
{
    public const int MaxReportedFailures = 50;
    public int AffectedBikeCount { get; }
    public IReadOnlyList<SpecValueConversionFailure> Failures { get; }
    public SpecDefinitionDataTypeIncompatibleException(IReadOnlyList<SpecValueConversionFailure> failures)
        : base($"{failures.Count} bike(s) have a stored value that cannot be converted to the requested data type; the change was not applied.")
    {
        AffectedBikeCount = failures.Count;
        Failures = failures.Take(MaxReportedFailures).ToList();
    }
}

public sealed record SpecValueConversionFailure(int BikeId, string Value, string Reason);
