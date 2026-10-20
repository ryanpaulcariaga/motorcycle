namespace Motorcycle.Application.DTOs;

public class PopularComparisonDto
{
    public BikeListItemDto BikeA { get; set; } = new();
    public BikeListItemDto BikeB { get; set; } = new();
    public int CompareCount { get; set; }
}
