namespace Motorcycle.Domain;

public class BikeSpecVerification
{
    public int BikeId { get; set; }
    public int SpecDefinitionId { get; set; }
    public string? SourceUrl { get; set; }
    public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;

    public Bike Bike { get; set; } = null!;
    public SpecDefinition SpecDefinition { get; set; } = null!;
}
