using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminAnalyticsController(IAnalyticsService service, TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AnalyticsDashboardResponse>> Get(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var end = to ?? today;
        if (end < today.AddMonths(-12) || end > today)
        {
            return BadRequest(new ProblemDetails { Title = "Choose dates within the last 12 months.", Status = 400 });
        }
        var start = from ?? end.AddDays(-29);
        if (start > end || start < today.AddMonths(-12))
        {
            return BadRequest(new ProblemDetails { Title = "Choose dates within the last 12 months.", Status = 400 });
        }
        return Ok(await service.GetDashboardAsync(start, end, ct));
    }
}
