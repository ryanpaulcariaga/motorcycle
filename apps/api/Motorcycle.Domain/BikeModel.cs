namespace Motorcycle.Domain;

public class BikeModel
{
    public int Id { get; set; }
    public int BrandId { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Brand Brand { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Bike> Variants { get; set; } = new List<Bike>();
}