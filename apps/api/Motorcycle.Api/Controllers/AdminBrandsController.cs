using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/brands")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminBrandsController : ControllerBase
{
    private readonly IBrandAdminService _service;
    private readonly IMemoryCache _cache;

    public AdminBrandsController(IBrandAdminService service, IMemoryCache cache)
    {
        _service = service;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BrandAdminDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BrandAdminDto>> GetById(int id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<BrandAdminDto>> Create(BrandRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateAsync(request, ct);
            _cache.Remove(BrandsController.CacheKey);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "brand_exists", message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BrandAdminDto>> Update(int id, BrandRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request, ct);
            _cache.Remove(BrandsController.CacheKey);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "brand_exists", message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);
            _cache.Remove(BrandsController.CacheKey);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (BrandReferencedException ex)
        {
            return Conflict(new { code = "brand_referenced", message = ex.Message, dependentCount = ex.BikeCount, modelCount = ex.ModelCount });
        }
    }
}
