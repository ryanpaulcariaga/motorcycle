using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Controllers;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Tests;

public class UserInterestTests
{
    [Theory]
    [InlineData("bike_view")]
    [InlineData("bike_search_selection")]
    [InlineData("brand_filter")]
    [InlineData("category_filter")]
    public async Task ValidSignalsAreForwarded(string type)
    {
        var repository = new FakeRepository();
        var service = new UserInterestService(repository, TimeProvider.System);
        Assert.Equal(UserInterestRecordResult.Recorded,
            await service.RecordAsync(9, new UserInterestEventRequest { Type = type, Id = 5 }, default));
        Assert.Equal(9, repository.UserId);
        Assert.Equal(type, repository.Recorded?.Type);
    }

    [Fact]
    public async Task InvalidSignalsAreRejectedWithoutCallingRepository()
    {
        var repository = new FakeRepository();
        var service = new UserInterestService(repository, TimeProvider.System);
        UserInterestEventRequest[] requests =
        [
            new() { Type = "search" },
            new() { Type = "bike_view", Id = 0 },
            new() { Type = "bike_search_selection", Id = 1, BikeIds = [1, 2] },
            new() { Type = "comparison", BikeIds = [1] },
            new() { Type = "comparison", BikeIds = [1, 1] },
            new() { Type = "comparison", BikeIds = [1, -2] },
            new() { Type = "comparison", BikeIds = Enumerable.Range(1, 26).ToArray() }
        ];
        foreach (var request in requests)
        {
            Assert.Equal(UserInterestRecordResult.Invalid, await service.RecordAsync(1, request, default));
        }

        Assert.Null(repository.Recorded);
    }

    [Fact]
    public void EventRejectsUnrecognizedFieldsIncludingSearchText()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<UserInterestEventRequest>(
            """{"Type":"bike_search_selection","Id":1,"searchText":"private text"}"""));
    }

    [Fact]
    public async Task ComparisonAndRepositoryConsentResultArePreserved()
    {
        var repository = new FakeRepository { Result = UserInterestRecordResult.NotEnabled };
        var service = new UserInterestService(repository, TimeProvider.System);
        Assert.Equal(UserInterestRecordResult.NotEnabled,
            await service.RecordAsync(3, new UserInterestEventRequest { Type = "comparison", BikeIds = [2, 1] }, default));
    }

    [Fact]
    public async Task RetentionUsesTwelveCalendarMonthsInUtc()
    {
        var repository = new FakeRepository();
        var service = new UserInterestService(repository, new FixedClock());
        await service.DeleteExpiredAsync(default);
        Assert.Equal(new DateOnly(2025, 11, 15), repository.Cutoff);
    }

    [Fact]
    public async Task ControllerRequiresUserPolicyAndMutationHeader()
    {
        Assert.Equal("AuthenticatedUser", typeof(UserInterestController).GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        var repository = new FakeRepository();
        var controller = new UserInterestController(new UserInterestService(repository, TimeProvider.System))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "4")], "test"))
                }
            }
        };
        Assert.IsType<BadRequestObjectResult>(await controller.SetPreference(new UpdateUserInterestPreferenceRequest(true), default));
        Assert.IsType<BadRequestObjectResult>(await controller.Record(new UserInterestEventRequest { Type = "bike_view", Id = 1 }, default));
        Assert.Null(repository.Recorded);
        controller.Request.Headers["X-Interest-Request"] = "1";
        Assert.IsType<BadRequestObjectResult>(await controller.SetPreference(new UpdateUserInterestPreferenceRequest(null), default));
        repository.Result = UserInterestRecordResult.NotEnabled;
        var forbidden = Assert.IsType<StatusCodeResult>(await controller.Record(new UserInterestEventRequest { Type = "bike_view", Id = 1 }, default));
        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 15, 0, 0, 0, TimeSpan.Zero);
    }

    private sealed class FakeRepository : IUserInterestRepository
    {
        public int UserId { get; private set; }
        public UserInterestEventRequest? Recorded { get; private set; }
        public DateOnly? Cutoff { get; private set; }
        public UserInterestRecordResult Result { get; set; } = UserInterestRecordResult.Recorded;
        public Task<bool?> GetPreferenceAsync(int userId, CancellationToken ct) => Task.FromResult<bool?>(false);
        public Task<bool> SetPreferenceAsync(int userId, bool enabled, CancellationToken ct) => Task.FromResult(true);
        public Task<UserInterestRecordResult> RecordAsync(int userId, UserInterestEventRequest request, CancellationToken ct)
        {
            UserId = userId;
            Recorded = request;
            return Task.FromResult(Result);
        }
        public Task DeleteBeforeAsync(DateOnly cutoff, CancellationToken ct)
        {
            Cutoff = cutoff;
            return Task.CompletedTask;
        }
    }
}
