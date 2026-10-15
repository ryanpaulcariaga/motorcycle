namespace Motorcycle.Application.DTOs;

public sealed record BrandAdminDto(int Id, string Name, string? LogoBlobUrl, int ModelCount, int BikeCount);

public sealed record BrandRequest(string Name, string? LogoBlobUrl);
