using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests.Fakes;

public sealed class FakeBikeAdminRepository : IBikeAdminRepository
{
    private readonly List<Bike> _bikes = new();
    private readonly Dictionary<int, int> _dependentImageCounts = new();
    private int _nextId = 1;

    public IReadOnlyList<Bike> Bikes => _bikes;

    public void SetDependentImageCount(int bikeId, int count) => _dependentImageCounts[bikeId] = count;

    public Task<List<Bike>> GetAllAsync(int? modelId, CancellationToken ct = default) =>
        Task.FromResult(_bikes.Where(b => !modelId.HasValue || b.ModelId == modelId.Value).ToList());

    public Task<Bike?> GetByIdAsync(int id, CancellationToken ct = default) =>
        Task.FromResult(_bikes.SingleOrDefault(b => b.Id == id));

    public Task<bool> BikeModelExistsAsync(int modelId, CancellationToken ct = default) =>
        Task.FromResult(modelId == 1);

    public Task<bool> VariantExistsAsync(int modelId, int year, string variantName, int? excludingId = null, CancellationToken ct = default) =>
        Task.FromResult(_bikes.Any(b => b.ModelId == modelId && b.Year == year && b.VariantName == variantName && (!excludingId.HasValue || b.Id != excludingId.Value)));

    public Task<int> CountDependentImagesAsync(int bikeId, CancellationToken ct = default) =>
        Task.FromResult(_dependentImageCounts.GetValueOrDefault(bikeId, 0));

    public Task AddAsync(Bike bike, CancellationToken ct = default)
    {
        bike.Id = _nextId++;
        _bikes.Add(bike);
        return Task.CompletedTask;
    }

    public void Remove(Bike bike) => _bikes.RemoveAll(b => b.Id == bike.Id);

    public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
}
