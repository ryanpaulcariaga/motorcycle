using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeCommentRepository
{
    Task<IReadOnlyList<BikeCommentDto>?> GetByBikeAsync(
        int bikeId,
        int limit,
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
        int? parentCommentId,
        string body,
        CancellationToken ct,
        bool includeTestData = false);
    Task<BikeCommentDto?> UpdateAsync(
        int bikeId,
        int commentId,
        int userId,
        string body,
        CancellationToken ct,
        bool includeTestData = false);
    Task<bool> DeleteAsync(
        int bikeId,
        int commentId,
        int userId,
        CancellationToken ct,
        bool includeTestData = false);
}
