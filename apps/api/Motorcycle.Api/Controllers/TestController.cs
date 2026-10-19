using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/test")]
public sealed class TestController : ControllerBase
{
    private readonly IDatabaseConnectionTester _tester;

    public TestController(IDatabaseConnectionTester tester) => _tester = tester;

    [AllowAnonymous]
    [HttpGet("db-anonymous")]
    public async Task<ActionResult<bool>> DbAnonymous(CancellationToken ct)
    {
        return Ok(await _tester.CanReadBikeAsync(ct));
    }

    [Authorize(Policy = "AuthenticatedUser")]
    [HttpGet("db-user")]
    public async Task<ActionResult<bool>> DbUser(CancellationToken ct)
    {
        return Ok(await _tester.CanReadBikeAsync(ct));
    }

    [Authorize(Policy = "ActiveAdministrator")]
    [HttpGet("db-admin")]
    public async Task<ActionResult<bool>> DbAdmin(CancellationToken ct)
    {
        return Ok(await _tester.CanReadBikeAsync(ct));
    }
}
