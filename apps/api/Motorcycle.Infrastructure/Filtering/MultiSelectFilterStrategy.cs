using Motorcycle.Application.Common;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Filtering;

/// <summary>Matches enum specs against a set of allowed values (any-of).</summary>
public class MultiSelectFilterStrategy : ISpecFilterStrategy
{
    public string FilterType => "multiselect";

    public bool IsMatch(object? specValue, SpecFilterRequest filter)
    {
        if (specValue is null || filter.Values is null || filter.Values.Count == 0) return false;
        var strValue = specValue.ToString();
        return filter.Values.Any(v => string.Equals(v, strValue, StringComparison.OrdinalIgnoreCase));
    }
}
