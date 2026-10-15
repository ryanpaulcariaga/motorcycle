using System.Globalization;
using System.Text.Json;

namespace Motorcycle.Application.Common;

/// <summary>Converts stored bike spec values when a spec definition's dataType changes.</summary>
public static class SpecValueConverter
{
    /// <summary>Returns true when the value already fits, or was converted into <paramref name="converted"/>.
    /// Otherwise returns false with a human-readable <paramref name="reason"/>.</summary>
    public static bool TryConvert(object? value, string dataType, out object? converted, out string? reason)
    {
        converted = value;
        reason = null;
        if (BikeValidators.ValidateValueForType(value, dataType)) return true;

        var text = value switch
        {
            JsonElement { ValueKind: JsonValueKind.String } je => je.GetString(),
            JsonElement je => je.GetRawText(),
            bool b => b ? "true" : "false",
            IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
            _ => value?.ToString()
        } ?? string.Empty;
        var isString = value is string || value is JsonElement { ValueKind: JsonValueKind.String };

        switch (dataType)
        {
            case "number":
                if (isString && decimal.TryParse(text.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var number))
                {
                    converted = number;
                    return true;
                }
                reason = $"\"{text}\" is not a valid number.";
                return false;
            case "boolean":
                if (isString && bool.TryParse(text.Trim(), out var flag))
                {
                    converted = flag;
                    return true;
                }
                reason = $"\"{text}\" is not \"true\" or \"false\".";
                return false;
            case "text":
            case "enum":
                converted = text;
                return true;
            default:
                return true;
        }
    }
}
