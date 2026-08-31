using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IBrandRepository
{
    Task<List<Brand>> GetAllAsync(CancellationToken ct = default);
}

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(CancellationToken ct = default);
}

public interface ISpecGroupRepository
{
    Task<List<SpecGroup>> GetAllWithDefinitionsAsync(CancellationToken ct = default);
}
