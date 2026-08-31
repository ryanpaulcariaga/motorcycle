using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/spec-groups")]
public class SpecGroupsController : ControllerBase
{
    private const string CacheKey = "spec-groups";
    private readonly ILookupService _lookupService;
    private readonly IMemoryCache _cache;

    public SpecGroupsController(ILookupService lookupService, IMemoryCache cache)
    {
        _lookupService = lookupService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetSpecGroups(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out var cached))
            return Ok(cached);

        var specGroups = await _lookupService.GetSpecGroupsAsync(ct);
        _cache.Set(CacheKey, specGroups, TimeSpan.FromMinutes(10));
        return Ok(specGroups);
    }
}
