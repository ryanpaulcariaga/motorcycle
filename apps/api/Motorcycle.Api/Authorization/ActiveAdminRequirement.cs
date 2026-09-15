using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Authorization;

public sealed class ActiveAdminRequirement : IAuthorizationRequirement;

public sealed class ActiveAdminHandler : AuthorizationHandler<ActiveAdminRequirement>
{
    private readonly IAdminRoleRepository _repository;

    public ActiveAdminHandler(IAdminRoleRepository repository) => _repository = repository;

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ActiveAdminRequirement requirement)
    {
        var facebookUserId = context.User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(facebookUserId)) return;

        var role = await _repository.GetByFacebookUserIdAsync(facebookUserId, context.Resource is HttpContext httpContext
            ? httpContext.RequestAborted
            : CancellationToken.None);
        if (role?.IsActive == true && role.Role == Motorcycle.Domain.AdminRoles.Administrator)
            context.Succeed(requirement);
    }
}
