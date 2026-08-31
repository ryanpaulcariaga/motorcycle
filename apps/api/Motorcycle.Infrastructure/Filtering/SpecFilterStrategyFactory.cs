using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Filtering;

public class SpecFilterStrategyFactory : ISpecFilterStrategyFactory
{
    private readonly Dictionary<string, ISpecFilterStrategy> _strategies;

    public SpecFilterStrategyFactory(IEnumerable<ISpecFilterStrategy> strategies)
    {
        _strategies = strategies.ToDictionary(s => s.FilterType, s => s);
    }

    public ISpecFilterStrategy Resolve(string filterType)
    {
        if (!_strategies.TryGetValue(filterType, out var strategy))
            throw new NotSupportedException($"No ISpecFilterStrategy registered for filter type '{filterType}'.");
        return strategy;
    }
}
