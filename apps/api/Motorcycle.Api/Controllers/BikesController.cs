using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Motorcycle.Application.Common;
using Motorcycle.Application.Services;
using Motorcycle.Api.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/bikes")]
public class BikesController : ControllerBase
{
    private readonly IBikeService _bikeService;
    private readonly TestDataAccessService _testDataAccess;

    public BikesController(
        IBikeService bikeService,
        TestDataAccessService testDataAccess)
    {
        _bikeService = bikeService;
        _testDataAccess = testDataAccess;
    }

    /// <summary>List bikes with pagination, sorting, static filters, and dynamic spec filters.</summary>
    /// <remarks>
    /// Dynamic spec filters use dedicated query params: specCode, specValue (exact/boolean),
    /// specMin, specMax (range), specValues (multiselect, comma-separated).
    /// </remarks>
    [HttpGet]
    public async Task<IActionResult> GetBikes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        [FromQuery] string? thenSortBy = null,
        [FromQuery] bool thenSortDescending = false,
        [FromQuery] string? search = null,
        [FromQuery] bool includeDiscontinued = false,
        [FromQuery] int? brandId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? yearMin = null,
        [FromQuery] int? yearMax = null,
        [FromQuery] decimal? priceMin = null,
        [FromQuery] decimal? priceMax = null,
        [FromQuery] string? specCode = null,
        [FromQuery] string? specValue = null,
        [FromQuery] string? specMin = null,
        [FromQuery] string? specMax = null,
        [FromQuery] string? specValues = null,
        CancellationToken ct = default)
    {
        var sortCriteria = new List<BikeSortCriterion>();
        if (!string.IsNullOrWhiteSpace(sort)) {
            foreach (var rule in sort.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)) {
                var parts = rule.Split(':', StringSplitOptions.TrimEntries);
                if (parts.Length != 2 ||
                    parts[1] is not ("asc" or "desc") ||
                    parts[0] is not ("brand" or "category" or "model_name" or "variant_name" or "year" or "price")) {
                    return BadRequest(new { message = "Sort must contain supported field:direction pairs." });
                }

                sortCriteria.Add(new BikeSortCriterion(parts[0], parts[1] == "desc"));
            }
        }

        var query = new BikeQueryParameters
        {
            Page = page < 1 ? 1 : page,
            PageSize = pageSize is < 1 or > 100 ? 20 : pageSize,
            Sorts = sortCriteria,
            SortBy = sortBy,
            SortDescending = sortDescending,
            ThenSortBy = thenSortBy,
            ThenSortDescending = thenSortDescending,
            Search = search,
            IncludeDiscontinued = includeDiscontinued,
            BrandId = brandId,
            CategoryId = categoryId,
            YearMin = yearMin,
            YearMax = yearMax,
            PriceMin = priceMin,
            PriceMax = priceMax
        };

        if (!string.IsNullOrWhiteSpace(specCode)) {
            query.SpecFilters.Add(new SpecFilterRequest
            {
                SpecCode = specCode,
                Value = specValue,
                Min = specMin,
                Max = specMax,
                Values = specValues?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            });
        }

        var result = await _bikeService.GetBikesAsync(
            query,
            ct,
            await CanViewTestDataAsync(ct));
        return Ok(result);
    }

    /// <summary>Get full detail for a bike by its slug, including images and grouped/ordered specs.</summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBikeBySlug(
        string slug,
        [FromQuery] bool published = true,
        CancellationToken ct = default)
    {
        var bike = await _bikeService.GetBikeDetailAsync(
            slug,
            ct,
            await CanViewTestDataAsync(ct),
            published);
        return bike is null ? NotFound() : Ok(bike);
    }

    /// <summary>Compare 2+ bikes side-by-side, aligned by spec group/spec definition order.</summary>
    [HttpGet("compare")]
    public async Task<IActionResult> Compare([FromQuery] string ids, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ids)) {
            return BadRequest("Query parameter 'ids' is required (comma-separated bike ids).");
        }

        var bikeIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(id => int.TryParse(id, out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value)
            .ToList();

        if (bikeIds.Count == 0) {
            return BadRequest("No valid bike ids found in 'ids'.");
        }

        var result = await _bikeService.CompareBikesAsync(
            bikeIds,
            ct,
            await CanViewTestDataAsync(ct));
        return Ok(result);
    }

    /// <summary>Most compared bike pairs, for the "Popular Comparisons" sidebar.</summary>
    [HttpGet("popular-comparisons")]
    public async Task<IActionResult> GetPopularComparisons([FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await _bikeService.GetPopularComparisonsAsync(
            limit is < 1 or > 20 ? 10 : limit,
            ct,
            await CanViewTestDataAsync(ct));
        return Ok(result);
    }

    /// <summary>Published bikes with the most active-user ratings, for the "Most Popular" sidebar.</summary>
    [HttpGet("top-by-fans")]
    public async Task<IActionResult> GetTopByFans([FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await _bikeService.GetTopBikesByFansAsync(
            limit is < 1 or > 20 ? 10 : limit,
            ct,
            await CanViewTestDataAsync(ct));
        return Ok(result);
    }

    /// <summary>Published bikes ranked by today's UTC opt-in bike-view count.</summary>
    [HttpGet("top-by-daily-interest")]
    public async Task<IActionResult> GetTopByDailyInterest(
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        var result = await _bikeService.GetTopBikesByDailyInterestAsync(
            limit is < 1 or > 20 ? 10 : limit,
            ct,
            await CanViewTestDataAsync(ct));
        return Ok(result);
    }

    /// <summary>Bikes most often compared with the given bike, to recommend as comparison options.</summary>
    [HttpGet("{slug}/compared-with")]
    public async Task<IActionResult> GetComparedWith(string slug, [FromQuery] int limit = 4, CancellationToken ct = default)
    {
        var result = await _bikeService.GetMostComparedWithAsync(
            slug,
            limit is < 1 or > 12 ? 4 : limit,
            ct,
            await CanViewTestDataAsync(ct));
        return result is null ? NotFound() : Ok(result);
    }

    private Task<bool> CanViewTestDataAsync(CancellationToken ct) =>
        _testDataAccess.CanViewAsync(HttpContext, ct);
}
