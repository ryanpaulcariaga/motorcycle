using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public interface IBikeService
{
    Task<PagedResult<BikeListItemDto>> GetBikesAsync(BikeQueryParameters query, CancellationToken ct = default);
    Task<BikeDetailDto?> GetBikeDetailAsync(string slug, CancellationToken ct = default);
    Task<CompareResultDto> CompareBikesAsync(List<int> bikeIds, CancellationToken ct = default);
}

public class BikeService : IBikeService
{
    private readonly IBikeRepository _bikeRepository;
    private readonly ISpecGroupRepository _specGroupRepository;
    private readonly ISpecFilterStrategyFactory _strategyFactory;

    public BikeService(
        IBikeRepository bikeRepository,
        ISpecGroupRepository specGroupRepository,
        ISpecFilterStrategyFactory strategyFactory)
    {
        _bikeRepository = bikeRepository;
        _specGroupRepository = specGroupRepository;
        _strategyFactory = strategyFactory;
    }

    public async Task<PagedResult<BikeListItemDto>> GetBikesAsync(BikeQueryParameters query, CancellationToken ct = default)
    {
        var bikes = await _bikeRepository.GetPublishedWithStaticFiltersAsync(
            query.BrandId, query.CategoryId, query.YearMin, query.YearMax,
            query.PriceMin, query.PriceMax, ct);

        if (query.SpecFilters.Count > 0)
        {
            var specDefinitions = (await _specGroupRepository.GetAllWithDefinitionsAsync(ct))
                .SelectMany(g => g.Definitions)
                .ToDictionary(d => d.Code, d => d);

            bikes = bikes.Where(bike => query.SpecFilters.All(filter =>
            {
                if (!specDefinitions.TryGetValue(filter.SpecCode, out var def) || def.FilterType is null)
                    return true; // unknown/non-filterable spec code -> ignore filter

                var strategy = _strategyFactory.Resolve(def.FilterType);
                bike.Specs.TryGetValue(filter.SpecCode, out var value);
                return strategy.IsMatch(value, filter);
            })).ToList();
        }

        bikes = ApplySort(bikes, query.SortBy, query.SortDescending);

        var totalCount = bikes.Count;
        var pageItems = bikes
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(ToListItemDto)
            .ToList();

        return new PagedResult<BikeListItemDto>
        {
            Items = pageItems,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<BikeDetailDto?> GetBikeDetailAsync(string slug, CancellationToken ct = default)
    {
        var bike = await _bikeRepository.GetBySlugAsync(slug, ct);
        if (bike is null) return null;

        var specGroups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);
        return ToDetailDto(bike, specGroups);
    }

    public async Task<CompareResultDto> CompareBikesAsync(List<int> bikeIds, CancellationToken ct = default)
    {
        var bikes = await _bikeRepository.GetByIdsAsync(bikeIds, ct);
        var specGroups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);

        var result = new CompareResultDto
        {
            Bikes = bikes.Select(b => new CompareBikeSummaryDto
            {
                Id = b.Id,
                ModelId = b.ModelId,
                ModelName = b.Model.Name,
                VariantName = b.VariantName,
                BrandName = b.Model.Brand.Name,
                Slug = b.Slug,
                PrimaryImageUrl = b.Images.FirstOrDefault(i => i.IsPrimary)?.BlobUrl ?? b.Images.FirstOrDefault()?.BlobUrl
            }).ToList()
        };

        foreach (var group in specGroups.OrderBy(g => g.SortOrder))
        {
            var groupDto = new CompareSpecGroupDto
            {
                Code = group.Code,
                Name = group.Name,
                SortOrder = group.SortOrder
            };

            foreach (var def in group.Definitions.OrderBy(d => d.SortOrder))
            {
                var row = new CompareSpecRowDto
                {
                    Code = def.Code,
                    Label = def.Label,
                    Unit = def.Unit
                };

                foreach (var bike in bikes)
                {
                    bike.Specs.TryGetValue(def.Code, out var value);
                    row.ValuesByBikeId[bike.Id.ToString()] = value;
                }

                groupDto.Rows.Add(row);
            }

            result.SpecGroups.Add(groupDto);
        }

        return result;
    }

    private static List<Bike> ApplySort(List<Bike> bikes, string? sortBy, bool descending)
    {
        IEnumerable<Bike> sorted = sortBy?.ToLowerInvariant() switch
        {
            "price" => descending ? bikes.OrderByDescending(b => b.MsrpPrice) : bikes.OrderBy(b => b.MsrpPrice),
            "year" => descending ? bikes.OrderByDescending(b => b.Year) : bikes.OrderBy(b => b.Year),
            "model_name" => descending ? bikes.OrderByDescending(b => b.Model.Name) : bikes.OrderBy(b => b.Model.Name),
            _ => bikes.OrderBy(b => b.Model.Name).ThenBy(b => b.VariantName)
        };
        return sorted.ToList();
    }

    private static BikeListItemDto ToListItemDto(Bike bike) => new()
    {
        Id = bike.Id,
        ModelId = bike.ModelId,
        ModelName = bike.Model.Name,
        VariantName = bike.VariantName,
        Year = bike.Year,
        MsrpPrice = bike.MsrpPrice,
        Slug = bike.Slug,
        BrandName = bike.Model.Brand.Name,
        CategoryName = bike.Model.Category.Name,
        PrimaryImageUrl = bike.Images.FirstOrDefault(i => i.IsPrimary)?.BlobUrl ?? bike.Images.FirstOrDefault()?.BlobUrl
    };

    private static BikeDetailDto ToDetailDto(Bike bike, List<SpecGroup> specGroups)
    {
        var dto = new BikeDetailDto
        {
            Id = bike.Id,
            ModelId = bike.ModelId,
            ModelName = bike.Model.Name,
            VariantName = bike.VariantName,
            Year = bike.Year,
            MsrpPrice = bike.MsrpPrice,
            Slug = bike.Slug,
            BrandName = bike.Model.Brand.Name,
            CategoryName = bike.Model.Category.Name,
            Images = bike.Images
                .OrderBy(i => i.SortOrder)
                .Select(i => new BikeImageDto { Id = i.Id, BlobUrl = i.BlobUrl, SortOrder = i.SortOrder, IsPrimary = i.IsPrimary })
                .ToList()
        };

        foreach (var group in specGroups.OrderBy(g => g.SortOrder))
        {
            var groupDto = new SpecGroupWithValuesDto
            {
                Code = group.Code,
                Name = group.Name,
                SortOrder = group.SortOrder
            };

            foreach (var def in group.Definitions.OrderBy(d => d.SortOrder))
            {
                bike.Specs.TryGetValue(def.Code, out var value);
                groupDto.Specs.Add(new SpecValueDto
                {
                    Code = def.Code,
                    Label = def.Label,
                    Unit = def.Unit,
                    SortOrder = def.SortOrder,
                    Value = value
                });
            }

            dto.SpecGroups.Add(groupDto);
        }

        return dto;
    }
}
