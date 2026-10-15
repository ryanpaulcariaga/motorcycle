using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface ICategoryAdminService
{
    Task<IReadOnlyList<CategoryAdminDto>> GetAllAsync(CancellationToken ct = default);
    Task<CategoryAdminDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CategoryAdminDto> CreateAsync(CategoryRequest request, CancellationToken ct = default);
    Task<CategoryAdminDto> UpdateAsync(int id, CategoryRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
