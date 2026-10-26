namespace Motorcycle.Application.DTOs;

public sealed record AdminAuditLogDto(
    long Id,
    DateTimeOffset OccurredAt,
    string ActorId,
    string? ActorDisplayName,
    string Action,
    string EntityType,
    string? EntityKey,
    string ChangedFields,
    string RequestId);

public sealed record AdminAuditLogPageDto(
    IReadOnlyList<AdminAuditLogDto> Items,
    int Page,
    int PageSize,
    int TotalCount);
