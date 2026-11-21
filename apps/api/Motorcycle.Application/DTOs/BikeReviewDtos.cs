using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Motorcycle.Application.DTOs;

public sealed record BikeReviewDto(
    int Id,
    string AuthorName,
    int Rating,
    string? Body,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record BikeReviewsDto(
    decimal? AverageRating,
    int RatingCount,
    IReadOnlyList<BikeReviewDto> Reviews);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UpsertBikeReviewRequest
{
    [Range(1, 5)]
    public int Rating { get; init; }

    [MaxLength(1000)]
    public string? Body { get; init; }
}
