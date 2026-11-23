using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Motorcycle.Api.Services;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public sealed class TestDataAccessServiceTests
{
    [Fact]
    public async Task CanViewAsync_ReusesPermissionAcrossRequests()
    {
        var repository = new FakeAdminRoleRepository { Allowed = true };
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new TestDataAccessService(
            repository,
            cache,
            NullLogger<TestDataAccessService>.Instance);

        Assert.True(await service.CanViewAsync(CreateContext(7), default));
        Assert.True(await service.CanViewAsync(CreateContext(7), default));

        Assert.Equal(1, repository.PermissionChecks);
    }

    [Fact]
    public async Task CanViewAsync_RechecksAfterInvalidation()
    {
        var repository = new FakeAdminRoleRepository();
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new TestDataAccessService(
            repository,
            cache,
            NullLogger<TestDataAccessService>.Instance);

        Assert.False(await service.CanViewAsync(CreateContext(7), default));
        repository.Allowed = true;
        service.InvalidateAll();

        Assert.True(await service.CanViewAsync(CreateContext(7), default));
        Assert.Equal(2, repository.PermissionChecks);
    }

    private static DefaultHttpContext CreateContext(int userId)
    {
        var authentication = new FakeAuthenticationService(userId);
        var services = new ServiceCollection()
            .AddSingleton<IAuthenticationService>(authentication)
            .BuildServiceProvider();
        return new DefaultHttpContext { RequestServices = services };
    }

    private sealed class FakeAuthenticationService(int userId) : IAuthenticationService
    {
        public Task<AuthenticateResult> AuthenticateAsync(
            HttpContext context,
            string? scheme)
        {
            var identity = new ClaimsIdentity(
                [new Claim("sub", userId.ToString())],
                Motorcycle.Api.Controllers.UserAuthenticationController.SchemeName);
            var ticket = new AuthenticationTicket(
                new ClaimsPrincipal(identity),
                Motorcycle.Api.Controllers.UserAuthenticationController.SchemeName);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }

        public Task ChallengeAsync(
            HttpContext context,
            string? scheme,
            AuthenticationProperties? properties) =>
            Task.CompletedTask;

        public Task ForbidAsync(
            HttpContext context,
            string? scheme,
            AuthenticationProperties? properties) =>
            Task.CompletedTask;

        public Task SignInAsync(
            HttpContext context,
            string? scheme,
            ClaimsPrincipal principal,
            AuthenticationProperties? properties) =>
            Task.CompletedTask;

        public Task SignOutAsync(
            HttpContext context,
            string? scheme,
            AuthenticationProperties? properties) =>
            Task.CompletedTask;
    }

    private sealed class FakeAdminRoleRepository : IAdminRoleRepository
    {
        public bool Allowed { get; set; }
        public int PermissionChecks { get; private set; }

        public Task<List<AdminRole>> GetAllAsync(CancellationToken ct = default) =>
            Task.FromResult(new List<AdminRole>());

        public Task<AdminRole?> GetByIdAsync(
            int id,
            CancellationToken ct = default) =>
            Task.FromResult<AdminRole?>(null);

        public Task<AdminRole?> GetByFacebookUserIdAsync(
            string facebookUserId,
            CancellationToken ct = default) =>
            Task.FromResult<AdminRole?>(null);

        public Task<bool> IsActiveAdministratorUserAsync(
            int userId,
            CancellationToken ct = default) =>
            Task.FromResult(false);

        public Task<bool> CanViewTestDataAsync(
            int userId,
            CancellationToken ct = default)
        {
            PermissionChecks++;
            return Task.FromResult(Allowed);
        }

        public Task AddAsync(AdminRole role, CancellationToken ct = default) =>
            Task.CompletedTask;

        public void Remove(AdminRole role)
        {
        }

        public Task SaveChangesAsync(CancellationToken ct = default) =>
            Task.CompletedTask;
    }
}
