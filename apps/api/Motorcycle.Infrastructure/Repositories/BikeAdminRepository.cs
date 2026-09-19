using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BikeAdminRepository : IBikeAdminRepository
{
    private readonly MotorcycleDbContext _context;
    public BikeAdminRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<Bike>> GetAllAsync(int? modelId, CancellationToken ct = default)
    {
        var query = _context.Bikes.AsNoTracking().Include(x => x.Model).ThenInclude(m => m.Brand).AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId.Value);
        return await query.OrderBy(x => x.Model.Name).ThenBy(x => x.Year).ThenBy(x => x.VariantName).ToListAsync(ct);
    }

    public Task<Bike?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Bikes.Include(x => x.Model).ThenInclude(m => m.Brand).SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> BikeModelExistsAsync(int modelId, CancellationToken ct = default) =>
        _context.BikeModels.AnyAsync(x => x.Id == modelId, ct);

    public Task<bool> VariantExistsAsync(int modelId, int year, string variantName, int? excludingId = null, CancellationToken ct = default) =>
        _context.Bikes.AnyAsync(x => x.ModelId == modelId && x.Year == year && x.VariantName == variantName && (!excludingId.HasValue || x.Id != excludingId.Value), ct);

    public Task<int> CountDependentImagesAsync(int bikeId, CancellationToken ct = default) =>
        _context.BikeImages.CountAsync(x => x.BikeId == bikeId, ct);

    public async Task AddAsync(Bike bike, CancellationToken ct = default) => await _context.Bikes.AddAsync(bike, ct);
    public void Remove(Bike bike) => _context.Bikes.Remove(bike);
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
