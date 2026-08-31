using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private const string CacheKey = "categories";
    private readonly ILookupService _lookupService;
    private readonly IMemoryCache _cache;

    public CategoriesController(ILookupService lookupService, IMemoryCache cache)
    {
        _lookupService = lookupService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out var cached))
            return Ok(cached);

        var categories = await _lookupService.GetCategoriesAsync(ct);
        _cache.Set(CacheKey, categories, TimeSpan.FromMinutes(10));
        return Ok(categories);
    }
}
