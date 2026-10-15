using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class CategoryReferencedException : Exception
{
    public int BikeCount { get; }
    public int ModelCount { get; }

    public CategoryReferencedException(int modelCount, int bikeCount)
        : base($"Category cannot be deleted because it is used by {modelCount} bike model(s) and {bikeCount} bike(s).")
    {
        ModelCount = modelCount;
        BikeCount = bikeCount;
    }
}

public sealed class CategoryAdminService : ICategoryAdminService
{
    private readonly ICategoryAdminRepository _repository;

    public CategoryAdminService(ICategoryAdminRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<CategoryAdminDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _repository.GetAllWithUsageAsync(ct)).Select(ToDto).ToList();

    public async Task<CategoryAdminDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDto(await _repository.GetWithUsageAsync(id, ct) ?? throw new KeyNotFoundException("Category was not found."));

    public async Task<CategoryAdminDto> CreateAsync(CategoryRequest request, CancellationToken ct = default)
    {
        var name = Validate(request);
        if (await _repository.NameExistsAsync(name, null, ct)) {
            throw new InvalidOperationException("A category with this name already exists.");
        }

        var category = new Category { Name = name };
        await _repository.AddAsync(category, ct);
        await _repository.SaveChangesAsync(ct);
        return new CategoryAdminDto(category.Id, category.Name, 0, 0);
    }

    public async Task<CategoryAdminDto> UpdateAsync(int id, CategoryRequest request, CancellationToken ct = default)
    {
        var name = Validate(request);
        var category = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Category was not found.");
        if (await _repository.NameExistsAsync(name, id, ct)) {
            throw new InvalidOperationException("A category with this name already exists.");
        }

        category.Name = name;
        await _repository.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var usage = await _repository.GetWithUsageAsync(id, ct) ?? throw new KeyNotFoundException("Category was not found.");
        if (usage.ModelCount > 0 || usage.BikeCount > 0) {
            throw new CategoryReferencedException(usage.ModelCount, usage.BikeCount);
        }

        _repository.Remove(usage.Category);
        await _repository.SaveChangesAsync(ct);
    }

    private static string Validate(CategoryRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length is < 1 or > 255) {
            throw new ArgumentException("Name must contain between 1 and 255 characters.", nameof(request));
        }

        return name;
    }

    private static CategoryAdminDto ToDto(CategoryUsage u) =>
        new(u.Category.Id, u.Category.Name, u.ModelCount, u.BikeCount);
}
