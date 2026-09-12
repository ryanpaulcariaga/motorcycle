namespace Motorcycle.Domain;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation
    public ICollection<Bike> Bikes { get; set; } = new List<Bike>();
}
