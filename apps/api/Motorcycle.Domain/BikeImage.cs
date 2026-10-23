namespace Motorcycle.Domain;

public class BikeImage
{
    public int Id { get; set; }
    public int BikeId { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public string? SmallUrl { get; set; }
    public string? MediumUrl { get; set; }
    public string? LargeUrl { get; set; }
    public string? XlUrl { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Bike Bike { get; set; } = null!;
}
