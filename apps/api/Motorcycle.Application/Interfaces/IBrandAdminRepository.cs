using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public sealed record BrandUsage(Brand Brand, int ModelCount, int BikeCount);

public interface IBrandAdminRepository
{
    Task<List<BrandUsage>> GetAllWithUsageAsync(CancellationToken ct = default);
    Task<BrandUsage?> GetWithUsageAsync(int id, CancellationToken ct = default);
    Task<Brand?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> NameExistsAsync(string name, int? excludingId = null, CancellationToken ct = default);
    Task AddAsync(Brand brand, CancellationToken ct = default);
    void Remove(Brand brand);
    Task SaveChangesAsync(CancellationToken ct = default);
}
