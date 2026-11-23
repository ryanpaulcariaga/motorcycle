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
        => Sort(rows, ParseCriteria(null, sortBy, sortDirection), definitions);

    public static IReadOnlyList<BikeSpecGridRowDto> Sort(
        IReadOnlyList<BikeSpecGridRowDto> rows,
        string? sort,
        string? sortBy,
        string sortDirection,
        IReadOnlyDictionary<string, SpecDefinition> definitions)
        => Sort(rows, ParseCriteria(sort, sortBy, sortDirection), definitions);

    public static IReadOnlyList<BikeSortCriterion> ParseCriteria(
        string? sort,
        string? sortBy,
        string sortDirection)
    {
        if (!string.IsNullOrWhiteSpace(sort)) {
            var criteria = new List<BikeSortCriterion>();
            foreach (var rule in sort.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)) {
                var separator = rule.LastIndexOf(':');
                var field = separator > 0 ? rule[..separator] : string.Empty;
                var direction = separator > 0 ? rule[(separator + 1)..] : string.Empty;
                if (string.IsNullOrWhiteSpace(field) || direction is not ("asc" or "desc")) {
                    throw new ArgumentException("Sort criteria must use 'field:asc' or 'field:desc'.", nameof(sort));
                }

                if (criteria.Any(criterion => criterion.Field == field)) {
                    throw new ArgumentException("Sort fields cannot be repeated.", nameof(sort));
                }

                criteria.Add(new BikeSortCriterion(field, direction == "desc"));
            }
            return criteria;
        }

        if (string.IsNullOrWhiteSpace(sortBy)) {
            return [];
        }

        if (sortDirection is not ("asc" or "desc")) {
            throw new ArgumentException("Sort direction must be 'asc' or 'desc'.", nameof(sortDirection));
        }

        return [new BikeSortCriterion(sortBy, sortDirection == "desc")];
    }

    public static IReadOnlyList<BikeSpecGridRowDto> Sort(
        IReadOnlyList<BikeSpecGridRowDto> rows,
        IReadOnlyList<BikeSortCriterion> criteria,
        IReadOnlyDictionary<string, SpecDefinition> definitions)
    {
        if (criteria.Count == 0) {
            return rows;
        }

        IOrderedEnumerable<BikeSpecGridRowDto>? ordered = null;
        foreach (var criterion in criteria) {
            var definition = criterion.Field.StartsWith("spec:", StringComparison.Ordinal)
                ? definitions.GetValueOrDefault(criterion.Field["spec:".Length..])
                : null;
            if (criterion.Field.StartsWith("spec:", StringComparison.Ordinal) && definition is null) {
                throw new ArgumentException($"Unrecognized specification sort field '{criterion.Field}'.", nameof(criteria));
            }

            if (criterion.Field is not ("bike" or "model" or "brand" or "variant" or "year" or "category" or "msrp" or "status" or "reviewed")
                && definition is null) {
                throw new ArgumentException($"Unrecognized sort field '{criterion.Field}'.", nameof(criteria));
            }

            var comparer = Comparer<object?>.Create((left, right) =>
            {
                var leftEmpty = left is null || left is string { Length: 0 };
                var rightEmpty = right is null || right is string { Length: 0 };
                if (leftEmpty || rightEmpty) {
                    return leftEmpty == rightEmpty ? 0 : leftEmpty ? 1 : -1;
                }

                var comparison = CompareValues(left!, right!);
                return criterion.Descending ? -comparison : comparison;
            });
            ordered = ordered is null
                ? rows.OrderBy(row => GetValue(row, criterion.Field, definition), comparer)
                : ordered.ThenBy(row => GetValue(row, criterion.Field, definition), comparer);
        }

        return ordered!.ThenBy(row => row.Id).ToList();
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
            "status" => row.IsPublished,
            "reviewed" => ReviewRank(row.ReviewStatus),
            _ => GetSpecValue(row, definition!)
        };

    private static int ReviewRank(string reviewStatus) =>
        reviewStatus switch {
            BikeReviewStatus.Draft => 0,
            BikeReviewStatus.InProgress => 1,
            BikeReviewStatus.Completed => 2,
            _ => 3
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
