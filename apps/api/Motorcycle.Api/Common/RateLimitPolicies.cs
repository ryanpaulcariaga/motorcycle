using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Motorcycle.Api.Common;

public static class RateLimitPolicies
{
    public const string Auth = "auth";
    public const string Upload = "upload";
    public const string Analytics = "analytics";
    public const string Reviews = "reviews";
    public const string Contact = "contact";

    /// <summary>Per-client-IP fixed-window limits: a general limit for every request, plus stricter
    /// named policies for sign-in and upload/import endpoints. Limits are configurable under
    /// <c>RateLimiting</c>; set <c>RateLimiting:Enabled=false</c> to disable.</summary>
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("RateLimiting");
        if (!(section.GetValue<bool?>("Enabled") ?? true)) {
            return services;
        }

        var generalLimit = section.GetValue<int?>("GeneralPerMinute") ?? 300;
        var authLimit = section.GetValue<int?>("AuthPerMinute") ?? 20;
        var uploadLimit = section.GetValue<int?>("UploadPerMinute") ?? 30;
        var analyticsLimit = section.GetValue<int?>("AnalyticsPerMinute") ?? 60;
        var reviewLimit = section.GetValue<int?>("ReviewsPerMinute") ?? 20;
        var contactLimit = section.GetValue<int?>("ContactPerMinute") ?? 5;

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)) {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                return ValueTask.CompletedTask;
            };

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                context.Request.Path.StartsWithSegments("/health")
                    ? RateLimitPartition.GetNoLimiter("health")
                    : RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(generalLimit)));

            options.AddPolicy(Auth, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(authLimit)));
            options.AddPolicy(Upload, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(uploadLimit)));
            options.AddPolicy(Analytics, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(analyticsLimit)));
            options.AddPolicy(Reviews, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(reviewLimit)));
            options.AddPolicy(Contact, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => FixedWindow(contactLimit)));
        });

        return services;
    }

    private static string ClientKey(HttpContext context) => context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static FixedWindowRateLimiterOptions FixedWindow(int permitLimit) => new()
    {
        PermitLimit = permitLimit,
        Window = TimeSpan.FromMinutes(1),
        QueueLimit = 0,
    };
}
