using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface ILookupService
{
    Task<List<BrandDto>> GetBrandsAsync(CancellationToken ct = default);
    Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<List<SpecGroupDto>> GetSpecGroupsAsync(CancellationToken ct = default);
}

public class LookupService : ILookupService
{
    private readonly IBrandRepository _brandRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ISpecGroupRepository _specGroupRepository;

    public LookupService(
        IBrandRepository brandRepository,
        ICategoryRepository categoryRepository,
        ISpecGroupRepository specGroupRepository)
    {
        _brandRepository = brandRepository;
        _categoryRepository = categoryRepository;
        _specGroupRepository = specGroupRepository;
    }

    public async Task<List<BrandDto>> GetBrandsAsync(CancellationToken ct = default)
    {
        var brands = await _brandRepository.GetAllAsync(ct);
        return brands
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto { Id = b.Id, Name = b.Name, LogoBlobUrl = b.LogoBlobUrl })
            .ToList();
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var categories = await _categoryRepository.GetAllAsync(ct);
        return categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto { Id = c.Id, Name = c.Name })
            .ToList();
    }

    public async Task<List<SpecGroupDto>> GetSpecGroupsAsync(CancellationToken ct = default)
    {
        var groups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);
        return groups
            .OrderBy(g => g.SortOrder)
            .Select(g => new SpecGroupDto
            {
                Id = g.Id,
                Code = g.Code,
                Name = g.Name,
                SortOrder = g.SortOrder,
                IconName = g.IconName,
                Definitions = g.Definitions
                    .OrderBy(d => d.SortOrder)
                    .Select(d => new SpecDefinitionDto
                    {
                        Id = d.Id,
                        Code = d.Code,
                        Label = d.Label,
                        DataType = d.DataType,
                        Unit = d.Unit,
                        SortOrder = d.SortOrder,
                        IsFilterable = d.IsFilterable,
                        FilterType = d.FilterType
                    })
                    .ToList()
            })
            .ToList();
    }
}
