namespace Motorcycle.Domain;

public static class AdminRoles
{
    public const string Administrator = "Administrator";
}

public class AdminRole
{
    public int Id { get; set; }
    public string FacebookUserId { get; set; } = string.Empty;
    public string? EmailSnapshot { get; set; }
    public string? DisplayNameSnapshot { get; set; }
    public string Role { get; set; } = AdminRoles.Administrator;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
