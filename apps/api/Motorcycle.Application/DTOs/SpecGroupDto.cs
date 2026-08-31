namespace Motorcycle.Application.DTOs;

public class SpecGroupDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? IconName { get; set; }
    public List<SpecDefinitionDto> Definitions { get; set; } = new();
}

public class SpecDefinitionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int SortOrder { get; set; }
    public bool IsFilterable { get; set; }
    public string? FilterType { get; set; }
}
