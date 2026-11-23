using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Services;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/user/account")]
[Authorize(Policy = "AuthenticatedUser")]
public sealed class UserPrivacyController(
    IUserPrivacyService service,
    TestDataAccessService? testDataAccess = null) : ControllerBase
{
    [HttpGet("export")]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var export = await service.ExportAsync(userId, ct);
        return export is null ? Unauthorized() : Ok(export);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Account-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing account request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId) || !await service.DeleteAsync(userId, ct))
        {
            return Unauthorized();
        }

        testDataAccess?.InvalidateUser(userId);
        await HttpContext.SignOutAsync(UserAuthenticationController.SchemeName);
        return NoContent();
    }

    private bool TryGetUserId(out int userId) =>
        int.TryParse(User.FindFirstValue("sub"), out userId);
}
