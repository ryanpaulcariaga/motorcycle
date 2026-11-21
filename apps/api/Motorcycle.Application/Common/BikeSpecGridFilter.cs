using System.Globalization;
using System.Text.Json;
using Motorcycle.Domain;

namespace Motorcycle.Application.Common;

public static class BikeSpecGridFilter
{
    public static IEnumerable<Bike> Displacement(
        IEnumerable<Bike> bikes,
        decimal? minimum,
        decimal? maximum)
    {
        if (!minimum.HasValue && !maximum.HasValue) {
            return bikes;
        }

        return bikes.Where(bike =>
        {
            if (!bike.Specs.TryGetValue("cc", out var value) || value is null || !TryGetDecimal(value, out var displacement)) {
                return false;
            }

            return (!minimum.HasValue || displacement >= minimum.Value)
                && (!maximum.HasValue || displacement <= maximum.Value);
        });
    }

    private static bool TryGetDecimal(object value, out decimal result)
    {
        var text = value is JsonElement element
            ? element.ToString()
            : Convert.ToString(value, CultureInfo.InvariantCulture);
        return decimal.TryParse(
            text,
            NumberStyles.Number,
            CultureInfo.InvariantCulture,
            out result);
    }
}
