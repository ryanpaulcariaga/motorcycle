namespace Motorcycle.Application.DTOs;

public sealed record BikeModelDto(
    int Id,
    int BrandId,
    string BrandName,
    int CategoryId,
    string CategoryName,
    string Name,
    DateTime CreatedAt);

public sealed record CreateBikeModelRequest(int BrandId, int CategoryId, string Name);
public sealed record UpdateBikeModelRequest(int BrandId, int CategoryId, string Name);
