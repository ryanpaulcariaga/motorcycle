using Microsoft.EntityFrameworkCore;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Seeding;

namespace Motorcycle.Api.Bootstrap;

/// <summary>On-demand seeding via `dotnet run -- db seed [--force]`, independent of ASPNETCORE_ENVIRONMENT.</summary>
public static class DbSeedCommand
{
    public static bool IsRequested(string[] args) =>
        args.Length > 1 && string.Equals(args[0], "db", StringComparison.OrdinalIgnoreCase)
        && string.Equals(args[1], "seed", StringComparison.OrdinalIgnoreCase);

    public static async Task<int> RunAsync(IServiceProvider services, string[] args, CancellationToken ct = default)
    {
        var force = args.Skip(2).Any(a => string.Equals(a, "--force", StringComparison.OrdinalIgnoreCase));

        var db = services.GetRequiredService<MotorcycleDbContext>();
        await db.Database.MigrateAsync(ct);

        if (!force && await db.Bikes.AnyAsync(ct))
        {
            Console.WriteLine("Bikes table already has data; skipping seed. Pass --force to seed/backfill anyway.");
            return 0;
        }

        await DatabaseSeeder.SeedAsync(db);
        await MotorcycleDataSeeder.SeedAsync(db);
        Console.WriteLine("Seed data applied.");
        return 0;
    }
}
