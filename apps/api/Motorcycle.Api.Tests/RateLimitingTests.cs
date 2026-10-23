using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Motorcycle.Api.Common;

namespace Motorcycle.Api.Tests;

public sealed class RateLimitingTests
{
    [Fact]
    public async Task NamedPolicy_ReturnsTooManyRequestsAfterLimit_AndHealthIsExempt()
    {
        await using var app = await StartAsync(new Dictionary<string, string?>
        {
            ["RateLimiting:AuthPerMinute"] = "2",
            ["RateLimiting:GeneralPerMinute"] = "3",
        });
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/auth")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/auth")).StatusCode);
        var limited = await client.GetAsync("/auth");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.True(limited.Headers.Contains("Retry-After"));
        for (var i = 0; i < 10; i++) {
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        }
    }

    [Fact]
    public async Task GeneralLimit_AppliesToEndpointsWithoutNamedPolicy()
    {
        await using var app = await StartAsync(new Dictionary<string, string?> { ["RateLimiting:GeneralPerMinute"] = "2" });
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/public")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/public")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/public")).StatusCode);
    }

    private static async Task<WebApplication> StartAsync(Dictionary<string, string?> settings)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Configuration.AddInMemoryCollection(settings);
        builder.Services.AddApiRateLimiting(builder.Configuration);

        var app = builder.Build();
        app.UseRateLimiter();
        app.MapGet("/auth", () => "ok").RequireRateLimiting(RateLimitPolicies.Auth);
        app.MapGet("/public", () => "ok");
        app.MapGet("/health", () => "ok");
        await app.StartAsync();
        return app;
    }
}
