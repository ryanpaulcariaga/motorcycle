namespace Motorcycle.Application.DTOs;

public class BikeDetailDto
{
    public int Id { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal? MsrpPrice { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public List<BikeImageDto> Images { get; set; } = new();
    public List<SpecGroupWithValuesDto> SpecGroups { get; set; } = new();
}

public class SpecGroupWithValuesDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<SpecValueDto> Specs { get; set; } = new();
}

public class SpecValueDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int SortOrder { get; set; }
    public object? Value { get; set; }
}
