namespace Motorcycle.Application.DTOs;

public sealed record SpecGroupAdminDto(
    int Id,
    string Code,
    string Name,
    string? IconName,
    int SortOrder,
    int DefinitionCount);

public sealed record CreateSpecGroupRequest(string Code, string Name, string? IconName);

public sealed record UpdateSpecGroupRequest(string Code, string Name, string? IconName);

public sealed record ReorderSpecGroupsRequest(List<int> GroupIds);
