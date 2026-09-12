using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Seeding;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(MotorcycleDbContext context)
    {
        // Seed brands
        if (!context.Brands.Any())
        {
            var brands = new[]
            {
                new Brand { Id = Guid.NewGuid(), Name = "Kawasaki", CreatedAt = DateTime.UtcNow },
                new Brand { Id = Guid.NewGuid(), Name = "Honda", CreatedAt = DateTime.UtcNow },
                new Brand { Id = Guid.NewGuid(), Name = "Yamaha", CreatedAt = DateTime.UtcNow },
                new Brand { Id = Guid.NewGuid(), Name = "Harley-Davidson", CreatedAt = DateTime.UtcNow },
                new Brand { Id = Guid.NewGuid(), Name = "Ducati", CreatedAt = DateTime.UtcNow },
            };
            context.Brands.AddRange(brands);
            await context.SaveChangesAsync();
        }

        // Seed categories
        if (!context.Categories.Any())
        {
            var categories = new[]
            {
                new Category { Id = Guid.NewGuid(), Name = "Sport" },
                new Category { Id = Guid.NewGuid(), Name = "Cruiser" },
                new Category { Id = Guid.NewGuid(), Name = "Adventure" },
                new Category { Id = Guid.NewGuid(), Name = "Scooter" },
                new Category { Id = Guid.NewGuid(), Name = "Touring" },
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        // Seed spec groups
        if (!context.SpecGroups.Any())
        {
            var specGroups = new[]
            {
                new SpecGroup { Id = Guid.NewGuid(), Code = "engine", Name = "Engine", SortOrder = 1, IconName = "engine" },
                new SpecGroup { Id = Guid.NewGuid(), Code = "body", Name = "Body", SortOrder = 2, IconName = "bike" },
                new SpecGroup { Id = Guid.NewGuid(), Code = "performance", Name = "Performance", SortOrder = 3, IconName = "speedometer" },
                new SpecGroup { Id = Guid.NewGuid(), Code = "features", Name = "Features", SortOrder = 4, IconName = "star" },
            };
            context.SpecGroups.AddRange(specGroups);
            await context.SaveChangesAsync();
        }

        // Seed spec definitions (additive: only inserts codes that don't already exist, so re-running
        // after new codes are introduced backfills them without duplicating existing rows)
        {
            var engineGroup = context.SpecGroups.First(sg => sg.Code == "engine");
            var bodyGroup = context.SpecGroups.First(sg => sg.Code == "body");
            var performanceGroup = context.SpecGroups.First(sg => sg.Code == "performance");
            var featuresGroup = context.SpecGroups.First(sg => sg.Code == "features");

            var specDefinitions = new[]
            {
                // Engine specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "cc", Label = "Displacement", DataType = "number", Unit = "cc", SortOrder = 1, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "horsepower", Label = "Horsepower", DataType = "number", Unit = "hp", SortOrder = 2, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "torque", Label = "Torque", DataType = "number", Unit = "Nm", SortOrder = 3, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "engine_type", Label = "Engine Type", DataType = "text", SortOrder = 4, IsFilterable = true, FilterType = "exact" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "transmission", Label = "Transmission", DataType = "text", SortOrder = 5, IsFilterable = true, FilterType = "exact" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "transmission_type", Label = "Transmission Type", DataType = "text", SortOrder = 6, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "ignition_type", Label = "Ignition Type", DataType = "text", SortOrder = 7, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "bore_stroke", Label = "Bore x Stroke", DataType = "text", Unit = "mm", SortOrder = 8, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "starting_system", Label = "Starting System", DataType = "text", SortOrder = 9, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "compression_ratio", Label = "Compression Ratio", DataType = "text", SortOrder = 10, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "cylinder_arrangement", Label = "Cylinder Arrangement", DataType = "text", SortOrder = 11, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "fuel_system", Label = "Fuel System", DataType = "text", SortOrder = 12, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "engine_oil_capacity", Label = "Engine Oil Capacity", DataType = "number", Unit = "L", SortOrder = 13, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "max_power_raw", Label = "Max Power (manufacturer spec)", DataType = "text", SortOrder = 14, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "torque_raw", Label = "Max Torque (manufacturer spec)", DataType = "text", SortOrder = 15, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "clutch_type", Label = "Clutch Type", DataType = "text", SortOrder = 16, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "lubrication_system", Label = "Lubrication System", DataType = "text", SortOrder = 17, IsFilterable = false, FilterType = null },

                // Body specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "weight", Label = "Dry Weight", DataType = "number", Unit = "kg", SortOrder = 1, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "seat_height", Label = "Seat Height", DataType = "number", Unit = "mm", SortOrder = 2, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "fuel_capacity", Label = "Fuel Capacity", DataType = "number", Unit = "L", SortOrder = 3, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "frame", Label = "Frame", DataType = "text", SortOrder = 4, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "frame_type", Label = "Frame Type", DataType = "text", SortOrder = 5, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "wheels_type", Label = "Wheel Type", DataType = "text", SortOrder = 6, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "front_suspension", Label = "Front Suspension", DataType = "text", SortOrder = 7, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "rear_suspension", Label = "Rear Suspension", DataType = "text", SortOrder = 8, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "front_tire", Label = "Front Tire", DataType = "text", SortOrder = 9, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "rear_tire", Label = "Rear Tire", DataType = "text", SortOrder = 10, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "brake_system", Label = "Brake System (Front / Rear)", DataType = "text", SortOrder = 11, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "combi_brake", Label = "Combined Braking System", DataType = "text", SortOrder = 12, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "overall_dimensions", Label = "Overall Dimensions (L x W x H)", DataType = "text", SortOrder = 13, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "ground_clearance", Label = "Minimum Ground Clearance", DataType = "number", Unit = "mm", SortOrder = 14, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "dry_weight", Label = "Dry Weight", DataType = "number", Unit = "kg", SortOrder = 15, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "wet_weight", Label = "Wet Weight", DataType = "number", Unit = "kg", SortOrder = 16, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "wheelbase", Label = "Wheelbase", DataType = "number", Unit = "mm", SortOrder = 17, IsFilterable = false, FilterType = null },

                // Performance specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "top_speed", Label = "Top Speed", DataType = "number", Unit = "km/h", SortOrder = 1, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "acceleration_0_100", Label = "0-100 km/h", DataType = "number", Unit = "sec", SortOrder = 2, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "fuel_efficiency", Label = "Fuel Efficiency", DataType = "number", Unit = "L/100km", SortOrder = 3, IsFilterable = false, FilterType = null },

                // Feature specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = featuresGroup.Id, Code = "instruments", Label = "Instruments", DataType = "text", SortOrder = 1, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = featuresGroup.Id, Code = "headlight", Label = "Headlight", DataType = "text", SortOrder = 2, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = featuresGroup.Id, Code = "taillight", Label = "Taillight", DataType = "text", SortOrder = 3, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = featuresGroup.Id, Code = "reduction_ratio", Label = "Primary/Secondary Reduction Ratio", DataType = "text", SortOrder = 4, IsFilterable = false, FilterType = null },
            };

            var existingCodes = context.SpecDefinitions.Select(d => d.GroupId + "|" + d.Code).ToHashSet();
            var missing = specDefinitions.Where(d => !existingCodes.Contains(d.GroupId + "|" + d.Code)).ToList();
            if (missing.Count > 0)
            {
                context.SpecDefinitions.AddRange(missing);
                await context.SaveChangesAsync();
            }
        }

        // Seed bikes
        if (!context.Bikes.Any())
        {
            var kawasakiBrand = context.Brands.First(b => b.Name == "Kawasaki");
            var hondaBrand = context.Brands.First(b => b.Name == "Honda");
            var yamahabrand = context.Brands.First(b => b.Name == "Yamaha");

            var sportCategory = context.Categories.First(c => c.Name == "Sport");
            var cruiserCategory = context.Categories.First(c => c.Name == "Cruiser");
            var advCategory = context.Categories.First(c => c.Name == "Adventure");

            var bikes = new[]
            {
                new Bike
                {
                    Id = Guid.NewGuid(),
                    BrandId = kawasakiBrand.Id,
                    CategoryId = sportCategory.Id,
                    ModelName = "Ninja 400",
                    Year = 2024,
                    MsrpPrice = 4699,
                    Slug = "kawasaki-ninja-400-2024",
                    IsPublished = true,
                    Specs = new Dictionary<string, object>
                    {
                        { "cc", "399" },
                        { "horsepower", "45" },
                        { "torque", "38" },
                        { "engine_type", "Parallel Twin" },
                        { "weight", "168" },
                        { "seat_height", "795" },
                        { "fuel_capacity", "15" },
                        { "top_speed", "185" },
                        { "fuel_efficiency", "4.2" }
                    }
                },
                new Bike
                {
                    Id = Guid.NewGuid(),
                    BrandId = hondaBrand.Id,
                    CategoryId = sportCategory.Id,
                    ModelName = "CB500F",
                    Year = 2024,
                    MsrpPrice = 6699,
                    Slug = "honda-cb500f-2024",
                    IsPublished = true,
                    Specs = new Dictionary<string, object>
                    {
                        { "cc", "471" },
                        { "horsepower", "67" },
                        { "torque", "43" },
                        { "engine_type", "Parallel Twin" },
                        { "weight", "189" },
                        { "seat_height", "820" },
                        { "fuel_capacity", "16.1" },
                        { "top_speed", "220" },
                        { "fuel_efficiency", "3.9" }
                    }
                },
                new Bike
                {
                    Id = Guid.NewGuid(),
                    BrandId = yamahabrand.Id,
                    CategoryId = cruiserCategory.Id,
                    ModelName = "V-Star 250",
                    Year = 2024,
                    MsrpPrice = 4299,
                    Slug = "yamaha-v-star-250-2024",
                    IsPublished = true,
                    Specs = new Dictionary<string, object>
                    {
                        { "cc", "249" },
                        { "horsepower", "16" },
                        { "torque", "20" },
                        { "engine_type", "V-Twin" },
                        { "weight", "152" },
                        { "seat_height", "680" },
                        { "fuel_capacity", "9.1" },
                        { "top_speed", "140" },
                        { "fuel_efficiency", "3.5" }
                    }
                },
                new Bike
                {
                    Id = Guid.NewGuid(),
                    BrandId = kawasakiBrand.Id,
                    CategoryId = advCategory.Id,
                    ModelName = "Versys 1000",
                    Year = 2024,
                    MsrpPrice = 12699,
                    Slug = "kawasaki-versys-1000-2024",
                    IsPublished = true,
                    Specs = new Dictionary<string, object>
                    {
                        { "cc", "1043" },
                        { "horsepower", "142" },
                        { "torque", "111" },
                        { "engine_type", "Parallel Twin" },
                        { "weight", "238" },
                        { "seat_height", "840" },
                        { "fuel_capacity", "19" },
                        { "top_speed", "240" },
                        { "fuel_efficiency", "5.2" }
                    }
                },
            };

            context.Bikes.AddRange(bikes);
            await context.SaveChangesAsync();

            // Seed bike images
            foreach (var bike in bikes)
            {
                var bikeImages = new[]
                {
                    new BikeImage { Id = Guid.NewGuid(), BikeId = bike.Id, BlobUrl = $"https://placeholder.com/600x400?text={bike.ModelName}", SortOrder = 1, IsPrimary = true },
                    new BikeImage { Id = Guid.NewGuid(), BikeId = bike.Id, BlobUrl = $"https://placeholder.com/600x400?text={bike.ModelName}+Side", SortOrder = 2, IsPrimary = false },
                };
                context.BikeImages.AddRange(bikeImages);
            }

            await context.SaveChangesAsync();
        }
    }
}
