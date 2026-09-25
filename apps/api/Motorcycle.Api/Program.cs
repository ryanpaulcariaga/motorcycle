using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;
using Motorcycle.Infrastructure.Repositories;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Infrastructure.Storage;
using Motorcycle.Infrastructure.Auth;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Motorcycle.Api.Authorization;
using Motorcycle.Api.Common;
using Motorcycle.Api.Bootstrap;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext. Supply ConnectionStrings:DefaultConnection through user secrets or managed configuration.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddDbContext<MotorcycleDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// Repositories
builder.Services.AddScoped<IBikeRepository, BikeRepository>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ISpecGroupRepository, SpecGroupRepository>();
builder.Services.AddScoped<IAdminRoleRepository, AdminRoleRepository>();
builder.Services.AddScoped<IBikeModelRepository, BikeModelRepository>();
builder.Services.AddScoped<IBikeAdminRepository, BikeAdminRepository>();
builder.Services.AddScoped<IBikeImageAdminRepository, BikeImageAdminRepository>();
builder.Services.AddScoped<IImageStorage, AzureBlobImageStorage>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

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
builder.Services.AddScoped<IBikeModelService, BikeModelService>();
builder.Services.AddScoped<IBikeAdminService, BikeAdminService>();
builder.Services.AddScoped<IBikeImageAdminService, BikeImageAdminService>();
builder.Services.AddScoped<IUserAuthService, UserAuthService>();

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
        options.SlidingExpiration = false;
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

var app = builder.Build();

if (AdminBootstrapCommand.IsRequested(args))
{
    using var commandScope = app.Services.CreateScope();
    await AdminBootstrapCommand.RunAsync(commandScope.ServiceProvider, args);
    return;
}

if (DbSeedCommand.IsRequested(args))
{
    using var commandScope = app.Services.CreateScope();
    await DbSeedCommand.RunAsync(commandScope.ServiceProvider, args);
    return;
}

// Apply migrations on startup (safe in all environments - EF tracks applied migrations).
// Dev-only auto-seed runs once against an empty bikes table (e.g. a fresh local or Azure DB) so it
// never silently re-mutates a database that already has real/seeded data on every restart.
// Run `dotnet run -- db seed [--force]` to seed on demand in any environment.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
    await db.Database.MigrateAsync();

    if (app.Environment.IsDevelopment() && !await db.Bikes.AnyAsync())
    {
        await DatabaseSeeder.SeedAsync(db);
        await MotorcycleDataSeeder.SeedAsync(db);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => "Motorcycle API - Running");
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();
