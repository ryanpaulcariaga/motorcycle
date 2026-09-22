using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BikeImageAdminRepository : IBikeImageAdminRepository
{
    private readonly MotorcycleDbContext _context;

    public BikeImageAdminRepository(MotorcycleDbContext context) => _context = context;

    public Task<bool> BikeExistsAsync(int bikeId, CancellationToken ct = default) =>
        _context.Bikes.AnyAsync(x => x.Id == bikeId, ct);

    public Task<List<BikeImage>> GetAllAsync(int bikeId, CancellationToken ct = default) =>
        _context.BikeImages.Where(x => x.BikeId == bikeId).OrderBy(x => x.SortOrder).ThenBy(x => x.Id).ToListAsync(ct);

    public Task<BikeImage?> GetByIdAsync(int bikeId, int imageId, CancellationToken ct = default) =>
        _context.BikeImages.SingleOrDefaultAsync(x => x.BikeId == bikeId && x.Id == imageId, ct);

    public async Task AddAsync(BikeImage image, CancellationToken ct = default) => await _context.BikeImages.AddAsync(image, ct);
    public void Remove(BikeImage image) => _context.BikeImages.Remove(image);
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
