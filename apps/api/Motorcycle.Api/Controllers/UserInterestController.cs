using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/user/interests")]
[Authorize(Policy = "AuthenticatedUser")]
public sealed class UserInterestController(IUserInterestService service) : ControllerBase
{
    [HttpGet("preference")]
    public async Task<IActionResult> GetPreference(CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        if (!int.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }
        var enabled = await service.GetPreferenceAsync(userId, ct);
        return enabled.HasValue ? Ok(new UserInterestPreferenceResponse(enabled.Value)) : Unauthorized();
    }

    [HttpPut("preference")]
    public async Task<IActionResult> SetPreference(UpdateUserInterestPreferenceRequest request, CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Interest-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing request header.", Status = 400 });
        }
        if (!request.Enabled.HasValue)
        {
            return BadRequest(new ProblemDetails { Title = "A preference is required.", Status = 400 });
        }
        if (!int.TryParse(User.FindFirstValue("sub"), out var userId) ||
            !await service.SetPreferenceAsync(userId, request.Enabled.Value, ct))
        {
            return Unauthorized();
        }
        return Ok(new UserInterestPreferenceResponse(request.Enabled.Value));
    }

    [HttpPost("events")]
    [EnableRateLimiting(RateLimitPolicies.Analytics)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Record(UserInterestEventRequest request, CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Interest-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing request header.", Status = 400 });
        }
        if (!int.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }
        return await service.RecordAsync(userId, request, ct) switch
        {
            UserInterestRecordResult.Recorded => NoContent(),
            UserInterestRecordResult.InactiveUser => Unauthorized(),
            UserInterestRecordResult.NotEnabled => StatusCode(StatusCodes.Status403Forbidden),
            _ => BadRequest(new ProblemDetails { Title = "Invalid interest event.", Status = 400 })
        };
    }
}
