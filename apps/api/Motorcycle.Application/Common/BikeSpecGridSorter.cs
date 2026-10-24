using System.Globalization;
using Motorcycle.Application.DTOs;
using Motorcycle.Domain;

namespace Motorcycle.Application.Common;

public static class BikeSpecGridSorter
{
    private static readonly StringComparer TextComparer = StringComparer.CurrentCultureIgnoreCase;

    public static IReadOnlyList<BikeSpecGridRowDto> Sort(
        IReadOnlyList<BikeSpecGridRowDto> rows,
        string? sortBy,
        string sortDirection,
        IReadOnlyDictionary<string, SpecDefinition> definitions)
    {
        if (string.IsNullOrWhiteSpace(sortBy)) {
            return rows;
        }

        var definition = sortBy.StartsWith("spec:", StringComparison.Ordinal)
            ? definitions.GetValueOrDefault(sortBy["spec:".Length..])
            : null;
        if (sortBy.StartsWith("spec:", StringComparison.Ordinal) && definition is null) {
            throw new ArgumentException($"Unrecognized specification sort field '{sortBy}'.", nameof(sortBy));
        }

        if (sortBy is not ("bike" or "model" or "brand" or "variant" or "year" or "category" or "msrp")
            && definition is null) {
            throw new ArgumentException($"Unrecognized sort field '{sortBy}'.", nameof(sortBy));
        }

        if (sortDirection is not ("asc" or "desc")) {
            throw new ArgumentException("Sort direction must be 'asc' or 'desc'.", nameof(sortDirection));
        }

        var descending = sortDirection == "desc";
        return rows.OrderBy(row => GetValue(row, sortBy, definition), Comparer<object?>.Create((left, right) =>
        {
            var leftEmpty = left is null || left is string { Length: 0 };
            var rightEmpty = right is null || right is string { Length: 0 };
            if (leftEmpty || rightEmpty) {
                return leftEmpty == rightEmpty ? 0 : leftEmpty ? 1 : -1;
            }

            var comparison = CompareValues(left!, right!);
            return descending ? -comparison : comparison;
        })).ThenBy(row => row.Id).ToList();
    }

    private static object? GetValue(
        BikeSpecGridRowDto row,
        string sortBy,
        SpecDefinition? definition) =>
        sortBy switch {
            "bike" => $"{row.BrandName} {row.VariantName}",
            "model" => row.ModelName,
            "brand" => row.BrandName,
            "variant" => row.VariantName,
            "year" => row.Year,
            "category" => row.CategoryName,
            "msrp" => row.MsrpPrice,
            _ => GetSpecValue(row, definition!)
        };

    private static object? GetSpecValue(BikeSpecGridRowDto row, SpecDefinition definition)
    {
        if (!row.Specs.TryGetValue(definition.Code, out var value) || value is null) {
            return null;
        }

        var text = Convert.ToString(value, CultureInfo.InvariantCulture);
        return definition.DataType switch {
            "number" when decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out var number) => number,
            "boolean" when bool.TryParse(text, out var boolean) => boolean,
            _ => text
        };
    }

    private static int CompareValues(object left, object right) =>
        (left, right) switch {
            (decimal leftNumber, decimal rightNumber) => leftNumber.CompareTo(rightNumber),
            (int leftNumber, int rightNumber) => leftNumber.CompareTo(rightNumber),
            (bool leftBoolean, bool rightBoolean) => leftBoolean.CompareTo(rightBoolean),
            _ => TextComparer.Compare(
                Convert.ToString(left, CultureInfo.CurrentCulture),
                Convert.ToString(right, CultureInfo.CurrentCulture))
        };
}
