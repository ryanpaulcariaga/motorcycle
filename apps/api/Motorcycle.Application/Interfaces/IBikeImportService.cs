using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IBikeImportService
{
    /// <summary>Inserts rows without an Id and updates rows with an existing Id. All-or-nothing: throws <see cref="BikeImportValidationException"/> without saving when any row is invalid.</summary>
    Task<BikeImportResultDto> ImportAsync(BikeImportRequest request, CancellationToken ct = default);

    /// <summary>Returns the bikes matching the filters plus every specification column in group/definition sort order.</summary>
    Task<BikeExportDto> GetExportAsync(int? brandId, int? categoryId, decimal? minPrice, decimal? maxPrice, CancellationToken ct = default);
}
