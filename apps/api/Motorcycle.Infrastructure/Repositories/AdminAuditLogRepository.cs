using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class AdminAuditLogRepository : IAdminAuditLogRepository
{
    private readonly MotorcycleDbContext _db;

    public AdminAuditLogRepository(MotorcycleDbContext db) => _db = db;

    public async Task<(IReadOnlyList<AdminAuditLog> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _db.AdminAuditLogs.AsNoTracking();
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(item => item.OccurredAt)
            .ThenByDescending(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
