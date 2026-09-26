namespace Motorcycle.Application.DTOs;

public sealed record SpecDefinitionAdminDto(
    int Id,
    int GroupId,
    string GroupName,
    string Code,
    string Label,
    string DataType,
    string? Unit,
    int SortOrder,
    bool IsFilterable,
    string? FilterType,
    int BikesWithValueCount);

public sealed record CreateSpecDefinitionRequest(
    int GroupId,
    string Code,
    string Label,
    string DataType,
    string? Unit,
    bool IsFilterable,
    string? FilterType);

public sealed record UpdateSpecDefinitionRequest(
    int GroupId,
    string Code,
    string Label,
    string DataType,
    string? Unit,
    bool IsFilterable,
    string? FilterType);

public sealed record ReorderSpecDefinitionsRequest(List<int> DefinitionIds);
