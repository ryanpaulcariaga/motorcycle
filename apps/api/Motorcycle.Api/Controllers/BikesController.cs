using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.Common;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/bikes")]
public class BikesController : ControllerBase
{
    private readonly IBikeService _bikeService;

    public BikesController(IBikeService bikeService)
    {
        _bikeService = bikeService;
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
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
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
        var query = new BikeQueryParameters
        {
            Page = page < 1 ? 1 : page,
            PageSize = pageSize is < 1 or > 100 ? 20 : pageSize,
            SortBy = sortBy,
            SortDescending = sortDescending,
            BrandId = brandId,
            CategoryId = categoryId,
            YearMin = yearMin,
            YearMax = yearMax,
            PriceMin = priceMin,
            PriceMax = priceMax
        };

        if (!string.IsNullOrWhiteSpace(specCode))
        {
            query.SpecFilters.Add(new SpecFilterRequest
            {
                SpecCode = specCode,
                Value = specValue,
                Min = specMin,
                Max = specMax,
                Values = specValues?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            });
        }

        var result = await _bikeService.GetBikesAsync(query, ct);
        return Ok(result);
    }

    /// <summary>Get full detail for a bike by its slug, including images and grouped/ordered specs.</summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBikeBySlug(string slug, CancellationToken ct)
    {
        var bike = await _bikeService.GetBikeDetailAsync(slug, ct);
        return bike is null ? NotFound() : Ok(bike);
    }

    /// <summary>Compare 2+ bikes side-by-side, aligned by spec group/spec definition order.</summary>
    [HttpGet("compare")]
    public async Task<IActionResult> Compare([FromQuery] string ids, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ids))
            return BadRequest("Query parameter 'ids' is required (comma-separated bike ids).");

        var bikeIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(id => int.TryParse(id, out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value)
            .ToList();

        if (bikeIds.Count == 0)
            return BadRequest("No valid bike ids found in 'ids'.");

        var result = await _bikeService.CompareBikesAsync(bikeIds, ct);
        return Ok(result);
    }
}
