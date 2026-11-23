using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Filtering;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;

namespace Motorcycle.Api.Tests;

public class BikeSpecVerificationTests
{
    [Fact]
    public void ReviewStatusMigrationReplacesBothFlagsAndPreservesValuesInBothDirections()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseNpgsql("Host=localhost;Database=migration_test").Options;
        using var db = new MotorcycleDbContext(options);
        var bike = db.Model.FindEntityType(typeof(Bike))!;
        Assert.NotNull(bike.FindProperty(nameof(Bike.ReviewStatus)));
        Assert.Null(bike.FindProperty("IsReviewed"));
        Assert.Null(bike.FindProperty("IsInReview"));

        var migrator = db.GetService<IMigrator>();
        var up = migrator.GenerateScript("20261121152418_AddBikeInReview", "20261121153257_ReplaceBikeReviewFlagsWithStatus");
        Assert.Contains("WHEN is_reviewed THEN 'reviewed'", up);
        Assert.Contains("WHEN is_in_review THEN 'inReview'", up);
        Assert.Contains("DROP COLUMN is_reviewed", up);
        Assert.Contains("DROP COLUMN is_in_review", up);
        Assert.True(up.IndexOf("UPDATE bikes", StringComparison.Ordinal) < up.IndexOf("DROP COLUMN is_reviewed", StringComparison.Ordinal));
        Assert.Contains("ck_bikes_review_status", up);
        var down = migrator.GenerateScript("20261121153257_ReplaceBikeReviewFlagsWithStatus", "20261121152418_AddBikeInReview");
        Assert.Contains("ADD is_reviewed", down);
        Assert.Contains("DROP COLUMN review_status", down);
        Assert.True(down.IndexOf("ADD is_reviewed", StringComparison.Ordinal) < down.IndexOf("UPDATE bikes", StringComparison.Ordinal));
        Assert.True(down.IndexOf("UPDATE bikes", StringComparison.Ordinal) < down.IndexOf("DROP COLUMN review_status", StringComparison.Ordinal));
    }

    [Fact]
    public void ReviewStatusMigrationRenamesStatesAndAddsCompletionTimestamp()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseNpgsql("Host=localhost;Database=migration_test").Options;
        using var db = new MotorcycleDbContext(options);
        var bike = db.Model.FindEntityType(typeof(Bike))!;
        Assert.NotNull(bike.FindProperty(nameof(Bike.ReviewCompletedAt)));

        var migrator = db.GetService<IMigrator>();
        var up = migrator.GenerateScript("20261122184542_AddBikeDiscussionCommentReplies", "20261123075056_RenameBikeReviewStatusesAndAddCompletedAt");
        Assert.Contains("WHEN 'notReviewed' THEN 'draft'", up);
        Assert.Contains("WHEN 'inReview' THEN 'inProgress'", up);
        Assert.Contains("WHEN 'reviewed' THEN 'completed'", up);
        Assert.Contains("review_completed_at", up);
        Assert.True(up.IndexOf("UPDATE bikes", StringComparison.Ordinal) < up.IndexOf("ADD CONSTRAINT ck_bikes_review_status", StringComparison.Ordinal));

        var down = migrator.GenerateScript("20261123075056_RenameBikeReviewStatusesAndAddCompletedAt", "20261122184542_AddBikeDiscussionCommentReplies");
        Assert.Contains("WHEN 'draft' THEN 'notReviewed'", down);
        Assert.Contains("WHEN 'inProgress' THEN 'inReview'", down);
        Assert.Contains("WHEN 'completed' THEN 'reviewed'", down);
        Assert.True(down.IndexOf("UPDATE bikes", StringComparison.Ordinal) < down.IndexOf("ADD CONSTRAINT ck_bikes_review_status", StringComparison.Ordinal));
    }

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
    public async Task ReviewStatusPersistsFiltersGridAndExportAndCompletesFromVerifications()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            await AdminService(db).UpdateSpecGridAsync(new(null, ReviewStatusChanges: [new(1, "inProgress"), new(2, "inProgress")]));
            await AdminService(db).UpdateSpecGridAsync(new(null, VerificationChanges: [new(1, "engine", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            Assert.All(await service.GetAllAsync(null), row => Assert.Equal("inProgress", row.ReviewStatus));
            Assert.Equal(2, (await service.GetSpecGridAsync(null, null, null, null, reviewStatus: "inProgress")).Count);
            Assert.Equal(2, (await ImportService(db).GetExportAsync(null, null, null, null, reviewStatus: "inProgress")).Rows.Count);
            await service.UpdateSpecGridAsync(new(null, VerificationChanges: [new(1, "abs", true, null)]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            var completed = await service.GetByIdAsync(1);
            Assert.Equal("completed", completed.ReviewStatus);
            Assert.NotNull(completed.ReviewCompletedAt);
            Assert.Equal(2, Assert.Single(await service.GetSpecGridAsync(null, null, null, null, reviewStatus: "inProgress")).Id);
            await service.UpdateSingleSpecAsync(new("engine", [new(1, 400)]));
            var reset = await service.GetByIdAsync(1);
            Assert.Equal("draft", reset.ReviewStatus);
            Assert.Null(reset.ReviewCompletedAt);
        }
    }

    [Fact]
    public async Task ReviewStatusChangesValidateAtomicallyAndSupportResetAndManualOverride()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateSpecGridAsync(new(
            [new(1, "engine", 400)], ReviewStatusChanges: [new(2, "invalid")])));
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateSpecGridAsync(new(
            null, ReviewStatusChanges: [new(1, "inProgress"), new(1, "completed")])));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.UpdateSpecGridAsync(new(
            null, ReviewStatusChanges: [new(999, "inProgress")])));
        Assert.Equal("399", (await service.GetByIdAsync(1)).Specs["engine"]!.ToString());

        await service.UpdateSpecGridAsync(new(null, ReviewStatusChanges: [new(1, "completed")]));
        var completed = await service.GetByIdAsync(1);
        Assert.True(completed.IsReviewed);
        Assert.NotNull(completed.ReviewCompletedAt);
        await service.SetReviewedAsync(1, false);
        Assert.Equal("draft", (await service.GetByIdAsync(1)).ReviewStatus);
        await service.UpdateSpecGridAsync(new(null, ReviewStatusChanges: [new(1, "inProgress")]));
        await service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1]));
        Assert.Equal("draft", (await service.GetByIdAsync(1)).ReviewStatus);
        await Assert.ThrowsAsync<ArgumentException>(() => service.GetSpecGridAsync(null, null, null, null, reviewStatus: "invalid"));
        await Assert.ThrowsAsync<ArgumentException>(() => ImportService(db).GetExportAsync(null, null, null, null, reviewStatus: "invalid"));
    }

    [Fact]
    public async Task StartingReviewAndVerifyingAllSpecsInSameBatchFinishesReview()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await service.UpdateSpecGridAsync(new(null,
            VerificationChanges: [new(1, "engine", true, null), new(1, "abs", true, null)],
            ReviewStatusChanges: [new(1, "inProgress")]));
        Assert.Equal("completed", (await service.GetByIdAsync(1)).ReviewStatus);
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
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
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
            Assert.False(detail.IsReviewed);
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
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
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
        Assert.False(detail.IsReviewed);
    }

    [Fact]
    public async Task ResetGridConfirmationsAffectsOnlyRequestedBikesAndClearsReviewedFlag()
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
            Assert.False(first.IsReviewed);
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
        Assert.Single((await service.GetByIdAsync(1)).SpecVerifications);
        Assert.Single((await service.GetByIdAsync(2)).SpecVerifications);
        Assert.Equal(2, await service.UpdateSpecGridAsync(new(null, ResetVerificationBikeIds: [1, 2])));
        Assert.Empty((await service.GetByIdAsync(1)).SpecVerifications);
        Assert.Empty((await service.GetByIdAsync(2)).SpecVerifications);
    }

    [Fact]
    public async Task ReviewedTracksPopulatedConfirmationsAndPreservesManualOverridesOnNoOp()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var service = AdminService(db);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null)]));
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "abs", true, null)]));
        Assert.True((await service.GetByIdAsync(1)).IsReviewed);
        await service.SetReviewedAsync(1, false);
        await service.UpdateSingleSpecAsync(new("engine", [new(1, 399)]));
        await service.UpdateAsync(1, new("One", 2024, 100, new() { ["engine"] = 399, ["abs"] = true }, null,
            [new("engine", true, null), new("abs", true, null)]));
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSingleSpecAsync(new("engine", [new(1, 400)]));
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null)]));
        Assert.True((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSpecGridAsync(new([new(1, "engine", null)]));
        Assert.True((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSpecGridAsync(new([new(1, "abs", null)]));
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
    }

    [Fact]
    public async Task NewDefinitionResetsReviewedWithoutDeletingConfirmations()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        var bikes = AdminService(db);
        await bikes.UpdateSpecGridAsync(new(null, null,
            [new(1, "engine", true, null), new(1, "abs", true, null)]));
        await bikes.SetReviewedAsync(2, true);
        var definitions = new SpecDefinitionAdminService(
            new SpecDefinitionAdminRepository(db), new SpecFilterStrategyFactory([]));
        await definitions.CreateAsync(new(1, "weight", "Weight", "number", null, false, null));
        Assert.False((await bikes.GetByIdAsync(1)).IsReviewed);
        Assert.False((await bikes.GetByIdAsync(2)).IsReviewed);
        Assert.Equal(2, (await bikes.GetByIdAsync(1)).SpecVerifications.Count);
        await bikes.UpdateSpecGridAsync(new(null, null, [new(1, "engine", false, null)]));
        await bikes.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null)]));
        Assert.True((await bikes.GetByIdAsync(1)).IsReviewed);
    }

    [Fact]
    public async Task ZeroAndFalseArePopulatedAndBlankSpecsDoNotBlockReview()
    {
        var options = await SeedAsync();
        await using var db = new MotorcycleDbContext(options);
        db.SpecDefinitions.Add(new SpecDefinition { Id = 3, GroupId = 1, Code = "note", Label = "Note", DataType = "text" });
        var bike = await db.Bikes.SingleAsync(b => b.Id == 1);
        bike.Specs = new() { ["engine"] = 0, ["abs"] = false, ["note"] = " " };
        await db.SaveChangesAsync();
        var service = AdminService(db);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "engine", true, null)]));
        Assert.False((await service.GetByIdAsync(1)).IsReviewed);
        await service.UpdateSpecGridAsync(new(null, null, [new(1, "abs", true, null)]));
        Assert.True((await service.GetByIdAsync(1)).IsReviewed);
    }

    [Fact]
    public async Task ResetAndReconfirmTogetherPersistCorrectly()
    {
        var options = await SeedAsync();
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            await service.UpdateSpecGridAsync(new(null, null,
                [new(1, "engine", true, "https://brand.example"), new(1, "abs", true, null)]));
            await service.UpdateSpecGridAsync(new(null, VerificationChanges: [new(1, "engine", true, null)],
                ResetVerificationBikeIds: [1]));
        }
        await using (var db = new MotorcycleDbContext(options)) {
            var service = AdminService(db);
            var detail = await service.GetByIdAsync(1);
            Assert.Single(detail.SpecVerifications);
            Assert.Null(detail.SpecVerifications["engine"].SourceUrl);
            Assert.False(detail.IsReviewed);
            await service.SetReviewedAsync(2, true);
            await service.UpdateAsync(2, new("Two", 2024, null, new() { ["engine"] = 399, ["abs"] = true },
                ResetVerifications: true));
            Assert.False((await service.GetByIdAsync(2)).IsReviewed);
        }
    }
}
