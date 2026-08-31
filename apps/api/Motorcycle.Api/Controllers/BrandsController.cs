using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/brands")]
public class BrandsController : ControllerBase
{
    private const string CacheKey = "brands";
    private readonly ILookupService _lookupService;
    private readonly IMemoryCache _cache;

    public BrandsController(ILookupService lookupService, IMemoryCache cache)
    {
        _lookupService = lookupService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetBrands(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out var cached))
            return Ok(cached);

        var brands = await _lookupService.GetBrandsAsync(ct);
        _cache.Set(CacheKey, brands, TimeSpan.FromMinutes(10));
        return Ok(brands);
    }
}
