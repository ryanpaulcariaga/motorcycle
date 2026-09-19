using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Controllers;

namespace Motorcycle.Api.Tests;

public class AdminBikesControllerAuthorizationTests
{
    [Fact]
    public void Controller_RequiresActiveAdministratorPolicy()
    {
        var authorize = typeof(AdminBikesController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorize);
        Assert.Equal("ActiveAdministrator", authorize!.Policy);
    }

    [Fact]
    public void Controller_UsesAdminBikesRoute()
    {
        var route = typeof(AdminBikesController).GetCustomAttribute<RouteAttribute>();

        Assert.NotNull(route);
        Assert.Equal("api/admin/bikes", route!.Template);
    }
}
