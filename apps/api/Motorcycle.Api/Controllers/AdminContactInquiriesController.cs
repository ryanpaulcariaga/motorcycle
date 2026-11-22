using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/contact-inquiries")]
[Authorize(Policy = "ActiveAdministrator")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AdminContactInquiriesController(IContactInquiryService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ContactInquiryPageDto>> GetPage(
        [FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await service.GetPageAsync(page, pageSize, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) =>
        await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
