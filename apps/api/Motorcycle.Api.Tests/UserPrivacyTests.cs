using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Controllers;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Tests;

public class UserPrivacyTests
{
    [Fact]
    public async Task ExportUsesAuthenticatedUserAndGeneratedTimestamp()
    {
        var repository = new FakeRepository();
        var service = new UserPrivacyService(repository, new FixedClock());
        var expected = Export(7, new DateTime(2026, 11, 22, 3, 0, 0, DateTimeKind.Utc));
        repository.Export = expected;
        var controller = Controller(service);

        var result = Assert.IsType<OkObjectResult>(await controller.Export(default));

        Assert.Same(expected, result.Value);
        Assert.Equal(7, repository.ExportedUserId);
        Assert.Equal(new DateTime(2026, 11, 22, 3, 0, 0, DateTimeKind.Utc), repository.GeneratedAtUtc);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    [Fact]
    public async Task DeleteRequiresPolicyAndAccountRequestHeader()
    {
        Assert.Equal("AuthenticatedUser",
            typeof(UserPrivacyController).GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        var repository = new FakeRepository();
        var controller = Controller(new UserPrivacyService(repository, TimeProvider.System));

        var result = await controller.Delete(default);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Null(repository.DeletedUserId);
    }

    [Fact]
    public async Task MissingOrInactiveAccountsAreNotExported()
    {
        var repository = new FakeRepository();
        var controller = Controller(new UserPrivacyService(repository, TimeProvider.System));

        Assert.IsType<UnauthorizedResult>(await controller.Export(default));
    }

    private static UserPrivacyController Controller(IUserPrivacyService service) =>
        new(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "7")], "test")),
                },
            },
        };

    private static UserDataExportDto Export(int userId, DateTime generatedAtUtc) =>
        new(
            "1.0",
            generatedAtUtc,
            new UserAccountExportDto(
                userId,
                "rider@example.test",
                true,
                "Rider",
                true,
                generatedAtUtc.AddDays(-30),
                generatedAtUtc),
            [],
            [],
            [],
            []);

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() =>
            new(2026, 11, 22, 3, 0, 0, TimeSpan.Zero);
    }

    private sealed class FakeRepository : IUserPrivacyRepository
    {
        public UserDataExportDto? Export { get; set; }
        public int? ExportedUserId { get; private set; }
        public int? DeletedUserId { get; private set; }
        public DateTime? GeneratedAtUtc { get; private set; }

        public Task<UserDataExportDto?> ExportAsync(
            int userId,
            DateTime generatedAtUtc,
            CancellationToken ct)
        {
            ExportedUserId = userId;
            GeneratedAtUtc = generatedAtUtc;
            return Task.FromResult(Export);
        }

        public Task<bool> DeleteAsync(int userId, CancellationToken ct)
        {
            DeletedUserId = userId;
            return Task.FromResult(true);
        }
    }
}
