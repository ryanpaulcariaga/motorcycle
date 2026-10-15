using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class CategoryAdminRepository : ICategoryAdminRepository
{
    private readonly MotorcycleDbContext _context;

    public CategoryAdminRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<CategoryUsage>> GetAllWithUsageAsync(CancellationToken ct = default)
    {
        var rows = await _context.Categories.AsNoTracking().OrderBy(c => c.Name)
            .Select(c => new { Category = c, ModelCount = c.Models.Count, BikeCount = c.Models.SelectMany(m => m.Variants).Count() })
            .ToListAsync(ct);
        return rows.Select(r => new CategoryUsage(r.Category, r.ModelCount, r.BikeCount)).ToList();
    }

    public async Task<CategoryUsage?> GetWithUsageAsync(int id, CancellationToken ct = default)
    {
        var row = await _context.Categories.Where(c => c.Id == id)
            .Select(c => new { Category = c, ModelCount = c.Models.Count, BikeCount = c.Models.SelectMany(m => m.Variants).Count() })
            .SingleOrDefaultAsync(ct);
        return row is null ? null : new CategoryUsage(row.Category, row.ModelCount, row.BikeCount);
    }

    public Task<Category?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Categories.SingleOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, int? excludingId = null, CancellationToken ct = default) =>
        _context.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower() && (excludingId == null || c.Id != excludingId), ct);

    public async Task AddAsync(Category category, CancellationToken ct = default) => await _context.Categories.AddAsync(category, ct);
    public void Remove(Category category) => _context.Categories.Remove(category);
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
