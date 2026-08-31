using System.Globalization;
using Motorcycle.Application.Common;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Filtering;

/// <summary>Matches numeric specs within an optional [Min, Max] range.</summary>
public class NumberRangeFilterStrategy : ISpecFilterStrategy
{
    public string FilterType => "range";

    public bool IsMatch(object? specValue, SpecFilterRequest filter)
    {
        if (specValue is null) return false;
        if (!TryParseDecimal(specValue, out var value)) return false;

        if (filter.Min is not null && decimal.TryParse(filter.Min, NumberStyles.Any, CultureInfo.InvariantCulture, out var min) && value < min)
            return false;

        if (filter.Max is not null && decimal.TryParse(filter.Max, NumberStyles.Any, CultureInfo.InvariantCulture, out var max) && value > max)
            return false;

        return true;
    }

    private static bool TryParseDecimal(object value, out decimal result)
    {
        var str = value switch
        {
            System.Text.Json.JsonElement je => je.ToString(),
            _ => value.ToString()
        };
        return decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}
