using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Application.Services;

public interface IBikeReviewService
{
    Task<BikeReviewsDto?> GetByBikeAsync(
        int bikeId,
        CancellationToken ct,
        bool includeTestData = false);
    Task<BikeReviewDto?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
    Task<BikeReviewWriteResult> UpsertAsync(
        int bikeId,
        int userId,
        UpsertBikeReviewRequest request,
        CancellationToken ct,
        bool includeTestData = false);
    Task<bool> DeleteAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
}

public sealed class BikeReviewService(IBikeReviewRepository repository) : IBikeReviewService
{
    public Task<BikeReviewsDto?> GetByBikeAsync(
        int bikeId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.GetByBikeAsync(bikeId, ct, includeTestData);

    public Task<BikeReviewDto?> GetByUserAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.GetByUserAsync(bikeId, userId, ct, includeTestData);

    public Task<BikeReviewWriteResult> UpsertAsync(
        int bikeId,
        int userId,
        UpsertBikeReviewRequest request,
        CancellationToken ct,
        bool includeTestData = false)
    {
        if (request.Rating is < 1 or > 5 ||
            request.Body is not null && request.Body.Trim().Length > 1000)
        {
            return Task.FromResult(BikeReviewWriteResult.Unavailable);
        }

        var body = request.Body?.Trim();
        return repository.UpsertAsync(
            bikeId,
            userId,
            request.Rating,
            string.IsNullOrEmpty(body) ? null : body,
            ct,
            includeTestData);
    }

    public Task<bool> DeleteAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false) =>
        repository.DeleteAsync(bikeId, userId, ct, includeTestData);
}
