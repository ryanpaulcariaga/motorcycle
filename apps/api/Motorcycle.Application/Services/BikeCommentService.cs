using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IBikeCommentService
{
    Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(int bikeId, CancellationToken ct);
    Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(int bikeId, int userId, CancellationToken ct);
    Task<BikeCommentDto?> CreateAsync(int bikeId, int userId, CreateBikeCommentRequest request, CancellationToken ct);
    Task<BikeCommentDto?> UpdateAsync(int bikeId, int commentId, int userId, UpdateBikeCommentRequest request, CancellationToken ct);
    Task<bool> DeleteAsync(int bikeId, int commentId, int userId, CancellationToken ct);
}

public sealed class BikeCommentService(IBikeCommentRepository repository) : IBikeCommentService
{
    public Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(int bikeId, CancellationToken ct) =>
        repository.GetByBikeAsync(bikeId, 200, ct);

    public Task<IReadOnlyList<BikeCommentDto>?> GetByUserAsync(int bikeId, int userId, CancellationToken ct) =>
        repository.GetByUserAsync(bikeId, userId, ct);

    public Task<BikeCommentDto?> CreateAsync(
        int bikeId,
        int userId,
        CreateBikeCommentRequest request,
        CancellationToken ct)
    {
        var body = request.Body.Trim();
        return body.Length is < 1 or > 1000
            ? Task.FromResult<BikeCommentDto?>(null)
            : repository.CreateAsync(bikeId, userId, body, ct);
    }

    public Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        UpdateBikeCommentRequest request,
        CancellationToken ct)
    {
        var body = request.Body.Trim();
        return body.Length is < 1 or > 1000
            ? Task.FromResult<BikeCommentDto?>(null)
            : repository.UpdateAsync(bikeId, commentId, userId, body, ct);
    }

    public Task<bool> DeleteAsync(int bikeId, int commentId, int userId, CancellationToken ct) =>
        repository.DeleteAsync(bikeId, commentId, userId, ct);
}
