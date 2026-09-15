using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/admin-roles")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminRolesController : ControllerBase
{
    private readonly IAdminRoleService _service;

    public AdminRolesController(IAdminRoleService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminRoleDto>>> GetAll(CancellationToken ct)
    {
        var roles = await _service.GetAllAsync(ct);
        return Ok(roles.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<AdminRoleDto>> Create(CreateAdminRoleRequest request, CancellationToken ct)
    {
        try
        {
            var role = await _service.ProvisionAsync(request.FacebookUserId, request.EmailSnapshot, request.DisplayNameSnapshot, request.Role, ct);
            return CreatedAtAction(nameof(GetAll), new { id = role.Id }, ToDto(role));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { code = "admin_role_exists", message = ex.Message });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<AdminRoleDto>> Update(int id, UpdateAdminRoleRequest request, CancellationToken ct)
    {
        try
        {
            var role = await _service.UpdateAsync(id, request.EmailSnapshot, request.DisplayNameSnapshot, request.Role, request.IsActive, ct);
            return Ok(ToDto(role));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private static AdminRoleDto ToDto(AdminRole role) => new(
        role.Id,
        role.FacebookUserId,
        role.EmailSnapshot,
        role.DisplayNameSnapshot,
        role.Role,
        role.IsActive,
        role.CreatedAt,
        role.UpdatedAt);
}
