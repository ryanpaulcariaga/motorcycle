using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminSpecDefinitionsController : ControllerBase
{
    private readonly ISpecDefinitionAdminService _service;
    public AdminSpecDefinitionsController(ISpecDefinitionAdminService service) => _service = service;

    [HttpGet("api/admin/spec-definitions")]
    public async Task<ActionResult<IReadOnlyList<SpecDefinitionAdminDto>>> GetAll([FromQuery] int? groupId, CancellationToken ct) =>
        Ok(await _service.GetAllAsync(groupId, ct));

    [HttpGet("api/admin/spec-definitions/{id:int}")]
    public async Task<ActionResult<SpecDefinitionAdminDto>> GetById(int id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("api/admin/spec-definitions")]
    public async Task<ActionResult<SpecDefinitionAdminDto>> Create(CreateSpecDefinitionRequest request, CancellationToken ct)
    {
        try { var result = await _service.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { id = result.Id }, result); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (SpecDefinitionCodeExistsException ex) { return Conflict(new { code = "spec_definition_code_exists", message = ex.Message }); }
    }

    [HttpPut("api/admin/spec-definitions/{id:int}")]
    public async Task<ActionResult<SpecDefinitionAdminDto>> Update(int id, UpdateSpecDefinitionRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAsync(id, request, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (SpecDefinitionCodeExistsException ex) { return Conflict(new { code = "spec_definition_code_exists", message = ex.Message }); }
        catch (SpecDefinitionDataTypeIncompatibleException ex) { return Conflict(new { code = "spec_definition_datatype_incompatible", message = ex.Message, affectedBikeCount = ex.AffectedBikeCount }); }
    }

    [HttpPut("api/admin/spec-groups/{groupId:int}/spec-definitions/order")]
    public async Task<ActionResult<IReadOnlyList<SpecDefinitionAdminDto>>> Reorder(int groupId, ReorderSpecDefinitionsRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.ReorderAsync(groupId, request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("api/admin/spec-definitions/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try { await _service.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (SpecDefinitionReferencedException ex) { return Conflict(new { code = "spec_definition_referenced", message = ex.Message, affectedBikeCount = ex.AffectedBikeCount }); }
    }
}
