using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Common;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class BikeModelService : IBikeModelService
{
    private readonly IBikeModelRepository _repository;

    public BikeModelService(IBikeModelRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<BikeModelDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _repository.GetAllAsync(ct)).Select(ToDto).ToList();

    public async Task<BikeModelDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDto(await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("BikeModel was not found."));

    public async Task<BikeModelDto> CreateAsync(CreateBikeModelRequest request, CancellationToken ct = default)
    {
            var name = BikeModelValidators.Validate(request.BrandId, request.CategoryId, request.Name);
        await EnsureReferencesAsync(request.BrandId, request.CategoryId, name, null, ct);
        var model = new BikeModel { BrandId = request.BrandId, CategoryId = request.CategoryId, Name = name };
        await _repository.AddAsync(model, ct);
        await _repository.SaveChangesAsync(ct);
        return ToDto(await _repository.GetByIdAsync(model.Id, ct) ?? model);
    }

    public async Task<BikeModelDto> UpdateAsync(int id, UpdateBikeModelRequest request, CancellationToken ct = default)
    {
        var model = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("BikeModel was not found.");
            var name = BikeModelValidators.Validate(request.BrandId, request.CategoryId, request.Name);
        await EnsureReferencesAsync(request.BrandId, request.CategoryId, name, id, ct);
        model.BrandId = request.BrandId;
        model.CategoryId = request.CategoryId;
        model.Name = name;
        await _repository.SaveChangesAsync(ct);
        return ToDto(model);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var model = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("BikeModel was not found.");
        var dependentCount = await _repository.CountDependentBikesAsync(id, ct);
        if (dependentCount > 0) throw new BikeModelReferencedException(dependentCount);
        _repository.Remove(model);
        await _repository.SaveChangesAsync(ct);
    }

    private async Task EnsureReferencesAsync(int brandId, int categoryId, string name, int? excludingId, CancellationToken ct)
    {
        if (!await _repository.BrandExistsAsync(brandId, ct)) throw new ArgumentException("Brand does not exist.", nameof(brandId));
        if (!await _repository.CategoryExistsAsync(categoryId, ct)) throw new ArgumentException("Category does not exist.", nameof(categoryId));
        if (await _repository.NameExistsAsync(brandId, name, excludingId, ct)) throw new InvalidOperationException("A BikeModel with this brand and name already exists.");
    }

    private static BikeModelDto ToDto(BikeModel model) => new(
        model.Id,
        model.BrandId,
        model.Brand?.Name ?? string.Empty,
        model.CategoryId,
        model.Category?.Name ?? string.Empty,
        model.Name,
        model.CreatedAt);
}

public sealed class BikeModelReferencedException : Exception
{
    public int DependentCount { get; }
    public BikeModelReferencedException(int dependentCount) : base($"BikeModel is referenced by {dependentCount} bike(s).") => DependentCount = dependentCount;
}
