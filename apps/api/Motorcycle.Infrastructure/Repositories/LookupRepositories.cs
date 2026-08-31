using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public class BrandRepository : IBrandRepository
{
    private readonly MotorcycleDbContext _context;
    public BrandRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<Brand>> GetAllAsync(CancellationToken ct = default) =>
        await _context.Brands.ToListAsync(ct);
}

public class CategoryRepository : ICategoryRepository
{
    private readonly MotorcycleDbContext _context;
    public CategoryRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<Category>> GetAllAsync(CancellationToken ct = default) =>
        await _context.Categories.ToListAsync(ct);
}

public class SpecGroupRepository : ISpecGroupRepository
{
    private readonly MotorcycleDbContext _context;
    public SpecGroupRepository(MotorcycleDbContext context) => _context = context;

    public async Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default) =>
        await _context.SpecGroups
            .Include(g => g.Definitions)
            .ToListAsync(ct);
}
