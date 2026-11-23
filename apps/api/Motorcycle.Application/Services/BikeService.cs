using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public interface IBikeService
{
    Task<PagedResult<BikeListItemDto>> GetBikesAsync(
        BikeQueryParameters query,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<BikeDetailDto?> GetBikeDetailAsync(
        string slug,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<CompareResultDto> CompareBikesAsync(
        List<int> bikeIds,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<List<ComparedBikeDto>?> GetMostComparedWithAsync(
        string slug,
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<List<PopularComparisonDto>> GetPopularComparisonsAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<List<FanRankedBikeDto>> GetTopBikesByFansAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);
    Task<List<DailyInterestRankedBikeDto>> GetTopBikesByDailyInterestAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false);
}

public class BikeService : IBikeService
{
    private readonly IBikeRepository _bikeRepository;
    private readonly ISpecGroupRepository _specGroupRepository;
    private readonly ISpecFilterStrategyFactory _strategyFactory;
    private readonly IBikeComparisonRepository _comparisonRepository;
    private readonly TimeProvider _clock;

    public BikeService(
        IBikeRepository bikeRepository,
        ISpecGroupRepository specGroupRepository,
        ISpecFilterStrategyFactory strategyFactory,
        IBikeComparisonRepository comparisonRepository,
        TimeProvider clock)
    {
        _bikeRepository = bikeRepository;
        _specGroupRepository = specGroupRepository;
        _strategyFactory = strategyFactory;
        _comparisonRepository = comparisonRepository;
        _clock = clock;
    }

    public async Task<PagedResult<BikeListItemDto>> GetBikesAsync(
        BikeQueryParameters query,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var bikes = await _bikeRepository.GetPublishedWithStaticFiltersAsync(
            query.Search, query.BrandId, query.CategoryId, query.YearMin, query.YearMax,
            query.PriceMin, query.PriceMax, ct, includeTestData);

        if (query.SpecFilters.Count > 0) {
            var specDefinitions = (await _specGroupRepository.GetAllWithDefinitionsAsync(ct))
                .SelectMany(g => g.Definitions)
                .ToDictionary(d => d.Code, d => d);

            bikes = bikes.Where(bike => query.SpecFilters.All(filter =>
            {
                if (!specDefinitions.TryGetValue(filter.SpecCode, out var def) || def.FilterType is null) {
                    return true; // unknown/non-filterable spec code -> ignore filter
                }

                var strategy = _strategyFactory.Resolve(def.FilterType);
                bike.Specs.TryGetValue(filter.SpecCode, out var value);
                return strategy.IsMatch(value, filter);
            })).ToList();
        }

        bikes = ApplySort(query.Sorts.Count > 0
            ? query.Sorts
            : CreateLegacySorts(query.SortBy, query.SortDescending, query.ThenSortBy, query.ThenSortDescending), bikes);

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

    public async Task<BikeDetailDto?> GetBikeDetailAsync(
        string slug,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var bike = await _bikeRepository.GetBySlugAsync(slug, ct, includeTestData);
        if (bike is null) {
            return null;
        }

        var specGroups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);
        return ToDetailDto(bike, specGroups);
    }

    public async Task<CompareResultDto> CompareBikesAsync(
        List<int> bikeIds,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var bikesById = (await _bikeRepository.GetByIdsAsync(bikeIds, ct, includeTestData))
            .ToDictionary(bike => bike.Id);
        var bikes = bikeIds
            .Distinct()
            .Where(bikesById.ContainsKey)
            .Select(id => bikesById[id])
            .ToList();
        var specGroups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);

        var result = new CompareResultDto
        {
            Bikes = bikes.Select(b =>
            {
                var primaryImage = GetPrimaryImage(b);
                return new CompareBikeSummaryDto
                {
                    Id = b.Id,
                    ModelId = b.ModelId,
                    ModelName = b.Model.Name,
                    VariantName = b.VariantName,
                    BrandName = b.Model.Brand.Name,
                    Slug = b.Slug,
                    PrimaryImageUrl = primaryImage?.BlobUrl,
                    PrimaryImageVariants = ToVariants(primaryImage)
                };
            }).ToList()
        };

        foreach (var group in specGroups.OrderBy(g => g.SortOrder)) {
            var groupDto = new CompareSpecGroupDto
            {
                Code = group.Code,
                Name = group.Name,
                SortOrder = group.SortOrder
            };

            foreach (var def in group.Definitions.OrderBy(d => d.SortOrder)) {
                var row = new CompareSpecRowDto
                {
                    Code = def.Code,
                    Label = def.Label,
                    Unit = def.Unit
                };

                foreach (var bike in bikes) {
                    bike.Specs.TryGetValue(def.Code, out var value);
                    row.ValuesByBikeId[bike.Id.ToString()] = value;
                }

                groupDto.Rows.Add(row);
            }

            result.SpecGroups.Add(groupDto);
        }

        await TrackComparisonAsync(bikes, ct);

        return result;
    }

    public async Task<List<ComparedBikeDto>?> GetMostComparedWithAsync(
        string slug,
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var bike = await _bikeRepository.GetBySlugAsync(slug, ct, includeTestData);
        if (bike is null) {
            return null;
        }

        var matches = await _comparisonRepository.GetMostComparedWithAsync(
            bike.Id,
            limit,
            ct,
            includeTestData);
        return matches.Select(m => new ComparedBikeDto { Bike = ToListItemDto(m.Bike), CompareCount = m.CompareCount }).ToList();
    }

    public async Task<List<PopularComparisonDto>> GetPopularComparisonsAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var matches = await _comparisonRepository.GetMostComparedPairsAsync(
            limit,
            ct,
            includeTestData);
        return matches.Select(m => new PopularComparisonDto
        {
            BikeA = ToListItemDto(m.BikeA),
            BikeB = ToListItemDto(m.BikeB),
            CompareCount = m.CompareCount
        }).ToList();
    }

    public async Task<List<FanRankedBikeDto>> GetTopBikesByFansAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var matches = await _bikeRepository.GetTopByFansAsync(limit, ct, includeTestData);
        return matches.Select(match => new FanRankedBikeDto(
            ToListItemDto(match.Bike),
            match.FanCount,
            Math.Round(match.AverageRating, 1)))
            .ToList();
    }

    public async Task<List<DailyInterestRankedBikeDto>> GetTopBikesByDailyInterestAsync(
        int limit,
        CancellationToken ct = default,
        bool includeTestData = false)
    {
        var day = DateOnly.FromDateTime(_clock.GetUtcNow().UtcDateTime);
        var matches = await _bikeRepository.GetTopByDailyInterestAsync(
            day,
            limit,
            ct,
            includeTestData);
        return matches.Select(match => new DailyInterestRankedBikeDto(
            ToListItemDto(match.Bike),
            match.ViewCount))
            .ToList();
    }

    private async Task TrackComparisonAsync(List<Bike> bikes, CancellationToken ct)
    {
        var ids = bikes.Select(b => b.Id).Distinct().OrderBy(id => id).ToList();
        var pairs = new List<(int, int)>();
        for (var i = 0; i < ids.Count; i++) {
            for (var j = i + 1; j < ids.Count; j++) {
                pairs.Add((ids[i], ids[j]));
            }
        }

        if (pairs.Count == 0) {
            return;
        }

        try {
            await _comparisonRepository.RecordAsync(pairs, ct);
        } catch (Exception) when (!ct.IsCancellationRequested) {
            // Tracking is best-effort and must never break a comparison.
        }
    }

    private static List<BikeSortCriterion> CreateLegacySorts(
        string? sortBy,
        bool descending,
        string? thenSortBy,
        bool thenSortDescending)
    {
        var criteria = new List<BikeSortCriterion>
        {
            new(sortBy ?? "model_name", descending)
        };
        if (!string.IsNullOrWhiteSpace(thenSortBy) && thenSortBy != sortBy) {
            criteria.Add(new BikeSortCriterion(thenSortBy, thenSortDescending));
        }
        return criteria;
    }

    private static List<Bike> ApplySort(IReadOnlyList<BikeSortCriterion> criteria, List<Bike> bikes)
    {
        IOrderedEnumerable<Bike>? sorted = null;
        foreach (var criterion in criteria) {
            if (sorted is null) {
                sorted = criterion.Field switch
                {
                    "brand" => criterion.Descending ? bikes.OrderByDescending(b => b.Model.Brand.Name) : bikes.OrderBy(b => b.Model.Brand.Name),
                    "category" => criterion.Descending ? bikes.OrderByDescending(b => b.Model.Category.Name) : bikes.OrderBy(b => b.Model.Category.Name),
                    "variant_name" => criterion.Descending ? bikes.OrderByDescending(b => b.VariantName) : bikes.OrderBy(b => b.VariantName),
                    "year" => criterion.Descending ? bikes.OrderByDescending(b => b.Year) : bikes.OrderBy(b => b.Year),
                    "price" => criterion.Descending ? bikes.OrderByDescending(b => b.MsrpPrice) : bikes.OrderBy(b => b.MsrpPrice),
                    _ => criterion.Descending ? bikes.OrderByDescending(b => b.Model.Name) : bikes.OrderBy(b => b.Model.Name)
                };
                continue;
            }

            sorted = criterion.Field switch
            {
                "brand" => criterion.Descending ? sorted.ThenByDescending(b => b.Model.Brand.Name) : sorted.ThenBy(b => b.Model.Brand.Name),
                "category" => criterion.Descending ? sorted.ThenByDescending(b => b.Model.Category.Name) : sorted.ThenBy(b => b.Model.Category.Name),
                "variant_name" => criterion.Descending ? sorted.ThenByDescending(b => b.VariantName) : sorted.ThenBy(b => b.VariantName),
                "year" => criterion.Descending ? sorted.ThenByDescending(b => b.Year) : sorted.ThenBy(b => b.Year),
                "price" => criterion.Descending ? sorted.ThenByDescending(b => b.MsrpPrice) : sorted.ThenBy(b => b.MsrpPrice),
                _ => criterion.Descending ? sorted.ThenByDescending(b => b.Model.Name) : sorted.ThenBy(b => b.Model.Name)
            };
        }

        sorted ??= bikes.OrderBy(b => b.Model.Name);
        sorted = sorted.ThenBy(b => b.Model.Name).ThenBy(b => b.VariantName).ThenBy(b => b.Id);
        return sorted.ToList();
    }

    private static BikeListItemDto ToListItemDto(Bike bike)
    {
        var primaryImage = GetPrimaryImage(bike);
        return new BikeListItemDto
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
            IsTestData = bike.IsTestData,
            ModelIsTestData = bike.Model.IsTestData,
            PrimaryImageUrl = primaryImage?.BlobUrl,
            PrimaryImageVariants = ToVariants(primaryImage)
        };
    }

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
            IsTestData = bike.IsTestData,
            ModelIsTestData = bike.Model.IsTestData,
            Images = bike.Images
                .OrderBy(i => i.SortOrder)
                .Select(i => new BikeImageDto
                {
                    Id = i.Id,
                    BlobUrl = i.BlobUrl,
                    Width = i.Width,
                    Height = i.Height,
                    Variants = ToVariants(i),
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary
                })
                .ToList()
        };

        foreach (var group in specGroups.OrderBy(g => g.SortOrder)) {
            var groupDto = new SpecGroupWithValuesDto
            {
                Code = group.Code,
                Name = group.Name,
                SortOrder = group.SortOrder
            };

            foreach (var def in group.Definitions.OrderBy(d => d.SortOrder)) {
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

    private static BikeImage? GetPrimaryImage(Bike bike) =>
        bike.Images.FirstOrDefault(image => image.IsPrimary) ?? bike.Images.FirstOrDefault();

    private static BikeImageVariantsDto? ToVariants(BikeImage? image) =>
        image is null || image.SmallUrl is null && image.MediumUrl is null && image.LargeUrl is null && image.XlUrl is null
            ? null
            : new BikeImageVariantsDto(image.SmallUrl, image.MediumUrl, image.LargeUrl, image.XlUrl);
}
