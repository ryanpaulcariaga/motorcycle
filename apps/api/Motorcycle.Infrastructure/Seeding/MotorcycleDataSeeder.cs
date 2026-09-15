using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
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

        var sourceRows = File.ReadLines(dataPath)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line => JsonDocument.Parse(line).RootElement.Clone())
            .Select(root => new
            {
                Root = root,
                Make = root.GetProperty("Make").GetString() ?? string.Empty,
                SourceModel = root.GetProperty("Model").GetString() ?? string.Empty
            })
            .ToList();

        var familyCounts = sourceRows
            .GroupBy(row => $"{row.Make}:{GetFamilyStem(row.Make, row.SourceModel)}", StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Select(row => row.SourceModel).Distinct(StringComparer.OrdinalIgnoreCase).Count(), StringComparer.OrdinalIgnoreCase);

        var brandsByName = context.Brands.ToDictionary(b => b.Name, StringComparer.OrdinalIgnoreCase);
        var categoriesByName = context.Categories.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
        var modelsByKey = context.BikeModels
            .ToDictionary(m => $"{m.BrandId}:{m.Name}", StringComparer.OrdinalIgnoreCase);
        var existingBikes = context.Bikes.Include(b => b.Model).ToList();
        var existingBikesBySlug = existingBikes.ToDictionary(b => b.Slug, StringComparer.OrdinalIgnoreCase);
        var existingSlugs = existingBikes.Select(b => b.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newBikes = new List<Bike>();

        foreach (var sourceRow in sourceRows)
        {
            var root = sourceRow.Root;
            var make = sourceRow.Make;
            var sourceModel = sourceRow.SourceModel;
            if (!brandsByName.TryGetValue(make, out var brand))
            {
                continue; // unknown brand, skip rather than guess
            }

            var familyKey = $"{make}:{GetFamilyStem(make, sourceModel)}";
            var identity = ParseModelIdentity(brand.Name, make, sourceModel, familyCounts[familyKey] > 1);
            var model = identity.ModelName;
            var variant = sourceModel.Trim();
            var year = identity.Year;
            var slug = ToSlug(sourceModel);

            var categoryRaw = root.TryGetProperty("Category", out var catEl) ? catEl.GetString() : null;
            var engineType = root.TryGetProperty("Engine Type", out var engEl) ? engEl.GetString() : null;
            var categoryName = ClassifyCategory(categoryRaw, sourceModel, engineType);
            if (!categoriesByName.TryGetValue(categoryName, out var category))
            {
                continue; // shouldn't happen once categories are seeded, but skip rather than crash
            }

            // Repair rows imported before model/variant normalization, using the original source slug.
            var legacySlugs = new[]
            {
                ToSlug(sourceModel),
                ToSlug($"{make} {sourceModel}"),
                ToSlug($"{make} {model} {variant}"),
                ToSlug($"{make} {StripMake(make, sourceModel)} standard")
            }.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var legacySlug = legacySlugs.FirstOrDefault(existingBikesBySlug.ContainsKey);
            var existingBike = legacySlug is not null ? existingBikesBySlug[legacySlug] : null;

            var modelKey = $"{brand.Id}:{model}";
            BikeModel motorcycleModel;
            if (existingBike is not null)
            {
                if (!modelsByKey.TryGetValue(modelKey, out motorcycleModel!))
                {
                    motorcycleModel = existingBike.Model;
                    motorcycleModel.Name = model;
                    motorcycleModel.BrandId = brand.Id;
                    motorcycleModel.CategoryId = category.Id;
                    modelsByKey[modelKey] = motorcycleModel;
                }
            }
            else if (!modelsByKey.TryGetValue(modelKey, out motorcycleModel!))
            {
                motorcycleModel = new BikeModel
                {
                    BrandId = brand.Id,
                    CategoryId = category.Id,
                    Name = model
                };
                context.BikeModels.Add(motorcycleModel);
                modelsByKey[modelKey] = motorcycleModel;
            }

            if (existingBike is not null)
            {
                existingBike.Model = motorcycleModel;
                existingBike.VariantName = variant;
                existingBike.Year = year ?? 0;
                existingBike.Slug = slug;
                if (legacySlug is not null)
                {
                    existingBikesBySlug.Remove(legacySlug);
                }
                existingBikesBySlug[slug] = existingBike;
                existingSlugs.Add(slug);
                continue;
            }

            if (!existingSlugs.Add(slug))
            {
                continue; // duplicate source row or already normalized row
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
                Model = motorcycleModel,
                VariantName = variant,
                Year = year ?? 0,
                MsrpPrice = null,
                Slug = slug,
                IsPublished = true,
                Specs = specs,
            });
        }

        if (newBikes.Count > 0 || existingBikes.Any(b => b.Model is not null))
        {
            if (newBikes.Count > 0)
            {
                context.Bikes.AddRange(newBikes);
            }
            await context.SaveChangesAsync();
        }
    }

    private static (string ModelName, int? Year) ParseModelIdentity(string brandName, string make, string sourceModel, bool hasFamilyVariants)
    {
        var value = StripMake(make, sourceModel);
        var sourceYear = ExtractYear(value);
        var familyStem = GetFamilyStem(make, sourceModel);

        if (hasFamilyVariants && !string.IsNullOrWhiteSpace(familyStem))
        {
            return ($"{brandName} {familyStem}", sourceYear);
        }

        return ($"{brandName} {value}", sourceYear);
    }

    private static string GetFamilyStem(string make, string sourceModel)
    {
        var value = StripMake(make, sourceModel);
        value = Regex.Replace(value, @"\b(19\d{2}|20\d{2})\b", string.Empty);
        var match = Regex.Match(value.Trim(), @"^[A-Za-z]+(?:[-'][A-Za-z]+)*");
        return match.Success ? match.Value : value.Trim();
    }

    private static string StripMake(string make, string sourceModel)
    {
        return Regex.Replace(sourceModel.Trim(), $"^{Regex.Escape(make)}\\s+", string.Empty, RegexOptions.IgnoreCase);
    }

    private static int? ExtractYear(string value)
    {
        var yearMatch = Regex.Match(value, @"\b(19\d{2}|20\d{2})\b");
        return yearMatch.Success ? int.Parse(yearMatch.Value) : null;
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
