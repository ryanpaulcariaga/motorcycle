namespace Motorcycle.Domain;

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoBlobUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<BikeModel> Models { get; set; } = new List<BikeModel>();
}
