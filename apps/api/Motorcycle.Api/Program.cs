using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;
using Motorcycle.Infrastructure.Repositories;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Motorcycle.Api.Authorization;
using Motorcycle.Api.Common;
using Motorcycle.Api.Bootstrap;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=motorcycle_db;Username=postgres;Password=Marione831";

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

var adminAuth = builder.Configuration.GetSection(AdminAuthOptions.SectionName).Get<AdminAuthOptions>() ?? new();
builder.Services.Configure<AdminAuthOptions>(builder.Configuration.GetSection(AdminAuthOptions.SectionName));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            RequireSignedTokens = true,
            ValidateIssuer = !string.IsNullOrWhiteSpace(adminAuth.Issuer),
            ValidIssuer = adminAuth.Issuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(adminAuth.Audience),
            ValidAudience = adminAuth.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        if (!string.IsNullOrWhiteSpace(adminAuth.RsaPublicKeyPem))
        {
            var rsa = RSA.Create();
            rsa.ImportFromPem(adminAuth.RsaPublicKeyPem.Replace("\\n", Environment.NewLine));
            options.TokenValidationParameters.IssuerSigningKey = new RsaSecurityKey(rsa);
        }
    });
builder.Services.AddAuthorization(options =>
    options.AddPolicy("ActiveAdministrator", policy =>
        policy.RequireAuthenticatedUser().AddRequirements(new ActiveAdminRequirement())));
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, ActiveAdminHandler>();

builder.Services.AddMemoryCache();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string CorsPolicy = "WebFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "https://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (AdminBootstrapCommand.IsRequested(args))
{
    using var commandScope = app.Services.CreateScope();
    await AdminBootstrapCommand.RunAsync(commandScope.ServiceProvider, args);
    return;
}

// Apply migrations on startup (safe in all environments - EF tracks applied migrations).
// Demo/scraped sample data is dev-only; real content in staging/prod is seeded via manual SQL, not app code.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
    await db.Database.MigrateAsync();

    if (app.Environment.IsDevelopment())
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
