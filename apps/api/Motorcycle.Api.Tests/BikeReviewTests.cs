using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Controllers;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Tests;

public class BikeReviewTests
{
    [Fact]
    public async Task ValidReviewIsTrimmedAndSaved()
    {
        var repository = new FakeRepository();
        var service = new BikeReviewService(repository);

        var result = await service.UpsertAsync(
            7, 11, new UpsertBikeReviewRequest { Rating = 4, Body = "  Comfortable commuter.  " }, default);

        Assert.Equal(BikeReviewWriteResult.Saved, result);
        Assert.Equal(7, repository.BikeId);
        Assert.Equal(11, repository.UserId);
        Assert.Equal(4, repository.Rating);
        Assert.Equal("Comfortable commuter.", repository.Body);
    }

    [Fact]
    public async Task InvalidReviewsDoNotReachRepository()
    {
        var repository = new FakeRepository();
        var service = new BikeReviewService(repository);

        Assert.Equal(BikeReviewWriteResult.Unavailable,
            await service.UpsertAsync(1, 2, new UpsertBikeReviewRequest { Rating = 0 }, default));
        Assert.Equal(BikeReviewWriteResult.Unavailable,
            await service.UpsertAsync(1, 2, new UpsertBikeReviewRequest { Rating = 6 }, default));
        Assert.Equal(BikeReviewWriteResult.Unavailable,
            await service.UpsertAsync(1, 2, new UpsertBikeReviewRequest { Rating = 5, Body = new string('x', 1001) }, default));
        Assert.False(repository.UpsertCalled);
    }

    [Fact]
    public async Task EmptyCommentIsStoredAsNull()
    {
        var repository = new FakeRepository();
        var service = new BikeReviewService(repository);

        await service.UpsertAsync(1, 2, new UpsertBikeReviewRequest { Rating = 5, Body = "   " }, default);

        Assert.Null(repository.Body);
    }

    [Fact]
    public async Task MutationsRequireUserPolicyAndReviewHeader()
    {
        var repository = new FakeRepository();
        var controller = new BikeReviewsController(new BikeReviewService(repository))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "9")], "test")),
                },
            },
        };

        Assert.Equal("AuthenticatedUser",
            typeof(BikeReviewsController).GetMethod(nameof(BikeReviewsController.Upsert))!
                .GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        Assert.IsType<BadRequestObjectResult>(
            await controller.Upsert(1, new UpsertBikeReviewRequest { Rating = 5 }, default));
        Assert.IsType<BadRequestObjectResult>(await controller.Delete(1, default));
        Assert.False(repository.UpsertCalled);

        controller.Request.Headers["X-Review-Request"] = "1";
        Assert.IsType<OkObjectResult>(
            await controller.Upsert(1, new UpsertBikeReviewRequest { Rating = 5 }, default));
        Assert.True(repository.UpsertCalled);
    }

    private sealed class FakeRepository : IBikeReviewRepository
    {
        public bool UpsertCalled { get; private set; }
        public int BikeId { get; private set; }
        public int UserId { get; private set; }
        public int Rating { get; private set; }
        public string? Body { get; private set; }

        public Task<BikeReviewsDto?> GetByBikeAsync(
            int bikeId,
            CancellationToken ct,
            bool includeTestData = false) =>
            Task.FromResult<BikeReviewsDto?>(new BikeReviewsDto(null, 0, []));

        public Task<BikeReviewDto?> GetByUserAsync(
            int bikeId,
            int userId,
            CancellationToken ct,
            bool includeTestData = false) =>
            Task.FromResult<BikeReviewDto?>(new BikeReviewDto(3, "Rider", Rating, Body, DateTime.UtcNow, DateTime.UtcNow));

        public Task<BikeReviewWriteResult> UpsertAsync(
            int bikeId,
            int userId,
            int rating,
            string? body,
            CancellationToken ct,
            bool includeTestData = false)
        {
            UpsertCalled = true;
            BikeId = bikeId;
            UserId = userId;
            Rating = rating;
            Body = body;
            return Task.FromResult(BikeReviewWriteResult.Saved);
        }

        public Task<bool> DeleteAsync(
            int bikeId,
            int userId,
            CancellationToken ct,
            bool includeTestData = false) =>
            Task.FromResult(true);
    }
}
