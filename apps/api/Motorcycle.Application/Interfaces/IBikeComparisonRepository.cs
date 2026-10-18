using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public record ComparedBikeMatch(Bike Bike, int CompareCount);

public interface IBikeComparisonRepository
{
    /// <summary>Increments the compare counter of each distinct bike pair.</summary>
    Task RecordAsync(IEnumerable<(int BikeAId, int BikeBId)> pairs, CancellationToken ct = default);

    /// <summary>Published bikes most often compared with the given bike, most compared first.</summary>
    Task<List<ComparedBikeMatch>> GetMostComparedWithAsync(int bikeId, int limit, CancellationToken ct = default);
}
