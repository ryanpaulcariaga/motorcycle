namespace Motorcycle.Application.DTOs;

public sealed record BikeAdminListItemDto(
    int Id,
    int ModelId,
    string ModelName,
    string BrandName,
    string VariantName,
    int Year,
    decimal? MsrpPrice,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record BikeAdminDetailDto(
    int Id,
    int ModelId,
    string ModelName,
    string BrandName,
    string VariantName,
    int Year,
    decimal? MsrpPrice,
    string Slug,
    bool IsPublished,
    Dictionary<string, object?> Specs,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record BikeSpecValueItemDto(
    int Id,
    string ModelName,
    string BrandName,
    string CategoryName,
    string VariantName,
    int Year,
    decimal? MsrpPrice,
    bool IsPublished,
    object? Value);

public sealed record BikeSpecValueUpdate(int BikeId, object? Value);

public sealed record UpdateSingleSpecRequest(string SpecCode, List<BikeSpecValueUpdate> Values);

public sealed record CreateBikeRequest(
    int ModelId,
    string VariantName,
    int Year,
    decimal? MsrpPrice,
    Dictionary<string, object?>? Specs);

public sealed record UpdateBikeRequest(
    string VariantName,
    int Year,
    decimal? MsrpPrice,
    Dictionary<string, object?>? Specs,
    int? ModelId = null);
