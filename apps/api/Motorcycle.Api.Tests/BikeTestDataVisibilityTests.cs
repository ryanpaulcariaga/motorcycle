using Microsoft.EntityFrameworkCore;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;

namespace Motorcycle.Api.Tests;

public sealed class BikeTestDataVisibilityTests
{
    [Fact]
    public async Task AdministratorMapping_RequiresActiveRoleForSameFacebookAccount()
    {
        await using var db = CreateContext();
        var user = new User { DisplayName = "Rider" };
        var login = new UserExternalLogin
        {
            User = user,
            Provider = ExternalAuthProviders.Facebook,
            ProviderUserId = "facebook-admin"
        };
        db.UserExternalLogins.Add(login);
        db.AdminRoles.Add(new AdminRole
        {
            FacebookUserId = "facebook-admin",
            Role = AdminRoles.Administrator,
            IsActive = true
        });
        await db.SaveChangesAsync();
        var repository = new AdminRoleRepository(db);

        Assert.True(await repository.IsActiveAdministratorUserAsync(user.Id));

        var role = await db.AdminRoles.SingleAsync();
        role.IsActive = false;
        await db.SaveChangesAsync();

        Assert.False(await repository.IsActiveAdministratorUserAsync(user.Id));
    }

    [Fact]
    public async Task AdministratorMapping_MatchesVerifiedEmailWhenFacebookIdsDiffer()
    {
        await using var db = CreateContext();
        var user = new User
        {
            Email = "admin@example.com",
            EmailVerified = true
        };
        db.UserExternalLogins.Add(new UserExternalLogin
        {
            User = user,
            Provider = ExternalAuthProviders.Facebook,
            ProviderUserId = "public-app-facebook-id"
        });
        db.AdminRoles.Add(new AdminRole
        {
            FacebookUserId = "admin-app-facebook-id",
            EmailSnapshot = "ADMIN@example.com",
            Role = AdminRoles.Administrator,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var repository = new AdminRoleRepository(db);

        Assert.True(await repository.IsActiveAdministratorUserAsync(user.Id));
    }

    [Fact]
    public async Task PublicRepository_ExcludesVariantAndModelTestData()
    {
        await using var db = CreateContext();
        var brand = new Brand { Name = "Brand" };
        var category = new Category { Name = "Category" };
        var publicModel = new BikeModel
        {
            Brand = brand,
            Category = category,
            Name = "Public"
        };
        var testModel = new BikeModel
        {
            Brand = brand,
            Category = category,
            Name = "Test Model",
            IsTestData = true
        };
        db.Bikes.AddRange(
            PublicBike(1, "public", publicModel),
            PublicBike(2, "test-variant", publicModel, isTestData: true),
            PublicBike(3, "test-model", testModel));
        var unpublishedTest = PublicBike(
            4,
            "unpublished-test",
            publicModel,
            isTestData: true);
        unpublishedTest.IsPublished = false;
        db.Bikes.Add(unpublishedTest);
        await db.SaveChangesAsync();
        var repository = new BikeRepository(db);

        var list = await repository.GetPublishedWithStaticFiltersAsync(
            null, null, null, null, null, null, null);
        var byIds = await repository.GetByIdsAsync([1, 2, 3, 4]);
        var adminList = await repository.GetPublishedWithStaticFiltersAsync(
            null, null, null, null, null, null, null, includeTestData: true);

        Assert.Equal(1, Assert.Single(list).Id);
        Assert.Equal(1, Assert.Single(byIds).Id);
        Assert.Equal(4, adminList.Count);
        Assert.NotNull(await repository.GetBySlugAsync("public"));
        Assert.Null(await repository.GetBySlugAsync("test-variant"));
        Assert.Null(await repository.GetBySlugAsync("test-model"));
        Assert.NotNull(await repository.GetBySlugAsync(
            "test-variant",
            includeTestData: true));
        Assert.NotNull(await repository.GetBySlugAsync(
            "test-model",
            includeTestData: true));
        Assert.NotNull(await repository.GetBySlugAsync(
            "unpublished-test",
            includeTestData: true));
    }

    [Fact]
    public async Task ReviewsAndComments_AllowTestBikeOnlyWhenIncluded()
    {
        await using var db = CreateContext();
        var model = new BikeModel
        {
            Brand = new Brand { Name = "Brand" },
            Category = new Category { Name = "Category" },
            Name = "Test"
        };
        var bike = PublicBike(1, "test-bike", model, isTestData: true);
        db.Bikes.Add(bike);
        await db.SaveChangesAsync();
        var reviews = new BikeReviewRepository(db, TimeProvider.System);
        var comments = new BikeCommentRepository(db, TimeProvider.System);

        Assert.Null(await reviews.GetByBikeAsync(bike.Id, default));
        Assert.Null(await comments.GetByBikeAsync(bike.Id, 10, default));
        Assert.NotNull(await reviews.GetByBikeAsync(
            bike.Id,
            default,
            includeTestData: true));
        Assert.NotNull(await comments.GetByBikeAsync(
            bike.Id,
            10,
            default,
            includeTestData: true));
    }

    [Fact]
    public async Task AdministratorMapping_RequiresTestDataPreference()
    {
        await using var db = CreateContext();
        var user = new User { DisplayName = "Administrator" };
        db.Users.Add(user);
        db.AdminRoles.Add(new AdminRole
        {
            FacebookUserId = "facebook-admin",
            Role = AdminRoles.Administrator,
            IsActive = true,
            IncludeTestData = false
        });
        await db.SaveChangesAsync();
        db.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = user.Id,
            Provider = ExternalAuthProviders.Facebook,
            ProviderUserId = "facebook-admin"
        });
        await db.SaveChangesAsync();
        var repository = new AdminRoleRepository(db);
        Assert.False(await repository.CanViewTestDataAsync(user.Id));
        var role = await db.AdminRoles.SingleAsync();
        role.IncludeTestData = true;
        await db.SaveChangesAsync();
        Assert.True(await repository.CanViewTestDataAsync(user.Id));

        role.IsActive = false;
        await db.SaveChangesAsync();
        Assert.False(await repository.CanViewTestDataAsync(user.Id));
    }

    private static MotorcycleDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new MotorcycleDbContext(options);
    }

    private static Bike PublicBike(
        int id,
        string slug,
        BikeModel model,
        bool isTestData = false) => new()
        {
            Id = id,
            Model = model,
            VariantName = slug,
            Slug = slug,
            IsPublished = true,
            IsTestData = isTestData
        };
}
