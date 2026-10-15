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

    public async Task<IReadOnlyList<BikeSpecValueItemDto>> GetSpecValuesAsync(int? brandId, int? categoryId, decimal? minPrice, decimal? maxPrice, string specCode, CancellationToken ct = default)
    {
        var definitions = await GetDefinitionsByCodeAsync(ct);
        if (!definitions.ContainsKey(specCode)) {
            throw new ArgumentException($"Unrecognized specification code '{specCode}'.", nameof(specCode));
        }

        var bikes = await _repository.GetForSpecEditAsync(brandId, categoryId, minPrice, maxPrice, ct);
        return bikes.Select(b => new BikeSpecValueItemDto(
            b.Id,
            b.Model?.Name ?? string.Empty,
            b.Model?.Brand?.Name ?? string.Empty,
            b.Model?.Category?.Name ?? string.Empty,
            b.VariantName,
            b.Year,
            b.MsrpPrice,
            b.IsPublished,
            b.Specs.TryGetValue(specCode, out var value) ? value : null)).ToList();
    }

    public async Task<int> UpdateSingleSpecAsync(UpdateSingleSpecRequest request, CancellationToken ct = default)
    {
        var definitions = await GetDefinitionsByCodeAsync(ct);
        if (string.IsNullOrWhiteSpace(request.SpecCode) || !definitions.ContainsKey(request.SpecCode)) {
            throw new ArgumentException($"Unrecognized specification code '{request.SpecCode}'.", nameof(request));
        }

        if (request.Values is null || request.Values.Count == 0) {
            return 0;
        }

        if (request.Values.Select(v => v.BikeId).Distinct().Count() != request.Values.Count) {
            throw new ArgumentException("Each bike may appear only once.", nameof(request));
        }

        // Validate every value before mutating so a bad row rejects the whole batch.
        foreach (var item in request.Values) {
            BikeValidators.ValidateSpecs(new Dictionary<string, object?> { [request.SpecCode] = item.Value }, definitions);
        }

        var bikes = (await _repository.GetByIdsAsync(request.Values.Select(v => v.BikeId).ToList(), ct)).ToDictionary(b => b.Id);
        var missing = request.Values.Where(v => !bikes.ContainsKey(v.BikeId)).Select(v => v.BikeId).ToList();
        if (missing.Count > 0) {
            throw new KeyNotFoundException($"Bike(s) not found: {string.Join(", ", missing)}.");
        }

        var now = DateTime.UtcNow;
        foreach (var item in request.Values) {
            var bike = bikes[item.BikeId];
            var specs = new Dictionary<string, object>(bike.Specs);
            if (item.Value is null) {
                specs.Remove(request.SpecCode);
            }
            else {
                specs[request.SpecCode] = item.Value;
            }

            bike.Specs = specs;
            bike.UpdatedAt = now;
        }

        await _repository.SaveChangesAsync(ct);
        return request.Values.Count;
    }

    public async Task<BikeAdminDetailDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDetailDto(await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found."));

    public async Task<BikeAdminDetailDto> CreateAsync(CreateBikeRequest request, CancellationToken ct = default)
    {
        if (!await _repository.BikeModelExistsAsync(request.ModelId, ct)) {
            throw new KeyNotFoundException("BikeModel was not found.");
        }

        var (variantName, year) = BikeValidators.ValidateCore(request.VariantName, request.Year);
        if (await _repository.VariantExistsAsync(request.ModelId, year, variantName, null, ct)) {
            throw new InvalidOperationException("A bike with this model, year, and variant name already exists.");
        }

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

        var targetModelId = request.ModelId ?? bike.ModelId;
        var targetModel = targetModelId == bike.ModelId
            ? null
            : await _bikeModelRepository.GetByIdAsync(targetModelId, ct)
                ?? throw new KeyNotFoundException("BikeModel was not found.");

        var (variantName, year) = BikeValidators.ValidateCore(request.VariantName, request.Year);
        if (await _repository.VariantExistsAsync(targetModelId, year, variantName, id, ct)) {
            throw new InvalidOperationException("A bike with this model, year, and variant name already exists.");
        }

        var definitionsByCode = await GetDefinitionsByCodeAsync(ct);
        var specs = BikeValidators.ValidateSpecs(request.Specs, definitionsByCode);

        if (targetModel is not null) {
            bike.ModelId = targetModel.Id;
            bike.Model = targetModel;
        }

        bike.VariantName = variantName;
        bike.Year = year;
        bike.MsrpPrice = request.MsrpPrice;
        bike.Specs = ToObjectDictionary(specs);
        bike.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return ToDetailDto(bike);
    }

    public async Task ReassignModelAsync(int id, ReassignBikeModelRequest request, CancellationToken ct = default)
    {
        if (request.ModelId <= 0) {
            throw new ArgumentException("A valid BikeModel ID is required.", nameof(request.ModelId));
        }

        var bike = await _repository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException("Bike was not found.");
        if (bike.ModelId == request.ModelId) {
            return;
        }

        var targetModel = await _bikeModelRepository.GetByIdAsync(request.ModelId, ct)
            ?? throw new KeyNotFoundException("BikeModel was not found.");
        if (await _repository.VariantExistsAsync(request.ModelId, bike.Year, bike.VariantName, id, ct)) {
            throw new InvalidOperationException("A bike with this model, year, and variant name already exists.");
        }

        bike.ModelId = targetModel.Id;
        bike.Model = targetModel;
        bike.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);
    }

    public async Task<BikeAdminDetailDto> PublishAsync(int id, CancellationToken ct = default)
    {
        var bike = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Bike was not found.");
        if (string.IsNullOrWhiteSpace(bike.VariantName) ||         bike.Year < 0) {
            throw new InvalidOperationException("Bike is missing required details (year, variant name) and cannot be published.");
        }

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
        if (dependentCount > 0) {
            throw new BikeReferencedException(dependentCount);
        }

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
        while (await SlugExistsAsync(slug, ct)) {
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
