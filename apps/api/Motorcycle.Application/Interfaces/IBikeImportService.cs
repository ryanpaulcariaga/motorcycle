using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeImportService
{
    /// <summary>Inserts rows without an Id and updates rows with an existing Id. All-or-nothing: throws <see cref="BikeImportValidationException"/> without saving when any row is invalid.</summary>
    Task<BikeImportResultDto> ImportAsync(BikeImportRequest request, CancellationToken ct = default);

    /// <summary>Returns the filtered bikes and specification columns in group/definition order, with optional row sorting.</summary>
    Task<BikeExportDto> GetExportAsync(int? brandId, int? categoryId, decimal? minPrice, decimal? maxPrice, CancellationToken ct = default, string? sortBy = null, string sortDirection = "asc");
}
