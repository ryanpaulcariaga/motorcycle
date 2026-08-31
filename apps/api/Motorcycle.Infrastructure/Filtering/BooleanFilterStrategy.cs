using Motorcycle.Application.Common;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Filtering;

/// <summary>Matches boolean specs against a true/false filter value.</summary>
public class BooleanFilterStrategy : ISpecFilterStrategy
{
    public string FilterType => "boolean";

    public bool IsMatch(object? specValue, SpecFilterRequest filter)
    {
        if (specValue is null || filter.Value is null) return false;
        if (!bool.TryParse(filter.Value, out var expected)) return false;
        if (!bool.TryParse(specValue.ToString(), out var actual)) return false;
        return expected == actual;
    }
}
