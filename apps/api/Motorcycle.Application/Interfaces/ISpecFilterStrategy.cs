using Motorcycle.Application.Common;

namespace Motorcycle.Application.Interfaces;

/// <summary>
/// Strategy for matching a single bike's spec value against a dynamic filter request.
/// One implementation per spec_definitions.filter_type (range/exact/multiselect/boolean).
/// </summary>
public interface ISpecFilterStrategy
{
    string FilterType { get; }

    bool IsMatch(object? specValue, SpecFilterRequest filter);
}

public interface ISpecFilterStrategyFactory
{
    ISpecFilterStrategy Resolve(string filterType);
}
