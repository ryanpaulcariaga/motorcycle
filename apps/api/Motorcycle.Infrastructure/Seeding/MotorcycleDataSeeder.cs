using System.Text.Json;
using System.Text.RegularExpressions;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Seeding;

/// <summary>Seeds real-world motorcycle listings scraped into Seeding/Data/motorcycles.jsonl (one JSON object per line).</summary>
public static class MotorcycleDataSeeder
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
        ["Gear Shift Pattern"] = "gear_shift_pattern",
        ["Turning Radius"] = "turning_radius",
        ["Security System"] = "security_system",
        ["Top Speed"] = "top_speed",
    };

    private static readonly HashSet<string> NumericCodes = new()
    {
        "cc", "seat_height", "wheelbase", "dry_weight", "wet_weight", "ground_clearance", "engine_oil_capacity", "fuel_capacity", "top_speed",
    };

    // Keys handled separately, not through FieldMap.
    private static readonly HashSet<string> IgnoredKeys = new() { "Make", "Model", "Category", "Fuel", "Mileage" };

    public static async Task SeedAsync(MotorcycleDbContext context)
    {
        var dataPath = Path.Combine(AppContext.BaseDirectory, "Seeding", "Data", "motorcycles.jsonl");
        if (!File.Exists(dataPath))
        {
            return;
        }

        var brandsByName = context.Brands.ToDictionary(b => b.Name, StringComparer.OrdinalIgnoreCase);
        var categoriesByName = context.Categories.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
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

            var slug = ToSlug($"{make} {model}");
            if (!existingSlugs.Add(slug))
            {
                continue; // already seeded (or a duplicate row in the source file) - skip so reruns stay idempotent
            }

            var categoryRaw = root.TryGetProperty("Category", out var catEl) ? catEl.GetString() : null;
            var engineType = root.TryGetProperty("Engine Type", out var engEl) ? engEl.GetString() : null;
            var categoryName = ClassifyCategory(categoryRaw, model, engineType);
            if (!categoriesByName.TryGetValue(categoryName, out var category))
            {
                continue; // shouldn't happen once categories are seeded, but skip rather than crash
            }

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
                CategoryId = category.Id,
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

    // The source data's own "Category" field is an inconsistent Philippine-market label
    // (e.g. "Pang Sports", "Pang Negosyo", "Automatic", "1"), so classification falls back
    // to keyword matching against the model name / engine description.
    private static string ClassifyCategory(string? categoryRaw, string model, string? engineType)
    {
        var haystack = $"{categoryRaw} {model} {engineType}".ToLowerInvariant();

        if (categoryRaw is "Scooter" or "Automatic" or "AT Bike")
        {
            return "Scooter";
        }

        if (ContainsAny(haystack, "crf", "klx", "kx250", "rm-z", "wr155", "xr150"))
        {
            return "Off-Road";
        }

        if (ContainsAny(haystack, "adv ", "adv160", "adv 160", "adventure", "africa twin", "transalp", "tenere", "tracer", "v-strom", "vstrom", "versys", "x-adv"))
        {
            return "Adventure";
        }

        if (ContainsAny(haystack, "vulcan", "w800"))
        {
            return "Cruiser";
        }

        if (categoryRaw is "Pang Negosyo" or "Pang Araw-Araw" || ContainsAny(haystack, "wave", "xrm", "tmx", "raider", "smash", "barako", "ytx", "dr160"))
        {
            return "Underbone";
        }

        if (ContainsAny(haystack, "click", "beat", "pcx", "nmax", "aerox", "mio", "giorno", "navi", "dio ", " dio", "vision", "address", "skydrive", "burgman", "xmax", "tmax", "agility", "like ", "dink", "xciting", "ak550", "lexi", "fazzio", "gear", "krv", "brusky", "access", "avenis", "ride connect", "pg-1"))
        {
            return "Scooter";
        }

        if (categoryRaw is "Pang Sports" || ContainsAny(haystack, "ninja", "cbr", "gsx", "yzf", "winner", "duke", "rc 200", "rc 390", "rouser", "dominar", "pulsar", "gixxer", "sniper"))
        {
            return "Sport";
        }

        if (ContainsAny(haystack, "mt-", "z650", "z h2", "z1100", "cb650r", "cb500f", "xsr", "sv650", "gsx-8", "gsx-s"))
        {
            return "Naked";
        }

        if (ContainsAny(haystack, "goldwing", "touring"))
        {
            return "Touring";
        }

        return "Sport"; // reasonable default for remaining big-displacement road bikes
    }

    private static bool ContainsAny(string haystack, params string[] needles) => needles.Any(haystack.Contains);

    private static string ToSlug(string source)
    {
        return Regex.Replace(source.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
    }
}
