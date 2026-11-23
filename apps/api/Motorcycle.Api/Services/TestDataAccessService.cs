using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Services;

public sealed class TestDataAccessService(
    IAdminRoleRepository roles,
    ILogger<TestDataAccessService> logger)
{
    public async Task<bool> CanViewAsync(
        HttpContext httpContext,
        CancellationToken ct)
    {
        var authentication = await httpContext.AuthenticateAsync(
            Controllers.UserAuthenticationController.SchemeName);
        if (authentication.Failure is not null) {
            logger.LogDebug(
                authentication.Failure,
                "The public-user cookie could not be authenticated.");
        }
        var subject = authentication.Principal?.FindFirst("sub")?.Value;
        if (!authentication.Succeeded ||
            !int.TryParse(subject, out var userId)) {
            return false;
        }

        var allowed = await roles.CanViewTestDataAsync(userId, ct);
        logger.LogDebug(
            "Public test-data access evaluated for user {UserId}: {Allowed}.",
            userId,
            allowed);
        return allowed;
    }
}
