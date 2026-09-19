using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBikeAdminRepository
{
    Task<List<Bike>> GetAllAsync(int? modelId, CancellationToken ct = default);
    Task<Bike?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> BikeModelExistsAsync(int modelId, CancellationToken ct = default);
    Task<bool> VariantExistsAsync(int modelId, int year, string variantName, int? excludingId = null, CancellationToken ct = default);
    Task<int> CountDependentImagesAsync(int bikeId, CancellationToken ct = default);
    Task AddAsync(Bike bike, CancellationToken ct = default);
    void Remove(Bike bike);
    Task SaveChangesAsync(CancellationToken ct = default);
}
