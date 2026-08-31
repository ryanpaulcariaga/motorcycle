namespace Motorcycle.Domain;

public class Brand
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoBlobUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Bike> Bikes { get; set; } = new List<Bike>();
}
