namespace Motorcycle.Domain;

public class SpecDefinition
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty; // 'number', 'text', 'boolean', 'enum'
    public string? Unit { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsFilterable { get; set; } = false;
    public string? FilterType { get; set; } // 'range', 'exact', 'multiselect'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public SpecGroup Group { get; set; } = null!;
}
