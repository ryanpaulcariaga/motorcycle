using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Motorcycle.Application.DTOs;

/// <summary>Account preference for optional interest profiling.</summary>
public sealed record UserInterestPreferenceResponse(bool Enabled);

/// <summary>Updates optional interest profiling; disabling deletes recorded activity.</summary>
public sealed record UpdateUserInterestPreferenceRequest([Required] bool? Enabled);

/// <summary>A structured catalog interest; search text is not accepted.</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UserInterestEventRequest
{
    public required string Type { get; init; }
    public int? Id { get; init; }
    public int[]? BikeIds { get; init; }
}
