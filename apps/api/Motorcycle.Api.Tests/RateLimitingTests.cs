using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
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

    [Fact]
    public async Task ForwardedClientAddress_PartitionsGeneralRateLimits()
    {
        await using var app = await StartAsync(new Dictionary<string, string?>
        {
            ["RateLimiting:GeneralPerMinute"] = "2",
        }, enableForwardedHeaders: true);
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        Assert.Equal(HttpStatusCode.OK, await GetWithForwardedForAsync(client, "192.0.2.10"));
        Assert.Equal(HttpStatusCode.OK, await GetWithForwardedForAsync(client, "192.0.2.10"));
        Assert.Equal(HttpStatusCode.TooManyRequests, await GetWithForwardedForAsync(client, "192.0.2.10"));
        Assert.Equal(HttpStatusCode.OK, await GetWithForwardedForAsync(client, "198.51.100.20"));
    }

    private static async Task<HttpStatusCode> GetWithForwardedForAsync(HttpClient client, string address)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/public");
        request.Headers.Add("X-Forwarded-For", address);
        using var response = await client.SendAsync(request);
        return response.StatusCode;
    }

    private static async Task<WebApplication> StartAsync(
        Dictionary<string, string?> settings,
        bool enableForwardedHeaders = false)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Configuration.AddInMemoryCollection(settings);
        builder.Services.AddApiRateLimiting(builder.Configuration);
        if (enableForwardedHeaders) {
            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
                options.ForwardLimit = 1;
                options.KnownIPNetworks.Clear();
                options.KnownProxies.Clear();
            });
        }

        var app = builder.Build();
        if (enableForwardedHeaders) {
            app.UseForwardedHeaders();
        }

        app.UseRateLimiter();
        app.MapGet("/auth", () => "ok").RequireRateLimiting(RateLimitPolicies.Auth);
        app.MapGet("/public", () => "ok");
        app.MapGet("/health", () => "ok");
        await app.StartAsync();
        return app;
    }
}
