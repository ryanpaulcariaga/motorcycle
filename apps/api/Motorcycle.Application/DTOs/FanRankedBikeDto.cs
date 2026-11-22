namespace Motorcycle.Application.DTOs;

public sealed record FanRankedBikeDto(
    BikeListItemDto Bike,
    int FanCount,
    decimal AverageRating);
