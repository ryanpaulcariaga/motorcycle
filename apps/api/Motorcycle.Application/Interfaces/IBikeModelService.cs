using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeModelService
{
    Task<IReadOnlyList<BikeModelDto>> GetAllAsync(CancellationToken ct = default);
    Task<BikeModelDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<BikeModelDto> CreateAsync(CreateBikeModelRequest request, CancellationToken ct = default);
    Task<BikeModelDto> UpdateAsync(int id, UpdateBikeModelRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
