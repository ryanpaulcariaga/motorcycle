using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=motorcycle_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<MotorcycleDbContext>(options =>
    options.UseNpgsql(connectionString)
);

var app = builder.Build();

// Apply migrations and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
    await db.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(db);
}

app.MapGet("/", () => "Motorcycle API - Running");
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();
