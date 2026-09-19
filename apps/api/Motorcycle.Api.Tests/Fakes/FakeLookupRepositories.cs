using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests.Fakes;

public sealed class FakeBikeModelRepository : IBikeModelRepository
{
    public Task<List<BikeModel>> GetAllAsync(CancellationToken ct = default) => Task.FromResult(new List<BikeModel>());

    public Task<BikeModel?> GetByIdAsync(int id, CancellationToken ct = default) =>
        Task.FromResult<BikeModel?>(id == 1
            ? new BikeModel { Id = 1, Name = "Ninja 400", Brand = new Brand { Id = 1, Name = "Kawasaki" } }
            : null);

    public Task<bool> BrandExistsAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
    public Task<bool> CategoryExistsAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
    public Task<bool> NameExistsAsync(int brandId, string name, int? excludingId = null, CancellationToken ct = default) => Task.FromResult(false);
    public Task<int> CountDependentBikesAsync(int modelId, CancellationToken ct = default) => Task.FromResult(0);
    public Task AddAsync(BikeModel model, CancellationToken ct = default) => Task.CompletedTask;
    public void Remove(BikeModel model) { }
    public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
}

public sealed class FakeSpecGroupRepository : ISpecGroupRepository
{
    public Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default) =>
        Task.FromResult(new List<SpecGroup>
        {
            new()
            {
                Id = 1,
                Code = "engine",
                Name = "Engine",
                Definitions = new List<SpecDefinition>
                {
                    new() { Id = 1, GroupId = 1, Code = "engine_displacement_cc", Label = "Displacement", DataType = "number" },
                    new() { Id = 2, GroupId = 1, Code = "abs", Label = "ABS", DataType = "boolean" },
                }
            }
        });
}
