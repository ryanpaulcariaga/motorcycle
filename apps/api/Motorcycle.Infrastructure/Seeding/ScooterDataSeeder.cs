using System.Text.Json;
using System.Text.RegularExpressions;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Seeding;

/// <summary>Seeds real-world scooter listings scraped into Seeding/Data/scooters.jsonl (one JSON object per line).</summary>
public static class ScooterDataSeeder
{
    // Raw JSON key -> our spec_definitions code. Numeric codes get their leading number extracted.
    private static readonly Dictionary<string, string> FieldMap = new()
    {
        ["Transmission"] = "transmission",
        ["Frame"] = "frame",
        ["Frame Type"] = "frame_type",
        ["Transmission Type"] = "transmission_type",
        ["Ignition Type"] = "ignition_type",
        ["Bore x Stroke (mm)"] = "bore_stroke",
        ["Engine Type"] = "engine_type",
        ["Seat Height"] = "seat_height",
        ["Brake System (Front / Rear)"] = "brake_system",
        ["Displacement (cc)"] = "cc",
        ["Wheels Type"] = "wheels_type",
        ["Starting System"] = "starting_system",
        ["Maximum Horse Power"] = "max_power_raw",
        ["Max Output (kW)"] = "max_power_raw",
        ["Maximum Torque"] = "torque_raw",
        ["Compression Ratio"] = "compression_ratio",
        ["Rear Suspension"] = "rear_suspension",
        ["Front Suspension"] = "front_suspension",
        ["Wheelbase"] = "wheelbase",
        ["Dry Weight (without oil & Fuel)"] = "dry_weight",
        ["Wet Weight (with oil & fuel)"] = "wet_weight",
        ["Front Tire"] = "front_tire",
        ["Rear Tire"] = "rear_tire",
        ["Overall Dimensions (length x width x height)"] = "overall_dimensions",
        ["Minimum Ground Clearance"] = "ground_clearance",
        ["Fuel System"] = "fuel_system",
        ["Carburator Type"] = "fuel_system",
        ["Combination Brake System"] = "combi_brake",
        ["Instruments"] = "instruments",
        ["Cylinder Arrangement"] = "cylinder_arrangement",
        ["Headlight"] = "headlight",
        ["Taillight"] = "taillight",
        ["Clutch Type"] = "clutch_type",
        ["Lubrication System"] = "lubrication_system",
        ["Engine Oil Capacity (L)"] = "engine_oil_capacity",
        ["Primary/Secondary Reduction Ratio"] = "reduction_ratio",
        ["Fuel Capacity (L)"] = "fuel_capacity",
        ["Fuel Capacity"] = "fuel_capacity",
    };

    private static readonly HashSet<string> NumericCodes = new()
    {
        "cc", "seat_height", "wheelbase", "dry_weight", "wet_weight", "ground_clearance", "engine_oil_capacity", "fuel_capacity",
    };

    // Keys handled separately, not through FieldMap.
    private static readonly HashSet<string> IgnoredKeys = new() { "Make", "Model", "Category", "Fuel" };

    public static async Task SeedAsync(MotorcycleDbContext context)
    {
        var dataPath = Path.Combine(AppContext.BaseDirectory, "Seeding", "Data", "scooters.jsonl");
        if (!File.Exists(dataPath))
        {
            return;
        }

        var scooterCategory = context.Categories.FirstOrDefault(c => c.Name == "Scooter");
        if (scooterCategory is null)
        {
            return;
        }

        var brandsByName = context.Brands.ToDictionary(b => b.Name, StringComparer.OrdinalIgnoreCase);
        var existingSlugs = context.Bikes.Select(b => b.Slug).ToHashSet();

        var newBikes = new List<Bike>();

        foreach (var line in File.ReadLines(dataPath))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            using var doc = JsonDocument.Parse(line);
            var root = doc.RootElement;

            var make = root.GetProperty("Make").GetString() ?? string.Empty;
            var model = root.GetProperty("Model").GetString() ?? string.Empty;
            if (!brandsByName.TryGetValue(make, out var brand))
            {
                continue; // unknown brand, skip rather than guess
            }

            var slug = MakeUniqueSlug($"{make} {model}", existingSlugs);

            var specs = new Dictionary<string, object>();
            foreach (var prop in root.EnumerateObject())
            {
                if (IgnoredKeys.Contains(prop.Name) || !FieldMap.TryGetValue(prop.Name, out var code))
                {
                    continue;
                }

                if (specs.ContainsKey(code))
                {
                    continue; // first mapped occurrence wins
                }

                var value = prop.Value.GetString() ?? string.Empty;
                if (NumericCodes.Contains(code))
                {
                    var match = Regex.Match(value, @"[\d,]+(\.\d+)?");
                    if (!match.Success)
                    {
                        continue;
                    }
                    value = match.Value.Replace(",", string.Empty);
                }

                specs[code] = value;
            }

            newBikes.Add(new Bike
            {
                BrandId = brand.Id,
                CategoryId = scooterCategory.Id,
                ModelName = model,
                Year = 2024, // not present in source data; placeholder until confirmed per model
                MsrpPrice = null,
                Slug = slug,
                IsPublished = true,
                Specs = specs,
            });
        }

        if (newBikes.Count > 0)
        {
            context.Bikes.AddRange(newBikes);
            await context.SaveChangesAsync();
        }
    }

    private static string MakeUniqueSlug(string source, HashSet<string> existingSlugs)
    {
        var baseSlug = Regex.Replace(source.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        var slug = baseSlug;
        var suffix = 2;
        while (!existingSlugs.Add(slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }
}
