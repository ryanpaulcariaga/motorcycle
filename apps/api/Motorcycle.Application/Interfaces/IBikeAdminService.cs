using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeAdminService
{
    Task<IReadOnlyList<BikeAdminListItemDto>> GetAllAsync(int? modelId, CancellationToken ct = default);
    Task<BikeAdminDetailDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<BikeAdminDetailDto> CreateAsync(CreateBikeRequest request, CancellationToken ct = default);
    Task<BikeAdminDetailDto> UpdateAsync(int id, UpdateBikeRequest request, CancellationToken ct = default);
    Task<BikeAdminDetailDto> PublishAsync(int id, CancellationToken ct = default);
    Task<BikeAdminDetailDto> UnpublishAsync(int id, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
