using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;
using Motorcycle.Infrastructure.Repositories;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Infrastructure.Storage;
using Motorcycle.Infrastructure.Auth;
using Motorcycle.Infrastructure.Images;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Motorcycle.Api.Authorization;
using Motorcycle.Api.Common;
using Motorcycle.Api.Bootstrap;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Structured logging to the console, which the App Service log stream captures.
builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// Add DbContext. Supply ConnectionStrings:DefaultConnection through user secrets or managed configuration.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddDbContext<MotorcycleDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// Repositories
builder.Services.AddScoped<IDatabaseConnectionTester, DatabaseConnectionTester>();
builder.Services.AddScoped<IBikeRepository, BikeRepository>();
builder.Services.AddScoped<IBikeComparisonRepository, BikeComparisonRepository>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ISpecGroupRepository, SpecGroupRepository>();
builder.Services.AddScoped<IAdminRoleRepository, AdminRoleRepository>();
builder.Services.AddScoped<IBrandAdminRepository, BrandAdminRepository>();
builder.Services.AddScoped<ICategoryAdminRepository, CategoryAdminRepository>();
builder.Services.AddScoped<IBikeModelRepository, BikeModelRepository>();
builder.Services.AddScoped<IBikeAdminRepository, BikeAdminRepository>();
builder.Services.AddScoped<IBikeImageAdminRepository, BikeImageAdminRepository>();
builder.Services.AddScoped<IImageStorage, AzureBlobImageStorage>();
builder.Services.AddScoped<IImageProcessor, MagickImageProcessor>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISpecGroupAdminRepository, SpecGroupAdminRepository>();
builder.Services.AddScoped<ISpecDefinitionAdminRepository, SpecDefinitionAdminRepository>();

// Spec filter strategies (Strategy pattern)
builder.Services.AddSingleton<ISpecFilterStrategy, NumberRangeFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, ExactMatchFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, MultiSelectFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, BooleanFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategyFactory, SpecFilterStrategyFactory>();

// Application services
builder.Services.AddScoped<IBikeService, BikeService>();
builder.Services.AddScoped<ILookupService, LookupService>();
builder.Services.AddScoped<IAdminRoleService, AdminRoleService>();
builder.Services.AddScoped<IBrandAdminService, BrandAdminService>();
builder.Services.AddScoped<ICategoryAdminService, CategoryAdminService>();
builder.Services.AddScoped<IBikeModelService, BikeModelService>();
builder.Services.AddScoped<IBikeAdminService, BikeAdminService>();
builder.Services.AddScoped<IBikeImportService, BikeImportService>();
builder.Services.AddScoped<IBikeImageAdminService, BikeImageAdminService>();
builder.Services.AddScoped<IUserAuthService, UserAuthService>();
builder.Services.AddScoped<ISpecGroupAdminService, SpecGroupAdminService>();
builder.Services.AddScoped<ISpecDefinitionAdminService, SpecDefinitionAdminService>();

// External sign-in providers (Strategy pattern): add another AddHttpClient<>/AddScoped pair here
// to introduce Google (or any provider) without touching the auth controller or account-linking logic.
builder.Services.AddHttpClient<IExternalAuthProvider, FacebookExternalAuthProvider>();
builder.Services.AddScoped<IExternalAuthProviderFactory, ExternalAuthProviderFactory>();

var adminAuth = builder.Configuration.GetSection(AdminAuthOptions.SectionName).Get<AdminAuthOptions>() ?? new();
builder.Services.Configure<AdminAuthOptions>(builder.Configuration.GetSection(AdminAuthOptions.SectionName));
builder.Services.Configure<UserAuthOptions>(builder.Configuration.GetSection(UserAuthOptions.SectionName));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "mc_admin_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddCookie(Motorcycle.Api.Controllers.UserAuthenticationController.SchemeName, options =>
    {
        options.Cookie.Name = "mc_user_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ActiveAdministrator", policy =>
        policy.RequireAuthenticatedUser().AddRequirements(new ActiveAdminRequirement()));
    options.AddPolicy("AuthenticatedUser", policy =>
        policy.AddAuthenticationSchemes(Motorcycle.Api.Controllers.UserAuthenticationController.SchemeName).RequireAuthenticatedUser());
});
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, ActiveAdminHandler>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "Motorcycle API",
        Version = "v1",
        Description = "Public catalog endpoints are anonymous. /api/admin endpoints require the API-managed administrator session cookie."
    });
});

const string CorsPolicy = "WebFrontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["https://localhost:3000", "http://localhost:3001", "https://localhost:3001"];
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddApiRateLimiting(builder.Configuration);
var rateLimitingEnabled = builder.Configuration.GetValue<bool?>("RateLimiting:Enabled") ?? true;

var app = builder.Build();

if (AdminBootstrapCommand.IsRequested(args)) {
    using var commandScope = app.Services.CreateScope();
    await AdminBootstrapCommand.RunAsync(commandScope.ServiceProvider, args);
    return;
}

if (DbSeedCommand.IsRequested(args)) {
    using var commandScope = app.Services.CreateScope();
    await DbSeedCommand.RunAsync(commandScope.ServiceProvider, args);
    return;
}

if (BikeImageVariantBackfillCommand.IsRequested(args)) {
    using var commandScope = app.Services.CreateScope();
    await BikeImageVariantBackfillCommand.RunAsync(commandScope.ServiceProvider);
    return;
}

// Apply schema migrations on every startup, independently of the startup-seeding setting.
// Database:MigrateOnStartup retains its existing name but now controls only development seeding.
// The development seed runs once against an empty bikes table; production catalog data is managed
// through the admin API. Run `dotnet run -- db seed [--force]` to seed on demand in any environment.
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
    app.Logger.LogInformation("Applying database migrations.");
    await db.Database.MigrateAsync();

    var seedOnStartup = app.Configuration.GetValue<bool?>("Database:MigrateOnStartup") ?? app.Environment.IsDevelopment();
    if (seedOnStartup && app.Environment.IsDevelopment() && !await db.Bikes.AnyAsync()) {
        await DatabaseSeeder.SeedAsync(db);
        await MotorcycleDataSeeder.SeedAsync(db);
    } else if (seedOnStartup && !app.Environment.IsDevelopment()) {
        app.Logger.LogInformation("Skipping startup seeding because it is only enabled in Development.");
    } else if (!seedOnStartup) {
        app.Logger.LogInformation("Skipping startup seeding (Database:MigrateOnStartup is disabled).");
    }
}

// Unhandled exceptions become RFC 7807 problem responses without leaking details.
app.UseExceptionHandler();
app.UseSerilogRequestLogging();

// Swagger UI at /swagger. On in Development; enable elsewhere with the app setting Swagger__Enabled=true.
var swaggerEnabled = app.Configuration.GetValue<bool?>("Swagger:Enabled") ?? app.Environment.IsDevelopment();
if (swaggerEnabled) {
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Motorcycle API v1");
    });
}

app.UseCors(CorsPolicy);
if (rateLimitingEnabled) {
    app.UseRateLimiter();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// The root opens Swagger UI when it is enabled; otherwise it is a plain status response.
if (swaggerEnabled) {
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
} else {
    app.MapGet("/", () => "Motorcycle API - Running").ExcludeFromDescription();
}
app.MapGet("/health", () => Results.Ok("Healthy"));
app.MapGet("/health/ready", async (MotorcycleDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok("Ready")
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable));

app.Run();
