namespace Motorcycle.Application.DTOs;

public class BikeImageDto
{
    public Guid Id { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}
