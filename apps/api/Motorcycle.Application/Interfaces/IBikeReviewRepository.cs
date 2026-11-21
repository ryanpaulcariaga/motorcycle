using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeReviewRepository
{
    Task<BikeReviewsDto?> GetByBikeAsync(int bikeId, CancellationToken ct);
    Task<BikeReviewDto?> GetByUserAsync(int bikeId, int userId, CancellationToken ct);
    Task<BikeReviewWriteResult> UpsertAsync(int bikeId, int userId, int rating, string? body, CancellationToken ct);
    Task<bool> DeleteAsync(int bikeId, int userId, CancellationToken ct);
}

public enum BikeReviewWriteResult
{
    Saved,
    Unavailable
}
