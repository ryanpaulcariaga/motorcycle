using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public sealed class AdminAuditLogService : IAdminAuditLogService
{
    private readonly IAdminAuditLogRepository _repository;

    public AdminAuditLogService(IAdminAuditLogRepository repository) => _repository = repository;

    public async Task<AdminAuditLogPageDto> GetPageAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var (items, totalCount) = await _repository.GetPageAsync(page, pageSize, ct);
        return new AdminAuditLogPageDto(
            items.Select(item => new AdminAuditLogDto(
                item.Id,
                item.OccurredAt,
                item.ActorId,
                item.ActorDisplayName,
                item.Action,
                item.EntityType,
                item.EntityKey,
                item.ChangedFields,
                item.RequestId)).ToArray(),
            page,
            pageSize,
            totalCount);
    }
}
