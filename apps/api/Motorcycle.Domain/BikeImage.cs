namespace Motorcycle.Domain;

public class BikeImage
{
    public int Id { get; set; }
    public int BikeId { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Bike Bike { get; set; } = null!;
}
