using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBrandAdminService
{
    Task<IReadOnlyList<BrandAdminDto>> GetAllAsync(CancellationToken ct = default);
    Task<BrandAdminDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<BrandAdminDto> CreateAsync(BrandRequest request, CancellationToken ct = default);
    Task<BrandAdminDto> UpdateAsync(int id, BrandRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
