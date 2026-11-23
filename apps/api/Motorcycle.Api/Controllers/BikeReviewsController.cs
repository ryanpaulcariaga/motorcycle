using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Api.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/bikes/{bikeId:int}/reviews")]
public sealed class BikeReviewsController(
    IBikeReviewService service,
    TestDataAccessService? testDataAccess = null) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int bikeId, CancellationToken ct)
    {
        var reviews = await service.GetByBikeAsync(
            bikeId,
            ct,
            await CanViewTestDataAsync(ct));
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

        var review = await service.GetByUserAsync(
            bikeId,
            userId,
            ct,
            await CanViewTestDataAsync(ct));
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

        var canViewTestData = await CanViewTestDataAsync(ct);
        var result = await service.UpsertAsync(
            bikeId,
            userId,
            request,
            ct,
            canViewTestData);
        if (result == BikeReviewWriteResult.Unavailable)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid review or unavailable bike.", Status = 400 });
        }

        var review = await service.GetByUserAsync(
            bikeId,
            userId,
            ct,
            canViewTestData);
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

        return await service.DeleteAsync(
            bikeId,
            userId,
            ct,
            await CanViewTestDataAsync(ct))
            ? NoContent()
            : NotFound();
    }

    private bool TryGetUserId(out int userId) =>
        int.TryParse(User.FindFirstValue("sub"), out userId);

    private Task<bool> CanViewTestDataAsync(CancellationToken ct) =>
        testDataAccess?.CanViewAsync(HttpContext, ct) ?? Task.FromResult(false);
}
