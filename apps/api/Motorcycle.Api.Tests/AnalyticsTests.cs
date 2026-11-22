using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Motorcycle.Api.Controllers;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;

namespace Motorcycle.Api.Tests;

public class AnalyticsTests
{
    [Theory]
    [InlineData("bike_view")]
    [InlineData("brand_filter")]
    [InlineData("category_filter")]
    public async Task ValidCatalogEvent_IsForwarded(string type)
    {
        var repository = new FakeRepository();
        var service = new AnalyticsService(repository, TimeProvider.System);
        var request = new AnalyticsEventRequest { Type = type, Id = 5 };
        Assert.True(await service.RecordAsync(request, default));
        Assert.Same(request, repository.Recorded);
    }

    [Fact]
    public async Task ValidSearchAndComparison_AreForwarded()
    {
        var repository = new FakeRepository();
        var service = new AnalyticsService(repository, TimeProvider.System);
        Assert.True(await service.RecordAsync(new AnalyticsEventRequest { Type = "search", ZeroResults = true }, default));
        Assert.True(await service.RecordAsync(new AnalyticsEventRequest { Type = "comparison", BikeIds = [3, 1, 2] }, default));
    }

    [Fact]
    public async Task InvalidEvents_AreNotRecorded()
    {
        var repository = new FakeRepository();
        var service = new AnalyticsService(repository, TimeProvider.System);
        var invalid = new[]
        {
            new AnalyticsEventRequest { Type = "unknown" },
            new AnalyticsEventRequest { Type = "bike_view", Id = 0 },
            new AnalyticsEventRequest { Type = "bike_view", Id = 1, ZeroResults = false },
            new AnalyticsEventRequest { Type = "search" },
            new AnalyticsEventRequest { Type = "search", ZeroResults = true, Id = 1 },
            new AnalyticsEventRequest { Type = "comparison", BikeIds = [1] },
            new AnalyticsEventRequest { Type = "comparison", BikeIds = [1, 1] },
            new AnalyticsEventRequest { Type = "comparison", BikeIds = [1, -2] },
            new AnalyticsEventRequest { Type = "comparison", BikeIds = Enumerable.Range(1, 26).ToArray() }
        };
        foreach (var request in invalid)
        {
            Assert.False(await service.RecordAsync(request, default));
        }
        Assert.Null(repository.Recorded);
    }

    [Fact]
    public async Task Retention_UsesTwelveCalendarMonthsInUtc()
    {
        var repository = new FakeRepository();
        var service = new AnalyticsService(repository, new FixedClock(new DateTimeOffset(2026, 11, 15, 0, 0, 0, TimeSpan.Zero)));
        await service.DeleteExpiredAsync(default);
        Assert.Equal(new DateOnly(2025, 11, 15), repository.Cutoff);
    }

    [Fact]
    public void Dashboard_RequiresActiveAdministrator()
    {
        var authorize = typeof(AdminAnalyticsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.Equal("ActiveAdministrator", authorize?.Policy);
    }

    [Fact]
    public async Task Dashboard_RejectsInvalidOrOutOfRetentionDates()
    {
        var repository = new FakeRepository();
        var clock = new FixedClock(new DateTimeOffset(2026, 11, 15, 0, 0, 0, TimeSpan.Zero));
        var controller = new AdminAnalyticsController(new AnalyticsService(repository, clock), clock);
        var old = await controller.Get(new DateOnly(2025, 11, 14), new DateOnly(2026, 11, 15), default);
        var reversed = await controller.Get(new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 14), default);
        var future = await controller.Get(new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 16), default);
        var minimum = await controller.Get(null, DateOnly.MinValue, default);
        Assert.IsType<BadRequestObjectResult>(old.Result);
        Assert.IsType<BadRequestObjectResult>(reversed.Result);
        Assert.IsType<BadRequestObjectResult>(future.Result);
        Assert.IsType<BadRequestObjectResult>(minimum.Result);
    }

    [Fact]
    public async Task Dashboard_AggregatesDatesAndPairs_AndLabelsDeletedCatalogItems()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        db.Bikes.Add(new Bike { Id = 1, VariantName = "Bike one", Slug = "bike-one" });
        db.Brands.Add(new Brand { Id = 2, Name = "Brand two" });
        db.AnalyticsDailyCounts.AddRange(
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 14), Metric = "bike_view", Dimension1 = 1, Count = 2 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "bike_view", Dimension1 = 1, Count = 3 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "brand_filter", Dimension1 = 2, Count = 4 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "search", Count = 5 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "zero_results", Count = 2 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "comparison", Count = 3 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 15), Metric = "comparison_pair", Dimension1 = 1, Dimension2 = 9, Count = 3 });
        await db.SaveChangesAsync();
        var repository = new AnalyticsRepository(db, TimeProvider.System);
        var result = await repository.GetDashboardAsync(new DateOnly(2026, 11, 14), new DateOnly(2026, 11, 15), default);
        Assert.Equal(5, result.BikeViews);
        Assert.Equal(3, result.Comparisons);
        Assert.Equal(5, result.Searches);
        Assert.Equal(2, result.ZeroResults);
        Assert.Equal(2, result.Daily.Count);
        Assert.Equal(new AnalyticsCountResponse(1, "Bike one", 5), Assert.Single(result.Bikes));
        Assert.Equal(new AnalyticsCountResponse(2, "Brand two", 4), Assert.Single(result.Brands));
        Assert.Equal(new AnalyticsPairResponse(1, "Bike one", 9, "Deleted #9", 3), Assert.Single(result.Pairs));
    }

    [Fact]
    public async Task Repository_RejectsUnknownAndUnpublishedCatalogIds()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        db.Bikes.Add(new Bike { Id = 1, VariantName = "Unpublished", Slug = "unpublished", IsPublished = false });
        await db.SaveChangesAsync();
        var repository = new AnalyticsRepository(db, TimeProvider.System);
        Assert.False(await repository.RecordAsync(new AnalyticsEventRequest { Type = "bike_view", Id = 1 }, default));
        Assert.False(await repository.RecordAsync(new AnalyticsEventRequest { Type = "brand_filter", Id = 1 }, default));
        Assert.False(await repository.RecordAsync(new AnalyticsEventRequest { Type = "category_filter", Id = 1 }, default));
        Assert.False(await repository.RecordAsync(new AnalyticsEventRequest { Type = "comparison", BikeIds = [1, 2] }, default));
    }

    [Fact]
    public async Task BikeRepository_RanksTodayViewsAndExcludesUnpublishedBikes()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        var brand = new Brand { Id = 1, Name = "Brand" };
        var category = new Category { Id = 1, Name = "Category" };
        var model = new BikeModel
        {
            Id = 1,
            Name = "Model",
            BrandId = brand.Id,
            Brand = brand,
            CategoryId = category.Id,
            Category = category
        };
        db.Bikes.AddRange(
            new Bike { Id = 1, ModelId = model.Id, Model = model, VariantName = "First", Slug = "first", IsPublished = true },
            new Bike { Id = 2, ModelId = model.Id, Model = model, VariantName = "Second", Slug = "second", IsPublished = true },
            new Bike { Id = 3, ModelId = model.Id, Model = model, VariantName = "Hidden", Slug = "hidden" });
        db.AnalyticsDailyCounts.AddRange(
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 21), Metric = "bike_view", Dimension1 = 1, Count = 100 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 22), Metric = "bike_view", Dimension1 = 1, Count = 4 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 22), Metric = "bike_view", Dimension1 = 2, Count = 4 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 22), Metric = "bike_view", Dimension1 = 3, Count = 50 },
            new AnalyticsDailyCount { Day = new DateOnly(2026, 11, 22), Metric = "comparison", Dimension1 = 1, Count = 50 });
        await db.SaveChangesAsync();

        var result = await new BikeRepository(db).GetTopByDailyInterestAsync(
            new DateOnly(2026, 11, 22),
            10,
            default);

        Assert.Equal([1, 2], result.Select(row => row.Bike.Id));
        Assert.All(result, row => Assert.Equal(4, row.ViewCount));
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeRepository : IAnalyticsRepository
    {
        public AnalyticsEventRequest? Recorded { get; private set; }
        public DateOnly? Cutoff { get; private set; }
        public Task<bool> RecordAsync(AnalyticsEventRequest request, CancellationToken ct)
        {
            Recorded = request;
            return Task.FromResult(true);
        }
        public Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct)
        {
            Cutoff = cutoff;
            return Task.CompletedTask;
        }
        public Task<AnalyticsDashboardResponse> GetDashboardAsync(DateOnly from, DateOnly to, CancellationToken ct) =>
            throw new NotImplementedException();
    }
}
