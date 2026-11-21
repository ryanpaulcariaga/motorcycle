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

public class BikeCommentTests
{
    [Fact]
    public async Task CommentIsTrimmedAndSaved()
    {
        var repository = new FakeRepository();
        var service = new BikeCommentService(repository);

        var result = await service.CreateAsync(
            7, 11, new CreateBikeCommentRequest { Body = "  How is the pillion comfort?  " }, default);

        Assert.NotNull(result);
        Assert.Equal("How is the pillion comfort?", repository.Body);
        Assert.Equal(7, repository.BikeId);
        Assert.Equal(11, repository.UserId);
    }

    [Fact]
    public async Task EmptyOrOversizedCommentsDoNotReachRepository()
    {
        var repository = new FakeRepository();
        var service = new BikeCommentService(repository);

        Assert.Null(await service.CreateAsync(
            1, 2, new CreateBikeCommentRequest { Body = "   " }, default));
        Assert.Null(await service.UpdateAsync(
            1, 3, 2, new UpdateBikeCommentRequest { Body = new string('x', 1001) }, default));
        Assert.False(repository.CreateCalled);
        Assert.False(repository.UpdateCalled);
    }

    [Fact]
    public async Task UpdateAndDeleteAreForwardedWithCommentId()
    {
        var repository = new FakeRepository();
        var service = new BikeCommentService(repository);

        await service.UpdateAsync(
            4, 8, 2, new UpdateBikeCommentRequest { Body = " Updated " }, default);
        await service.DeleteAsync(4, 8, 2, default);

        Assert.True(repository.UpdateCalled);
        Assert.True(repository.DeleteCalled);
        Assert.Equal(8, repository.CommentId);
        Assert.Equal("Updated", repository.Body);
    }

    [Fact]
    public async Task MutationsRequireUserPolicyAndRequestHeader()
    {
        var repository = new FakeRepository();
        var controller = new BikeCommentsController(new BikeCommentService(repository))
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
            typeof(BikeCommentsController).GetMethod(nameof(BikeCommentsController.Create))!
                .GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        Assert.IsType<BadRequestObjectResult>(
            await controller.Create(1, new CreateBikeCommentRequest { Body = "Question" }, default));
        Assert.IsType<BadRequestObjectResult>(
            await controller.Update(1, 2, new UpdateBikeCommentRequest { Body = "Edited" }, default));
        Assert.IsType<BadRequestObjectResult>(await controller.Delete(1, 2, default));

        controller.Request.Headers["X-Review-Request"] = "1";
        var created = Assert.IsType<ObjectResult>(
            await controller.Create(1, new CreateBikeCommentRequest { Body = "Question" }, default));
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.True(repository.CreateCalled);
    }

    private sealed class FakeRepository : IBikeCommentRepository
    {
        public bool CreateCalled { get; private set; }
        public bool UpdateCalled { get; private set; }
        public bool DeleteCalled { get; private set; }
        public int BikeId { get; private set; }
        public int CommentId { get; private set; }
        public int UserId { get; private set; }
        public string? Body { get; private set; }

        public Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(
            int bikeId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<BikeCommentDto>?>([]);

        public Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(
            int bikeId, int userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<BikeCommentDto>?>([]);

        public Task<BikeCommentDto?> CreateAsync(
            int bikeId, int userId, string body, CancellationToken ct)
        {
            CreateCalled = true;
            BikeId = bikeId;
            UserId = userId;
            Body = body;
            return Task.FromResult<BikeCommentDto?>(Dto(body));
        }

        public Task<BikeCommentDto?> UpdateAsync(
            int bikeId, int commentId, int userId, string body, CancellationToken ct)
        {
            UpdateCalled = true;
            BikeId = bikeId;
            CommentId = commentId;
            UserId = userId;
            Body = body;
            return Task.FromResult<BikeCommentDto?>(Dto(body));
        }

        public Task<bool> DeleteAsync(
            int bikeId, int commentId, int userId, CancellationToken ct)
        {
            DeleteCalled = true;
            BikeId = bikeId;
            CommentId = commentId;
            UserId = userId;
            return Task.FromResult(true);
        }

        private static BikeCommentDto Dto(string body) =>
            new(1, "Rider", body, DateTime.UtcNow, DateTime.UtcNow);
    }
}
