using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;
using Motorcycle.Api.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/bikes/{bikeId:int}/comments")]
public sealed class BikeCommentsController(
    IBikeCommentService service,
    TestDataAccessService? testDataAccess = null) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int bikeId, CancellationToken ct)
    {
        var comments = await service.GetByBikeAsync(
            bikeId,
            ct,
            await CanViewTestDataAsync(ct));
        return comments is null ? NotFound() : Ok(comments);
    }

    [HttpGet("mine")]
    [Authorize(Policy = "AuthenticatedUser")]
    public async Task<IActionResult> GetMine(int bikeId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comments = await service.GetByUserAsync(
            bikeId,
            userId,
            ct,
            await CanViewTestDataAsync(ct));
        return comments is null ? NotFound() : Ok(comments);
    }

    [HttpPost]
    [Authorize(Policy = "AuthenticatedUser")]
    [EnableRateLimiting(RateLimitPolicies.Reviews)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Create(
        int bikeId,
        CreateBikeCommentRequest request,
        CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Review-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing comment request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comment = await service.CreateAsync(
            bikeId,
            userId,
            request,
            ct,
            await CanViewTestDataAsync(ct));
        return comment is null
            ? BadRequest(new ProblemDetails { Title = "Invalid comment or unavailable bike.", Status = 400 })
            : StatusCode(StatusCodes.Status201Created, comment);
    }

    [HttpPut("{commentId:int}")]
    [Authorize(Policy = "AuthenticatedUser")]
    [EnableRateLimiting(RateLimitPolicies.Reviews)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Update(
        int bikeId,
        int commentId,
        UpdateBikeCommentRequest request,
        CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Review-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing comment request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comment = await service.UpdateAsync(
            bikeId,
            commentId,
            userId,
            request,
            ct,
            await CanViewTestDataAsync(ct));
        return comment is null ? NotFound() : Ok(comment);
    }

    [HttpDelete("{commentId:int}")]
    [Authorize(Policy = "AuthenticatedUser")]
    [EnableRateLimiting(RateLimitPolicies.Reviews)]
    public async Task<IActionResult> Delete(int bikeId, int commentId, CancellationToken ct)
    {
        if (!Request.Headers.ContainsKey("X-Review-Request"))
        {
            return BadRequest(new ProblemDetails { Title = "Missing comment request header.", Status = 400 });
        }
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        return await service.DeleteAsync(
            bikeId,
            commentId,
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
