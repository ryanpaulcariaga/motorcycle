using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IBikeCommentService
{
    Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(
        int bikeId,
        CancellationToken ct,
        bool includeTestData = false);
    Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
    Task<BikeCommentDto?> CreateAsync(
        int bikeId,
        int userId,
        CreateBikeCommentRequest request,
        CancellationToken ct,
        bool includeTestData = false);
    Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        UpdateBikeCommentRequest request,
        CancellationToken ct,
        bool includeTestData = false);
    Task<bool> DeleteAsync(
        int bikeId,
        int commentId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
}

public sealed class BikeCommentService(IBikeCommentRepository repository) : IBikeCommentService
{
    public Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(
        int bikeId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.GetByBikeAsync(bikeId, 200, ct, includeTestData);

    public Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.GetByUserAsync(bikeId, userId, ct, includeTestData);

    public Task<BikeCommentDto?> CreateAsync(
        int bikeId,
        int userId,
        CreateBikeCommentRequest request,
        CancellationToken ct,
        bool includeTestData = false)
    {
        var body = request.Body.Trim();
        return body.Length is < 1 or > 1000
            ? Task.FromResult<BikeCommentDto?>(null)
            : repository.CreateAsync(
                bikeId,
                userId,
                request.ParentCommentId,
                body,
                ct,
                includeTestData);
    }

    public Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        UpdateBikeCommentRequest request,
        CancellationToken ct,
        bool includeTestData = false)
    {
        var body = request.Body.Trim();
        return body.Length is < 1 or > 1000
            ? Task.FromResult<BikeCommentDto?>(null)
            : repository.UpdateAsync(
                bikeId,
                commentId,
                userId,
                body,
                ct,
                includeTestData);
    }

    public Task<bool> DeleteAsync(
        int bikeId,
        int commentId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.DeleteAsync(
            bikeId,
            commentId,
            userId,
            ct,
            includeTestData);
}
