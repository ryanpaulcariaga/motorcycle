using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminCategoriesController : ControllerBase
{
    private readonly ICategoryAdminService _service;
    private readonly IMemoryCache _cache;

    public AdminCategoriesController(ICategoryAdminService service, IMemoryCache cache)
    {
        _service = service;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryAdminDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryAdminDto>> GetById(int id, CancellationToken ct)
    {
        try {
            return Ok(await _service.GetByIdAsync(id, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<CategoryAdminDto>> Create(CategoryRequest request, CancellationToken ct)
    {
        try {
            var result = await _service.CreateAsync(request, ct);
            _cache.Remove(CategoriesController.CacheKey);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return Conflict(new { code = "category_exists", message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryAdminDto>> Update(int id, CategoryRequest request, CancellationToken ct)
    {
        try {
            var result = await _service.UpdateAsync(id, request, ct);
            _cache.Remove(CategoriesController.CacheKey);
            return Ok(result);
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return Conflict(new
            {
                code = "category_exists",
                message = ex.Message
            });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try {
            await _service.DeleteAsync(id, ct);
            _cache.Remove(CategoriesController.CacheKey);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (CategoryReferencedException ex) {
            return Conflict(new
            {
                code = "category_referenced",
                message = ex.Message,
                dependentCount = ex.BikeCount,
                modelCount = ex.ModelCount
            });
        }
    }
}
