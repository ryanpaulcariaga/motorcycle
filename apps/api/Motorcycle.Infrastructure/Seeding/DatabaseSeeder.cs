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

        // Seed spec definitions
        if (!context.SpecDefinitions.Any())
        {
            var engineGroup = context.SpecGroups.First(sg => sg.Code == "engine");
            var bodyGroup = context.SpecGroups.First(sg => sg.Code == "body");
            var performanceGroup = context.SpecGroups.First(sg => sg.Code == "performance");

            var specDefinitions = new[]
            {
                // Engine specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "cc", Label = "Displacement", DataType = "number", Unit = "cc", SortOrder = 1, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "horsepower", Label = "Horsepower", DataType = "number", Unit = "hp", SortOrder = 2, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "torque", Label = "Torque", DataType = "number", Unit = "Nm", SortOrder = 3, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = engineGroup.Id, Code = "engine_type", Label = "Engine Type", DataType = "text", SortOrder = 4, IsFilterable = true, FilterType = "exact" },

                // Body specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "weight", Label = "Dry Weight", DataType = "number", Unit = "kg", SortOrder = 1, IsFilterable = true, FilterType = "range" },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "seat_height", Label = "Seat Height", DataType = "number", Unit = "mm", SortOrder = 2, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = bodyGroup.Id, Code = "fuel_capacity", Label = "Fuel Capacity", DataType = "number", Unit = "L", SortOrder = 3, IsFilterable = false, FilterType = null },

                // Performance specs
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "top_speed", Label = "Top Speed", DataType = "number", Unit = "km/h", SortOrder = 1, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "acceleration_0_100", Label = "0-100 km/h", DataType = "number", Unit = "sec", SortOrder = 2, IsFilterable = false, FilterType = null },
                new SpecDefinition { Id = Guid.NewGuid(), GroupId = performanceGroup.Id, Code = "fuel_efficiency", Label = "Fuel Efficiency", DataType = "number", Unit = "L/100km", SortOrder = 3, IsFilterable = false, FilterType = null },
            };

            context.SpecDefinitions.AddRange(specDefinitions);
            await context.SaveChangesAsync();
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
