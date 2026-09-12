using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;
using Motorcycle.Infrastructure.Repositories;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Microsoft.EntityFrameworkCore;

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

// Spec filter strategies (Strategy pattern)
builder.Services.AddSingleton<ISpecFilterStrategy, NumberRangeFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, ExactMatchFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, MultiSelectFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategy, BooleanFilterStrategy>();
builder.Services.AddSingleton<ISpecFilterStrategyFactory, SpecFilterStrategyFactory>();

// Application services
builder.Services.AddScoped<IBikeService, BikeService>();
builder.Services.AddScoped<ILookupService, LookupService>();

builder.Services.AddMemoryCache();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string CorsPolicy = "WebFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Apply migrations and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
    await db.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(db);
    await ScooterDataSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.MapControllers();

app.MapGet("/", () => "Motorcycle API - Running");
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();
