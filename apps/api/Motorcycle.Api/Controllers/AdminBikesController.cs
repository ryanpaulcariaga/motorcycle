using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/bikes")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminBikesController : ControllerBase
{
    private readonly IBikeAdminService _service;
    public AdminBikesController(IBikeAdminService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BikeAdminListItemDto>>> GetAll([FromQuery] int? modelId, CancellationToken ct) =>
        Ok(await _service.GetAllAsync(modelId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BikeAdminDetailDto>> GetById(int id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<BikeAdminDetailDto>> Create(CreateBikeRequest request, CancellationToken ct)
    {
        try { var result = await _service.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { id = result.Id }, result); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "bike_exists", message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BikeAdminDetailDto>> Update(int id, UpdateBikeRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAsync(id, request, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "bike_exists", message = ex.Message }); }
    }

    [HttpPatch("{id:int}/publish")]
    public async Task<ActionResult<BikeAdminDetailDto>> Publish(int id, CancellationToken ct)
    {
        try { return Ok(await _service.PublishAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { code = "bike_not_publishable", message = ex.Message }); }
    }

    [HttpPatch("{id:int}/unpublish")]
    public async Task<ActionResult<BikeAdminDetailDto>> Unpublish(int id, CancellationToken ct)
    {
        try { return Ok(await _service.UnpublishAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try { await _service.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (BikeReferencedException ex) { return Conflict(new { code = "bike_referenced", message = ex.Message, dependentCount = ex.DependentCount }); }
    }
}
