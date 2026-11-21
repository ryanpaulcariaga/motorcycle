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
[Route("api/bikes/{bikeId:int}/reviews")]
public sealed class BikeReviewsController(IBikeReviewService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int bikeId, CancellationToken ct)
    {
        var reviews = await service.GetByBikeAsync(bikeId, ct);
        return reviews is null ? NotFound() : Ok(reviews);
    }

    [HttpGet("mine")]
    [Authorize(Policy = "AuthenticatedUser")]
    public async Task<IActionResult> GetMine(int bikeId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var review = await service.GetByUserAsync(bikeId, userId, ct);
        return review is null ? NoContent() : Ok(review);
    }

    [HttpPut]
    [Authorize(Policy = "AuthenticatedUser")]
    [EnableRateLimiting(RateLimitPolicies.Reviews)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Upsert(int bikeId, UpsertBikeReviewRequest request, CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Review-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing review request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await service.UpsertAsync(bikeId, userId, request, ct);
        if (result == BikeReviewWriteResult.Unavailable)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid review or unavailable bike.", Status = 400 });
        }

        var review = await service.GetByUserAsync(bikeId, userId, ct);
        return review is null ? NotFound() : Ok(review);
    }

    [HttpDelete]
    [Authorize(Policy = "AuthenticatedUser")]
    [EnableRateLimiting(RateLimitPolicies.Reviews)]
    public async Task<IActionResult> Delete(int bikeId, CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Review-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing review request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        return await service.DeleteAsync(bikeId, userId, ct) ? NoContent() : NotFound();
    }

    private bool TryGetUserId(out int userId) =>
        int.TryParse(User.FindFirstValue("sub"), out userId);
}
