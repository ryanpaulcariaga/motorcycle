namespace Motorcycle.Application.DTOs;

/// <summary>One opt-in browser action, without visitor identifiers or search text.</summary>
public sealed record AnalyticsEventRequest
{
    public required string Type { get; init; }
    public int? Id { get; init; }
    public int[]? BikeIds { get; init; }
    public bool? ZeroResults { get; init; }
}

/// <summary>An aggregate with an optional catalog label.</summary>
public sealed record AnalyticsCountResponse(int Id, string Name, long Count);

/// <summary>An aggregate for a pair of bikes.</summary>
public sealed record AnalyticsPairResponse(int BikeAId, string BikeAName, int BikeBId, string BikeBName, long Count);

/// <summary>Daily opt-in activity in a UTC date range.</summary>
public sealed record AnalyticsDayResponse(DateOnly Day, long BikeViews, long Comparisons, long Searches, long ZeroResults);

/// <summary>Aggregated activity for the requested UTC date range.</summary>
public sealed record AnalyticsDashboardResponse(
    DateOnly From, DateOnly To, long BikeViews, long Comparisons, long Searches, long ZeroResults,
    IReadOnlyList<AnalyticsDayResponse> Daily,
    IReadOnlyList<AnalyticsCountResponse> Bikes,
    IReadOnlyList<AnalyticsCountResponse> Brands,
    IReadOnlyList<AnalyticsCountResponse> Categories,
    IReadOnlyList<AnalyticsPairResponse> Pairs);
