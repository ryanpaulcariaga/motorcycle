using System.Text.RegularExpressions;
using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class BikeAdminService : IBikeAdminService
{
    private readonly IBikeAdminRepository _repository;
    private readonly IBikeModelRepository _bikeModelRepository;
    private readonly ISpecGroupRepository _specGroupRepository;

    public BikeAdminService(IBikeAdminRepository repository, IBikeModelRepository bikeModelRepository, ISpecGroupRepository specGroupRepository)
    {
        _repository = repository;
        _bikeModelRepository = bikeModelRepository;
        _specGroupRepository = specGroupRepository;
    }

    public async Task<IReadOnlyList<BikeAdminListItemDto>> GetAllAsync(int? modelId, CancellationToken ct = default) =>
        (await _repository.GetAllAsync(modelId, ct)).Select(ToListItemDto).ToList();

    public async Task<BikeAdminDetailDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDetailDto(await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found."));

    public async Task<BikeAdminDetailDto> CreateAsync(CreateBikeRequest request, CancellationToken ct = default)
    {
        if (!await _repository.BikeModelExistsAsync(request.ModelId, ct))
            throw new KeyNotFoundException("BikeModel was not found.");

        var (variantName, year) = BikeValidators.ValidateCore(request.VariantName, request.Year);
        if (await _repository.VariantExistsAsync(request.ModelId, year, variantName, null, ct))
            throw new InvalidOperationException("A bike with this model, year, and variant name already exists.");

        var definitionsByCode = await GetDefinitionsByCodeAsync(ct);
        var specs = BikeValidators.ValidateSpecs(request.Specs, definitionsByCode);

        var bike = new Bike
        {
            ModelId = request.ModelId,
            VariantName = variantName,
            Year = year,
            MsrpPrice = request.MsrpPrice,
            Specs = ToObjectDictionary(specs),
            IsPublished = false,
            Slug = await GenerateSlugAsync(request.ModelId, variantName, year, ct)
        };

        await _repository.AddAsync(bike, ct);
        await _repository.SaveChangesAsync(ct);
        return ToDetailDto(await _repository.GetByIdAsync(bike.Id, ct) ?? bike);
    }

    public async Task<BikeAdminDetailDto> UpdateAsync(int id, UpdateBikeRequest request, CancellationToken ct = default)
    {
        var bike = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found.");

        var (variantName, year) = BikeValidators.ValidateCore(request.VariantName, request.Year);
        if (await _repository.VariantExistsAsync(bike.ModelId, year, variantName, id, ct))
            throw new InvalidOperationException("A bike with this model, year, and variant name already exists.");

        var definitionsByCode = await GetDefinitionsByCodeAsync(ct);
        var specs = BikeValidators.ValidateSpecs(request.Specs, definitionsByCode);

        bike.VariantName = variantName;
        bike.Year = year;
        bike.MsrpPrice = request.MsrpPrice;
        bike.Specs = ToObjectDictionary(specs);
        bike.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return ToDetailDto(bike);
    }

    public async Task<BikeAdminDetailDto> PublishAsync(int id, CancellationToken ct = default)
    {
        var bike = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found.");
        if (string.IsNullOrWhiteSpace(bike.VariantName) || bike.Year <= 0)
            throw new InvalidOperationException("Bike is missing required details (year, variant name) and cannot be published.");

        bike.IsPublished = true;
        bike.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);
        return ToDetailDto(bike);
    }

    public async Task<BikeAdminDetailDto> UnpublishAsync(int id, CancellationToken ct = default)
    {
        var bike = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found.");
        bike.IsPublished = false;
        bike.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);
        return ToDetailDto(bike);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var bike = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found.");
        var dependentCount = await _repository.CountDependentImagesAsync(id, ct);
        if (dependentCount > 0) throw new BikeReferencedException(dependentCount);
        _repository.Remove(bike);
        await _repository.SaveChangesAsync(ct);
    }

    private async Task<Dictionary<string, SpecDefinition>> GetDefinitionsByCodeAsync(CancellationToken ct) =>
        (await _specGroupRepository.GetAllWithDefinitionsAsync(ct))
            .SelectMany(g => g.Definitions)
            .ToDictionary(d => d.Code, d => d);

    private async Task<string> GenerateSlugAsync(int modelId, string variantName, int year, CancellationToken ct)
    {
        var model = await _bikeModelRepository.GetByIdAsync(modelId, ct);
        var baseSlug = ToSlug($"{model?.Brand.Name} {model?.Name} {variantName} {year}");

        var slug = baseSlug;
        var suffix = 2;
        while (await SlugExistsAsync(slug, ct))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }

    private async Task<bool> SlugExistsAsync(string slug, CancellationToken ct) =>
        (await _repository.GetAllAsync(null, ct)).Any(b => string.Equals(b.Slug, slug, StringComparison.OrdinalIgnoreCase));

    private static string ToSlug(string source) =>
        Regex.Replace(source.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');

    private static Dictionary<string, object> ToObjectDictionary(Dictionary<string, object?> specs) =>
        specs.Where(kv => kv.Value is not null).ToDictionary(kv => kv.Key, kv => kv.Value!);

    private static BikeAdminListItemDto ToListItemDto(Bike bike) => new(
        bike.Id,
        bike.ModelId,
        bike.Model?.Name ?? string.Empty,
        bike.Model?.Brand?.Name ?? string.Empty,
        bike.VariantName,
        bike.Year,
        bike.MsrpPrice,
        bike.IsPublished,
        bike.CreatedAt,
        bike.UpdatedAt);

    private static BikeAdminDetailDto ToDetailDto(Bike bike) => new(
        bike.Id,
        bike.ModelId,
        bike.Model?.Name ?? string.Empty,
        bike.Model?.Brand?.Name ?? string.Empty,
        bike.VariantName,
        bike.Year,
        bike.MsrpPrice,
        bike.Slug,
        bike.IsPublished,
        bike.Specs.ToDictionary(kv => kv.Key, kv => (object?)kv.Value),
        bike.CreatedAt,
        bike.UpdatedAt);
}

public sealed class BikeReferencedException : Exception
{
    public int DependentCount { get; }
    public BikeReferencedException(int dependentCount) : base($"Bike is referenced by {dependentCount} image(s).") => DependentCount = dependentCount;
}
