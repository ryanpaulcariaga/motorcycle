namespace Motorcycle.Application.DTOs;

public class BrandDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoBlobUrl { get; set; }
}
