using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;
using Npgsql;

namespace Motorcycle.Api.Tests;

public sealed class InterestPostgresFactAttribute : FactAttribute
{
    public InterestPostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("MOTORCYCLE_INTEREST_TEST_DB")))
        {
            Skip = "Set MOTORCYCLE_INTEREST_TEST_DB to the dedicated local interest test database.";
        }
    }
}

public class UserInterestPostgresTests
{
    [InterestPostgresFact]
    public async Task ConsentCatalogValidationRetentionAndConcurrentWithdrawal()
    {
        var connection = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("MOTORCYCLE_INTEREST_TEST_DB"));
        Assert.Equal("127.0.0.1", connection.Host);
        Assert.Equal(55439, connection.Port);
        Assert.Equal("motorcycle_interest_test", connection.Database);
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>().UseNpgsql(connection.ConnectionString).Options;
        var clock = new FixedClock();
        await using var db = new MotorcycleDbContext(options);
        await db.Database.MigrateAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var user = new User();
        var other = new User();
        var brand = new Brand { Name = $"brand-{suffix}" };
        var category = new Category { Name = $"category-{suffix}" };
        var model = new BikeModel { Name = $"model-{suffix}", Brand = brand, Category = category };
        var bike = new Bike { VariantName = "first", Slug = $"first-{suffix}", Model = model, IsPublished = true };
        var second = new Bike { VariantName = "second", Slug = $"second-{suffix}", Model = model, IsPublished = true };
        var hidden = new Bike { VariantName = "hidden", Slug = $"hidden-{suffix}", Model = model };
        db.AddRange(user, other, bike, second, hidden);
        await db.SaveChangesAsync();
        var repository = new UserInterestRepository(db, clock);
        var view = new UserInterestEventRequest { Type = "bike_view", Id = bike.Id };
        Assert.False(await repository.GetPreferenceAsync(user.Id, default));
        Assert.Equal(UserInterestRecordResult.NotEnabled, await repository.RecordAsync(user.Id, view, default));
        Assert.True(await repository.SetPreferenceAsync(user.Id, true, default));
        Assert.Equal(UserInterestRecordResult.Invalid, await repository.RecordAsync(user.Id, new() { Type = "bike_view", Id = hidden.Id }, default));
        Assert.Equal(UserInterestRecordResult.Invalid, await repository.RecordAsync(user.Id, new() { Type = "brand_filter", Id = int.MaxValue }, default));
        Assert.Equal(UserInterestRecordResult.Recorded, await repository.RecordAsync(user.Id, view, default));
        Assert.Equal(UserInterestRecordResult.Recorded, await repository.RecordAsync(user.Id, view, default));
        Assert.Equal(UserInterestRecordResult.Recorded, await repository.RecordAsync(user.Id, new() { Type = "comparison", BikeIds = [bike.Id, second.Id] }, default));
        Assert.True(await repository.SetPreferenceAsync(other.Id, true, default));
        Assert.Equal(UserInterestRecordResult.Recorded, await repository.RecordAsync(other.Id, view, default));
        Assert.Equal(2, await db.UserInterestDailyCounts.Where(x => x.UserId == user.Id && x.Metric == "bike_view").Select(x => x.Count).SingleAsync());
        Assert.Equal(2, await db.UserInterestDailyCounts.CountAsync(x => x.UserId == user.Id && x.Metric == "comparison"));
        db.UserInterestDailyCounts.Add(new UserInterestDailyCount { UserId = user.Id, Day = new DateOnly(2025, 11, 14), Metric = "bike_view", CatalogId = bike.Id, Count = 1 });
        db.UserInterestDailyCounts.Add(new UserInterestDailyCount { UserId = user.Id, Day = new DateOnly(2025, 11, 15), Metric = "bike_view", CatalogId = bike.Id, Count = 1 });
        await db.SaveChangesAsync();
        await repository.DeleteBeforeAsync(new DateOnly(2025, 11, 15), default);
        Assert.False(await db.UserInterestDailyCounts.AnyAsync(x => x.UserId == user.Id && x.Day == new DateOnly(2025, 11, 14)));
        Assert.True(await db.UserInterestDailyCounts.AnyAsync(x => x.UserId == user.Id && x.Day == new DateOnly(2025, 11, 15)));

        await using var lockDb = new MotorcycleDbContext(options);
        await using var transaction = await lockDb.Database.BeginTransactionAsync();
        await lockDb.Users.FromSqlInterpolated($"SELECT * FROM users WHERE id = {user.Id} FOR UPDATE").SingleAsync();
        await using var eventDb = new MotorcycleDbContext(options);
        await using var withdrawalDb = new MotorcycleDbContext(options);
        var record = new UserInterestRepository(eventDb, clock).RecordAsync(user.Id, view, default);
        var withdraw = new UserInterestRepository(withdrawalDb, clock).SetPreferenceAsync(user.Id, false, default);
        await Task.Delay(200);
        Assert.False(record.IsCompleted);
        Assert.False(withdraw.IsCompleted);
        await transaction.CommitAsync();
        await Task.WhenAll(record, withdraw);
        Assert.True(await withdraw);
        Assert.False(await repository.GetPreferenceAsync(user.Id, default));
        Assert.False(await db.UserInterestDailyCounts.AnyAsync(x => x.UserId == user.Id));
        Assert.True(await db.UserInterestDailyCounts.AnyAsync(x => x.UserId == other.Id));
        Assert.Equal(UserInterestRecordResult.NotEnabled, await repository.RecordAsync(user.Id, view, default));
        Assert.True(await repository.GetPreferenceAsync(other.Id, default));
        await db.Users.Where(x => x.Id == other.Id).ExecuteUpdateAsync(setters => setters.SetProperty(x => x.IsActive, false));
        Assert.Null(await repository.GetPreferenceAsync(other.Id, default));
        Assert.Equal(UserInterestRecordResult.InactiveUser, await repository.RecordAsync(other.Id, view, default));
        Assert.False(await repository.SetPreferenceAsync(other.Id, true, default));
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 15, 0, 0, 0, TimeSpan.Zero);
    }
}
