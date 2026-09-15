using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BikeModelRepository : IBikeModelRepository
{
    private readonly MotorcycleDbContext _context;
    public BikeModelRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<BikeModel>> GetAllAsync(CancellationToken ct = default)
    {
        var result = await _context.BikeModels.AsNoTracking().Include(x => x.Brand).Include(x => x.Category).OrderBy(x => x.Brand.Name).ThenBy(x => x.Name).ToListAsync(ct);
        return result;

    }
    public Task<BikeModel?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.BikeModels.Include(x => x.Brand).Include(x => x.Category).SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> BrandExistsAsync(int id, CancellationToken ct = default) => _context.Brands.AnyAsync(x => x.Id == id, ct);
    public Task<bool> CategoryExistsAsync(int id, CancellationToken ct = default) => _context.Categories.AnyAsync(x => x.Id == id, ct);
    public Task<bool> NameExistsAsync(int brandId, string name, int? excludingId = null, CancellationToken ct = default) =>
        _context.BikeModels.AnyAsync(x => x.BrandId == brandId && x.Name == name && (!excludingId.HasValue || x.Id != excludingId.Value), ct);
    public Task<int> CountDependentBikesAsync(int modelId, CancellationToken ct = default) => _context.Bikes.CountAsync(x => x.ModelId == modelId, ct);
    public async Task AddAsync(BikeModel model, CancellationToken ct = default) => await _context.BikeModels.AddAsync(model, ct);
    public void Remove(BikeModel model) => _context.BikeModels.Remove(model);
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
