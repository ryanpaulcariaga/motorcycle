using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/spec-groups")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminSpecGroupsController : ControllerBase
{
    private readonly ISpecGroupAdminService _service;
    public AdminSpecGroupsController(ISpecGroupAdminService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SpecGroupAdminDto>>> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SpecGroupAdminDto>> GetById(int id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<SpecGroupAdminDto>> Create(CreateSpecGroupRequest request, CancellationToken ct)
    {
        try { var result = await _service.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { id = result.Id }, result); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (SpecGroupCodeExistsException ex) { return Conflict(new { code = "spec_group_code_exists", message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SpecGroupAdminDto>> Update(int id, UpdateSpecGroupRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAsync(id, request, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (SpecGroupCodeExistsException ex) { return Conflict(new { code = "spec_group_code_exists", message = ex.Message }); }
    }

    [HttpPut("order")]
    public async Task<ActionResult<IReadOnlyList<SpecGroupAdminDto>>> Reorder(ReorderSpecGroupsRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.ReorderAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try { await _service.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (SpecGroupReferencedException ex) { return Conflict(new { code = "spec_group_referenced", message = ex.Message, dependentCount = ex.DependentCount }); }
    }
}
