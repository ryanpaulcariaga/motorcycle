namespace Motorcycle.Application.DTOs;

public class ComparedBikeDto
{
    public BikeListItemDto Bike { get; set; } = new();
    public int CompareCount { get; set; }
}
