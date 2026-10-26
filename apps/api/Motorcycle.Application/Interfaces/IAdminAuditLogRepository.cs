using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IAdminAuditLogRepository
{
    Task<(IReadOnlyList<AdminAuditLog> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        CancellationToken ct = default);
}
