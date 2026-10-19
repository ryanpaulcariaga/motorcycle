using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Persistence;

public sealed class DatabaseConnectionTester : IDatabaseConnectionTester
{
    private readonly MotorcycleDbContext _db;

    public DatabaseConnectionTester(MotorcycleDbContext db) => _db = db;

    public async Task<bool> CanReadBikeAsync(CancellationToken ct)
    {
        try {
            return await _db.Bikes.AsNoTracking().Select(b => b.Id).Take(1).AnyAsync(ct);
        } catch (Exception) when (!ct.IsCancellationRequested) {
            return false;
        }
    }
}
