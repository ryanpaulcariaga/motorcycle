namespace Motorcycle.Domain;

public class Bike
{
    public int Id { get; set; }
    public int BrandId { get; set; }
    public int CategoryId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal? MsrpPrice { get; set; }
    public string Slug { get; set; } = string.Empty;
    public Dictionary<string, object> Specs { get; set; } = new();
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Brand Brand { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<BikeImage> Images { get; set; } = new List<BikeImage>();
}
