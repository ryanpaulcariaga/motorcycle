using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class BrandReferencedException : Exception
{
    public int BikeCount { get; }
    public int ModelCount { get; }

    public BrandReferencedException(int modelCount, int bikeCount)
        : base($"Brand cannot be deleted because it is used by {modelCount} bike model(s) and {bikeCount} bike(s).")
    {
        ModelCount = modelCount;
        BikeCount = bikeCount;
    }
}

public sealed class BrandAdminService : IBrandAdminService
{
    private readonly IBrandAdminRepository _repository;

    public BrandAdminService(IBrandAdminRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<BrandAdminDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _repository.GetAllWithUsageAsync(ct)).Select(ToDto).ToList();

    public async Task<BrandAdminDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        ToDto(await _repository.GetWithUsageAsync(id, ct) ?? throw new KeyNotFoundException("Brand was not found."));

    public async Task<BrandAdminDto> CreateAsync(BrandRequest request, CancellationToken ct = default)
    {
        var (name, logo) = Validate(request);
        if (await _repository.NameExistsAsync(name, null, ct))
            throw new InvalidOperationException("A brand with this name already exists.");
        var brand = new Brand { Name = name, LogoBlobUrl = logo };
        await _repository.AddAsync(brand, ct);
        await _repository.SaveChangesAsync(ct);
        return new BrandAdminDto(brand.Id, brand.Name, brand.LogoBlobUrl, 0, 0);
    }

    public async Task<BrandAdminDto> UpdateAsync(int id, BrandRequest request, CancellationToken ct = default)
    {
        var (name, logo) = Validate(request);
        var brand = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Brand was not found.");
        if (await _repository.NameExistsAsync(name, id, ct))
            throw new InvalidOperationException("A brand with this name already exists.");
        brand.Name = name;
        brand.LogoBlobUrl = logo;
        await _repository.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var usage = await _repository.GetWithUsageAsync(id, ct) ?? throw new KeyNotFoundException("Brand was not found.");
        if (usage.ModelCount > 0 || usage.BikeCount > 0)
            throw new BrandReferencedException(usage.ModelCount, usage.BikeCount);
        _repository.Remove(usage.Brand);
        await _repository.SaveChangesAsync(ct);
    }

    private static (string Name, string? Logo) Validate(BrandRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length is < 1 or > 255)
            throw new ArgumentException("Name must contain between 1 and 255 characters.", nameof(request));
        var logo = string.IsNullOrWhiteSpace(request.LogoBlobUrl) ? null : request.LogoBlobUrl.Trim();
        if (logo is not null && logo.Length > 2048)
            throw new ArgumentException("Logo URL must not exceed 2048 characters.", nameof(request));
        return (name, logo);
    }

    private static BrandAdminDto ToDto(BrandUsage u) =>
        new(u.Brand.Id, u.Brand.Name, u.Brand.LogoBlobUrl, u.ModelCount, u.BikeCount);
}
