namespace Motorcycle.Application.DTOs;

public sealed record DailyInterestRankedBikeDto(
    BikeListItemDto Bike,
    long ViewCount);
