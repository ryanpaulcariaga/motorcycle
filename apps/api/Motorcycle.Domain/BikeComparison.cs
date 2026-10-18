namespace Motorcycle.Domain;

/// <summary>Aggregated count of how often two bikes were compared together. BikeAId is always lower than BikeBId.</summary>
public class BikeComparison
{
    public int Id { get; set; }
    public int BikeAId { get; set; }
    public int BikeBId { get; set; }
    public int CompareCount { get; set; }
    public DateTime FirstComparedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastComparedAt { get; set; } = DateTime.UtcNow;

    public Bike BikeA { get; set; } = null!;
    public Bike BikeB { get; set; } = null!;
}
