using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;

namespace Motorcycle.Api.Tests;

public class BikeSpecVerificationTests
{
    private static BikeAdminService AdminService(MotorcycleDbContext db) =>
        new(new BikeAdminRepository(db), new BikeModelRepository(db), new SpecGroupRepository(db));

    private static BikeImportService ImportService(MotorcycleDbContext db) =>
        new(new BikeAdminRepository(db), new BikeModelRepository(db), new SpecGroupRepository(db));

    private static async Task<DbContextOptions<MotorcycleDbContext>> SeedAsync()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        var model = new BikeModel
        {
            Id = 1,
            Name = "Model",
            Brand = new Brand { Id = 1, Name = "Brand" },
            Category = new Category { Id = 1, Name = "Road" }
        };
        db.Bikes.AddRange(
            new Bike { Id = 1, Model = model, VariantName = "One", Year = 2024, Slug = "one", Specs = new() { ["engine"] = 399, ["abs"] = true } },
            new Bike { Id = 2, Model = model, VariantName = "Two", Year = 2024, Slug = "two", Specs = new() { ["engine"] = 399, ["abs"] = true } });
        db.SpecGroups.Add(new SpecGroup
        {
            Id = 1,
            Code = "specs",
            Name = "Specs",
            Definitions =
            [
                new SpecDefinition { Id = 1, Code = "engine", Label = "Engine", DataType = "number" },
                new SpecDefinition { Id = 2, Code = "abs", Label = "ABS", DataType = "boolean" }
            ]
        });
        await db.SaveChangesAsync();
        return options;
    }

    [Fact]
    public async Task GridVerificationsPersistIndependentlyAndInvalidateOnlyChangedValues()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            await AdminService(db).UpdateSpecGridAsync(new(null, null,
            [
                new(1, "engine", true, "https://brand.example/bike-one"),
                new(2, "abs", true, null)
            ]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            var rows = await service.GetSpecGridAsync(null, null, null, null);
            Assert.Equal("https://brand.example/bike-one", rows.Single(r => r.Id == 1).SpecVerifications!["engine"].SourceUrl);
            Assert.False(rows.Single(r => r.Id == 1).SpecVerifications!.ContainsKey("abs"));
            Assert.True(rows.Single(r => r.Id == 2).SpecVerifications!.ContainsKey("abs"));
            Assert.False(rows.Single(r => r.Id == 2).SpecVerifications!.ContainsKey("engine"));

            await service.UpdateSingleSpecAsync(new("engine", [new(1, JsonSerializer.Deserialize<JsonElement>("399.0"))]));
            Assert.True((await service.GetByIdAsync(1)).SpecVerifications.ContainsKey("engine"));
            await service.UpdateSingleSpecAsync(new("engine", [new(1, 400)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            Assert.Empty((await service.GetByIdAsync(1)).SpecVerifications);
            Assert.True((await service.GetByIdAsync(2)).SpecVerifications.ContainsKey("abs"));
        }
    }

    [Fact]
    public async Task EditAndGridSupportReconfirmationAndIdentityInvalidation()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await service.UpdateAsync(1, new("One", 2024, null, new() { ["engine"] = 399, ["abs"] = true }, null,
            [new("engine", true, null), new("abs", true, null)]));
        await service.UpdateSpecGridAsync(new([new(1, "engine", 400)], null,
            [new(1, "engine", true, "https://brand.example/updated")]));
        var detail = await service.GetByIdAsync(1);
        Assert.Equal(2, detail.SpecVerifications.Count);
        Assert.Equal("https://brand.example/updated", detail.SpecVerifications["engine"].SourceUrl);

        await service.UpdateSpecGridAsync(new(null, [new(1, "One", 2025, null)]));
        Assert.Empty((await service.GetByIdAsync(1)).SpecVerifications);
    }

    [Fact]
    public async Task InvalidConfirmationsRejectEntireBatch()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateSpecGridAsync(new(
            [new(1, "engine", 400)], null,
            [new(2, "abs", true, "javascript:alert(1)") ])));
        Assert.Equal("399", (await service.GetByIdAsync(1)).Specs["engine"]!.ToString());
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateSpecGridAsync(new(
            [new(1, "abs", null)], null, [new(1, "abs", true, null)])));
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateSpecGridAsync(new(null, null,
            [new(1, "engine", true, null), new(1, "engine", false, null)])));
        Assert.Empty(await db.BikeSpecVerifications.ToListAsync());
    }

    [Fact]
    public async Task ImportPersistsEditsAndInvalidatesOnlyAffectedConfirmations()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            await AdminService(db).UpdateSpecGridAsync(new(null, null,
                [new(1, "engine", true, null), new(1, "abs", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var request = new BikeImportRequest(["engine", "abs"],
                [new BikeImportRow(2, 1, "Brand", "Model", "One", 2024, null, new() { ["engine"] = 400, ["abs"] = true })]);
            var result = await ImportService(db).ImportAsync(request);
            Assert.Equal(1, result.Updated);
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var detail = await AdminService(db).GetByIdAsync(1);
            Assert.Equal("400", detail.Specs["engine"]!.ToString());
            Assert.False(detail.SpecVerifications.ContainsKey("engine"));
            Assert.True(detail.SpecVerifications.ContainsKey("abs"));
        }
    }

    [Fact]
    public async Task ModelAndBrandIdentityChangesClearAssociatedConfirmations()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            await AdminService(db).UpdateSpecGridAsync(new(null, null,
                [new(1, "engine", true, null), new(2, "abs", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = new BikeModelService(new BikeModelRepository(db));
            await service.UpdateAsync(1, new UpdateBikeModelRequest(1, 1, "Renamed Model"));
            Assert.Empty(await db.BikeSpecVerifications.ToListAsync());
            await AdminService(db).UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = new BrandAdminService(new BrandAdminRepository(db));
            await service.UpdateAsync(1, new BrandRequest("Renamed Brand", null));
            Assert.Empty(await db.BikeSpecVerifications.ToListAsync());
        }
    }

    [Fact]
    public async Task ModelReassignmentClearsAllConfirmations()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        db.BikeModels.Add(new BikeModel { Id = 2, BrandId = 1, CategoryId = 1, Name = "Other" });
        await db.SaveChangesAsync();
        var service = AdminService(db);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null), new(1, "abs", true, null)]));
        await service.ReassignModelAsync(1, new(2));
        Assert.Empty((await service.GetByIdAsync(1)).SpecVerifications);
    }

    [Fact]
    public async Task SpecLabelChangeClearsOnlyThatDefinitionsConfirmations()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        await AdminService(db).UpdateSpecGridAsync(new(null, null,
            [new(1, "engine", true, null), new(1, "abs", true, null)]));
        var service = new SpecDefinitionAdminService(
            new SpecDefinitionAdminRepository(db), new SpecFilterStrategyFactory([]));
        await service.UpdateAsync(1, new UpdateSpecDefinitionRequest(1, "engine", "Engine capacity", "number", null, false, null));
        var detail = await AdminService(db).GetByIdAsync(1);
        Assert.False(detail.SpecVerifications.ContainsKey("engine"));
        Assert.True(detail.SpecVerifications.ContainsKey("abs"));
    }

    [Fact]
    public async Task ResetGridConfirmationsAffectsOnlyRequestedBikesAndKeepsReviewedFlag()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            await service.SetReviewedAsync(1, true);
            await service.UpdateSpecGridAsync(new(null, null,
                [new(1, "engine", true, null), new(1, "abs", true, null), new(2, "engine", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            Assert.Equal(1, await AdminService(db).UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1])));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            var first = await service.GetByIdAsync(1);
            var second = await service.GetByIdAsync(2);
            Assert.Empty(first.SpecVerifications);
            Assert.True(first.IsReviewed);
            Assert.Equal("399", first.Specs["engine"]!.ToString());
            Assert.Single(second.SpecVerifications);
            Assert.Equal(1, await service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1])));
        }
    }

    [Fact]
    public async Task ResetGridConfirmationsValidatesAllBikesBeforeAnyChanges()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null), new(2, "abs", true, null)]));
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1, 999])));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1, 1])));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [0])));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateSpecGridAsync(new(null, null, [new(1, "abs", true, null)], [1])));
        Assert.Single((await service.GetByIdAsync(1)).SpecVerifications);
        Assert.Single((await service.GetByIdAsync(2)).SpecVerifications);
        Assert.Equal(2, await service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1, 2])));
        Assert.Empty((await service.GetByIdAsync(1)).SpecVerifications);
        Assert.Empty((await service.GetByIdAsync(2)).SpecVerifications);
    }
}
