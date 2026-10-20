using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public record ComparedBikeMatch(Bike Bike, int CompareCount);

public record PopularComparisonMatch(Bike BikeA, Bike BikeB, int CompareCount);

public interface IBikeComparisonRepository
{
    /// <summary>Most compared pairs of published bikes, most compared first.</summary>
    Task<List<PopularComparisonMatch>> GetMostComparedPairsAsync(int limit, CancellationToken ct = default);

    /// <summary>Increments the compare counter of each distinct bike pair.</summary>
    Task RecordAsync(IEnumerable<(int BikeAId, int BikeBId)> pairs, CancellationToken ct = default);

    /// <summary>Published bikes most often compared with the given bike, most compared first.</summary>
    Task<List<ComparedBikeMatch>> GetMostComparedWithAsync(int bikeId, int limit, CancellationToken ct = default);
}
