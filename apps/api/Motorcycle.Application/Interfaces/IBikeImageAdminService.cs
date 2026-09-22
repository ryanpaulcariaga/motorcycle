using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeImageAdminService
{
    Task<IReadOnlyList<BikeImageAdminDto>> GetAllAsync(int bikeId, CancellationToken ct = default);
    Task<BikeImageAdminDto> UploadAsync(int bikeId, Stream content, string fileName, string contentType, long length, CancellationToken ct = default);
    Task<BikeImageAdminDto> SetPrimaryAsync(int bikeId, int imageId, CancellationToken ct = default);
    Task<IReadOnlyList<BikeImageAdminDto>> ReorderAsync(int bikeId, ReorderBikeImagesRequest request, CancellationToken ct = default);
    Task DeleteAsync(int bikeId, int imageId, CancellationToken ct = default);
}
