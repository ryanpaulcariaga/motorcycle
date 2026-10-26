using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IAdminAuditLogService
{
    Task<AdminAuditLogPageDto> GetPageAsync(int page, int pageSize, CancellationToken ct = default);
}
