using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Motorcycle.Application.DTOs;

public sealed record BikeCommentDto(
    int Id,
    int? ParentCommentId,
    string AuthorName,
    string Body,
    DateTime CreatedAt,
    DateTime UpdatedAt);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CreateBikeCommentRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(1000)]
    public string Body { get; init; } = string.Empty;

    public int? ParentCommentId { get; init; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UpdateBikeCommentRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(1000)]
    public string Body { get; init; } = string.Empty;
}
