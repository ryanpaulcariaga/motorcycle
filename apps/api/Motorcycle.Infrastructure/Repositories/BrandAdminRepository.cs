using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class BrandAdminRepository : IBrandAdminRepository
{
    private readonly MotorcycleDbContext _context;

    public BrandAdminRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<BrandUsage>> GetAllWithUsageAsync(CancellationToken ct = default)
    {
        var rows = await _context.Brands.AsNoTracking().OrderBy(b => b.Name)
            .Select(b => new { Brand = b, ModelCount = b.Models.Count, BikeCount = b.Models.SelectMany(m => m.Variants).Count() })
            .ToListAsync(ct);
        return rows.Select(r => new BrandUsage(r.Brand, r.ModelCount, r.BikeCount)).ToList();
    }

    public async Task<BrandUsage?> GetWithUsageAsync(int id, CancellationToken ct = default)
    {
        var row = await _context.Brands.Where(b => b.Id == id)
            .Select(b => new { Brand = b, ModelCount = b.Models.Count, BikeCount = b.Models.SelectMany(m => m.Variants).Count() })
            .SingleOrDefaultAsync(ct);
        return row is null ? null : new BrandUsage(row.Brand, row.ModelCount, row.BikeCount);
    }

    public Task<Brand?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Brands.SingleOrDefaultAsync(b => b.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, int? excludingId = null, CancellationToken ct = default) =>
        _context.Brands.AnyAsync(b => b.Name.ToLower() == name.ToLower() && (excludingId == null || b.Id != excludingId), ct);

    public async Task AddAsync(Brand brand, CancellationToken ct = default) => await _context.Brands.AddAsync(brand, ct);
    public void Remove(Brand brand) => _context.Brands.Remove(brand);
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
