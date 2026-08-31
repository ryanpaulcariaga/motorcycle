using Motorcycle.Application.Common;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Filtering;

/// <summary>Matches text/enum specs requiring an exact case-insensitive string match.</summary>
public class ExactMatchFilterStrategy : ISpecFilterStrategy
{
    public string FilterType => "exact";

    public bool IsMatch(object? specValue, SpecFilterRequest filter)
    {
        if (specValue is null || filter.Value is null) return false;
        return string.Equals(specValue.ToString(), filter.Value, StringComparison.OrdinalIgnoreCase);
    }
}
