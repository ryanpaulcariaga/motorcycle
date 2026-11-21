using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IBikeReviewService
{
    Task<BikeReviewsDto?> GetByBikeAsync(int bikeId, CancellationToken ct);
    Task<BikeReviewDto?> GetByUserAsync(int bikeId, int userId, CancellationToken ct);
    Task<BikeReviewWriteResult> UpsertAsync(int bikeId, int userId, UpsertBikeReviewRequest request, CancellationToken ct);
    Task<bool> DeleteAsync(int bikeId, int userId, CancellationToken ct);
}

public sealed class BikeReviewService(IBikeReviewRepository repository) : IBikeReviewService
{
    public Task<BikeReviewsDto?> GetByBikeAsync(int bikeId, CancellationToken ct) =>
        repository.GetByBikeAsync(bikeId, ct);

    public Task<BikeReviewDto?> GetByUserAsync(int bikeId, int userId, CancellationToken ct) =>
        repository.GetByUserAsync(bikeId, userId, ct);

    public Task<BikeReviewWriteResult> UpsertAsync(
        int bikeId,
        int userId,
        UpsertBikeReviewRequest request,
        CancellationToken ct)
    {
        if (request.Rating is < 1 or > 5 ||
            request.Body is not null && request.Body.Trim().Length > 1000)
        {
            return Task.FromResult(BikeReviewWriteResult.Unavailable);
        }

        var body = request.Body?.Trim();
        return repository.UpsertAsync(bikeId, userId, request.Rating, string.IsNullOrEmpty(body) ? null : body, ct);
    }

    public Task<bool> DeleteAsync(int bikeId, int userId, CancellationToken ct) =>
        repository.DeleteAsync(bikeId, userId, ct);
}
