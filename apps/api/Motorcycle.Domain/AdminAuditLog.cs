namespace Motorcycle.Domain;

public sealed class AdminAuditLog
{
    public long Id { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string? ActorDisplayName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityKey { get; set; }
    public string ChangedFields { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
}
