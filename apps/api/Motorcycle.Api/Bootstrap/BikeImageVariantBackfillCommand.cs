using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Api.Bootstrap;

public static class BikeImageVariantBackfillCommand
{
    public static bool IsRequested(string[] args) =>
        args.Length == 2 &&
        string.Equals(args[0], "images", StringComparison.OrdinalIgnoreCase) &&
        string.Equals(args[1], "backfill-variants", StringComparison.OrdinalIgnoreCase);

    public static async Task RunAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<MotorcycleDbContext>();
        await db.Database.MigrateAsync(ct);

        var result = await services.GetRequiredService<IBikeImageAdminService>().BackfillVariantsAsync(ct);
        Console.WriteLine($"Processed {result.ProcessedImages} images; {result.LowResolutionImages} are below the minimum upload size and need replacement.");
    }
}
