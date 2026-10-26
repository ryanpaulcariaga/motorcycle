using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/audit-logs")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminAuditLogsController : ControllerBase
{
    private readonly IAdminAuditLogService _service;

    public AdminAuditLogsController(IAdminAuditLogService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<AdminAuditLogPageDto>> GetPage(
        [FromQuery, Range(1, int.MaxValue)] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 50,
        CancellationToken ct = default) =>
        Ok(await _service.GetPageAsync(page, pageSize, ct));
}
