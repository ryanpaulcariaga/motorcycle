namespace Motorcycle.Application.DTOs;

public class BikeListItemDto
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal? MsrpPrice { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
}
