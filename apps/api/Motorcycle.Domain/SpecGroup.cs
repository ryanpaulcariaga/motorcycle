namespace Motorcycle.Domain;

public class SpecGroup
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public string? IconName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<SpecDefinition> Definitions { get; set; } = new List<SpecDefinition>();
}
