namespace Motorcycle.Application.DTOs;

public class CompareResultDto
{
    public List<CompareBikeSummaryDto> Bikes { get; set; } = new();
    public List<CompareSpecGroupDto> SpecGroups { get; set; } = new();
}

public class CompareBikeSummaryDto
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
}

public class CompareSpecGroupDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<CompareSpecRowDto> Rows { get; set; } = new();
}

public class CompareSpecRowDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Unit { get; set; }
    // Keyed by bike id (as string, for JSON friendliness)
    public Dictionary<string, object?> ValuesByBikeId { get; set; } = new();
}
