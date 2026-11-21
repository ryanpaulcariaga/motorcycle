using Microsoft.EntityFrameworkCore;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;
using Npgsql;

namespace Motorcycle.Api.Tests;

public class UserPrivacyPostgresTests
{
    [InterestPostgresFact]
    public async Task ExportContainsOwnedDataAndDeleteCascadesOnlyThatAccount()
    {
        var connection = new NpgsqlConnectionStringBuilder(
            Environment.GetEnvironmentVariable("MOTORCYCLE_INTEREST_TEST_DB"));
        Assert.Equal("127.0.0.1", connection.Host);
        Assert.Equal(55439, connection.Port);
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseNpgsql(connection.ConnectionString)
            .Options;
        await using var db = new MotorcycleDbContext(options);
        await db.Database.MigrateAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var user = new User
        {
            Email = $"privacy-{suffix}@example.test",
            EmailVerified = true,
            DisplayName = "Privacy Rider",
            InterestTrackingEnabled = true,
        };
        var other = new User { DisplayName = "Other Rider" };
        var brand = new Brand { Name = $"privacy-brand-{suffix}" };
        var category = new Category { Name = $"privacy-category-{suffix}" };
        var model = new BikeModel { Name = $"privacy-model-{suffix}", Brand = brand, Category = category };
        var bike = new Bike
        {
            VariantName = "Privacy Bike",
            Slug = $"privacy-bike-{suffix}",
            Model = model,
            IsPublished = true,
        };
        db.AddRange(user, other, bike);
        await db.SaveChangesAsync();
        db.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = user.Id,
            Provider = ExternalAuthProviders.Facebook,
            ProviderUserId = $"provider-{suffix}",
            EmailAtProvider = user.Email,
        });
        db.UserInterestDailyCounts.Add(new UserInterestDailyCount
        {
            UserId = user.Id,
            Day = new DateOnly(2026, 11, 22),
            Metric = "bike_view",
            CatalogId = bike.Id,
            Count = 2,
        });
        db.BikeComments.Add(new BikeComment
        {
            BikeId = bike.Id,
            UserId = user.Id,
            Rating = 4,
            Body = "A review",
        });
        db.BikeDiscussionComments.Add(new BikeDiscussionComment
        {
            BikeId = bike.Id,
            UserId = user.Id,
            Body = "A comment",
        });
        db.BikeComments.Add(new BikeComment
        {
            BikeId = bike.Id,
            UserId = other.Id,
            Rating = 5,
            Body = "Keep this review",
        });
        await db.SaveChangesAsync();
        var repository = new UserPrivacyRepository(db);

        var export = await repository.ExportAsync(user.Id, DateTime.UtcNow, default);

        Assert.NotNull(export);
        Assert.Equal(user.Email, export.Account.Email);
        Assert.Single(export.ExternalLogins);
        Assert.Single(export.InterestActivity);
        Assert.Single(export.Reviews);
        Assert.Single(export.Comments);
        Assert.True(await repository.DeleteAsync(user.Id, default));
        Assert.False(await db.Users.AnyAsync(x => x.Id == user.Id));
        Assert.False(await db.UserExternalLogins.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await db.UserInterestDailyCounts.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await db.BikeComments.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await db.BikeDiscussionComments.AnyAsync(x => x.UserId == user.Id));
        Assert.True(await db.Users.AnyAsync(x => x.Id == other.Id));
        Assert.True(await db.BikeComments.AnyAsync(x => x.UserId == other.Id));
    }
}
