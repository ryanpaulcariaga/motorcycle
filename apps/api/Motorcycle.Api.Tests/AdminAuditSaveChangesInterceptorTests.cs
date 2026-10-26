using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Motorcycle.Api.Common;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Api.Tests;

public sealed class AdminAuditSaveChangesInterceptorTests
{
    [Fact]
    public async Task AdminEntityCreatesUpdatesAndDeletesAreAuditedWithoutFieldValues()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/admin/brands";
        httpContext.TraceIdentifier = "request-123";
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", "admin-123"),
            new Claim(ClaimTypes.Name, "Admin"),
        ], CookieAuthenticationDefaults.AuthenticationScheme));
        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(new AdminAuditSaveChangesInterceptor(accessor))
            .Options;

        await using var db = new MotorcycleDbContext(options);
        var brand = new Brand { Name = "Original brand" };
        db.Brands.Add(brand);
        await db.SaveChangesAsync();

        brand.Name = "Updated brand";
        await db.SaveChangesAsync();

        db.Brands.Remove(brand);
        await db.SaveChangesAsync();

        var entries = await db.AdminAuditLogs.OrderBy(item => item.Id).ToListAsync();
        Assert.Collection(
            entries,
            created =>
            {
                Assert.Equal("Created", created.Action);
                Assert.Null(created.EntityKey);
                Assert.Contains("Name", created.ChangedFields);
            },
            updated =>
            {
                Assert.Equal("Updated", updated.Action);
                Assert.Contains("Id", updated.EntityKey);
                Assert.Equal("Name", updated.ChangedFields);
            },
            deleted =>
            {
                Assert.Equal("Deleted", deleted.Action);
                Assert.Contains("Id", deleted.EntityKey);
                Assert.Contains("Name", deleted.ChangedFields);
            });

        Assert.All(entries, entry =>
        {
            Assert.Equal("admin-123", entry.ActorId);
            Assert.Equal("Admin", entry.ActorDisplayName);
            Assert.Equal("Brand", entry.EntityType);
            Assert.Equal("request-123", entry.RequestId);
            Assert.DoesNotContain("Original brand", entry.ChangedFields);
            Assert.DoesNotContain("Updated brand", entry.ChangedFields);
        });
    }

    [Fact]
    public async Task ChangesOutsideAdminRoutesAreNotAudited()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/auth/facebook";
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("sub", "user-123")],
            CookieAuthenticationDefaults.AuthenticationScheme));
        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(new AdminAuditSaveChangesInterceptor(accessor))
            .Options;

        await using var db = new MotorcycleDbContext(options);
        db.Brands.Add(new Brand { Name = "Public route brand" });
        await db.SaveChangesAsync();

        Assert.Empty(await db.AdminAuditLogs.ToListAsync());
    }
}
