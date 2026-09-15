using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBikeModelRepository
{
    Task<List<BikeModel>> GetAllAsync(CancellationToken ct = default);
    Task<BikeModel?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> BrandExistsAsync(int id, CancellationToken ct = default);
    Task<bool> CategoryExistsAsync(int id, CancellationToken ct = default);
    Task<bool> NameExistsAsync(int brandId, string name, int? excludingId = null, CancellationToken ct = default);
    Task<int> CountDependentBikesAsync(int modelId, CancellationToken ct = default);
    Task AddAsync(BikeModel model, CancellationToken ct = default);
    void Remove(BikeModel model);
    Task SaveChangesAsync(CancellationToken ct = default);
}
