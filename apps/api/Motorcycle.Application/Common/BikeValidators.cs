using Motorcycle.Domain;

namespace Motorcycle.Application.Common;

public static class BikeValidators
{
    public static (string VariantName, int Year) ValidateCore(string variantName, int year)
    {
        var normalized = variantName?.Trim() ?? string.Empty;
        if (normalized.Length is < 1 or > 255)
            throw new ArgumentException("Variant name must contain between 1 and 255 characters.", nameof(variantName));
        if (year <= 0)
            throw new ArgumentException("Year is required.", nameof(year));
        return (normalized, year);
    }

    /// <summary>Validates submitted spec values against the full set of spec definitions (all groups, not category-filtered).</summary>
    public static Dictionary<string, object?> ValidateSpecs(Dictionary<string, object?>? specs, IReadOnlyDictionary<string, SpecDefinition> definitionsByCode)
    {
        var result = new Dictionary<string, object?>();
        if (specs is null) return result;

        foreach (var (code, value) in specs)
        {
            if (!definitionsByCode.TryGetValue(code, out var definition))
                throw new ArgumentException($"Unrecognized specification code '{code}'.", nameof(specs));

            if (!IsValueValidForType(value, definition.DataType))
                throw new ArgumentException($"Value for '{code}' does not match the expected type '{definition.DataType}'.", nameof(specs));

            result[code] = value;
        }

        return result;
    }

    private static bool IsValueValidForType(object? value, string dataType)
    {
        if (value is null) return true;

        return dataType switch
        {
            "number" => value is int or long or double or float or decimal ||
                        (value is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Number),
            "boolean" => value is bool ||
                         (value is System.Text.Json.JsonElement je2 && (je2.ValueKind == System.Text.Json.JsonValueKind.True || je2.ValueKind == System.Text.Json.JsonValueKind.False)),
            "text" or "enum" => value is string ||
                                (value is System.Text.Json.JsonElement je3 && je3.ValueKind == System.Text.Json.JsonValueKind.String),
            _ => true
        };
    }
}
