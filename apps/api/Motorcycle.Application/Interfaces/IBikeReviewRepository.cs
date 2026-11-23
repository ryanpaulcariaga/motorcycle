using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeReviewRepository
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
        int rating,
        string? body,
        CancellationToken ct,
        bool includeTestData = false);
    Task<bool> DeleteAsync(
        int bikeId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
}

public enum BikeReviewWriteResult
{
    Saved,
    Unavailable
}
