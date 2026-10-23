namespace Motorcycle.Application.DTOs;

public class BikeImageDto
{
    public int Id { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public BikeImageVariantsDto? Variants { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}
