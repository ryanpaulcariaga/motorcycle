using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class AnalyticsController(IAnalyticsService service) : ControllerBase
{
    [HttpPost("events")]
    [EnableRateLimiting(RateLimitPolicies.Analytics)]
    [RequestSizeLimit(4096)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Record(AnalyticsEventRequest request, CancellationToken ct)
    {
        if (!await service.RecordAsync(request, ct))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid analytics event.", Status = 400 });
        }
        return NoContent();
    }
}
