using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBikeImageAdminRepository
{
    Task<bool> BikeExistsAsync(int bikeId, CancellationToken ct = default);
    Task<List<BikeImage>> GetAllAsync(int bikeId, CancellationToken ct = default);
    Task<BikeImage?> GetByIdAsync(int bikeId, int imageId, CancellationToken ct = default);
    Task AddAsync(BikeImage image, CancellationToken ct = default);
    void Remove(BikeImage image);
    Task SaveChangesAsync(CancellationToken ct = default);
}
