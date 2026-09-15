using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/bike-models")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminBikeModelsController : ControllerBase
{
    private readonly IBikeModelService _service;
    public AdminBikeModelsController(IBikeModelService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BikeModelDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BikeModelDto>> GetById(int id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<BikeModelDto>> Create(CreateBikeModelRequest request, CancellationToken ct)
    {
        try { var result = await _service.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { id = result.Id }, result); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "bike_model_exists", message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BikeModelDto>> Update(int id, UpdateBikeModelRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAsync(id, request, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { code = "bike_model_exists", message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try { await _service.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (BikeModelReferencedException ex) { return Conflict(new { code = "bike_model_referenced", message = ex.Message, dependentCount = ex.DependentCount }); }
    }
}
