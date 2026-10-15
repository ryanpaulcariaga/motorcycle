using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public sealed record CategoryUsage(Category Category, int ModelCount, int BikeCount);

public interface ICategoryAdminRepository
{
    Task<List<CategoryUsage>> GetAllWithUsageAsync(CancellationToken ct = default);
    Task<CategoryUsage?> GetWithUsageAsync(int id, CancellationToken ct = default);
    Task<Category?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> NameExistsAsync(string name, int? excludingId = null, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    void Remove(Category category);
    Task SaveChangesAsync(CancellationToken ct = default);
}
