using System.Text.RegularExpressions;

namespace Motorcycle.Application.Common;

public static class SpecMetadataValidators
{
    private const int MaxCodeLength = 100;
    private static readonly Regex CodePattern = new("^[a-z][a-z0-9_]*$", RegexOptions.Compiled);
    private static readonly HashSet<string> ValidDataTypes = new(StringComparer.Ordinal) { "number", "text", "boolean", "enum" };

    public static string ValidateCode(string? code, string fieldName)
    {
        var normalized = code?.Trim().ToLowerInvariant() ?? string.Empty;
        if (normalized.Length is < 1 or > MaxCodeLength)
            throw new ArgumentException($"{fieldName} must contain between 1 and {MaxCodeLength} characters.", fieldName);
        if (!CodePattern.IsMatch(normalized))
            throw new ArgumentException($"{fieldName} must start with a lowercase letter and contain only lowercase letters, digits, and underscores.", fieldName);
        return normalized;
    }

    public static string ValidateRequiredText(string? value, string fieldName, int maxLength = 255)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length is < 1 || normalized.Length > maxLength)
            throw new ArgumentException($"{fieldName} must contain between 1 and {maxLength} characters.", fieldName);
        return normalized;
    }

    public static string ValidateDataType(string? dataType)
    {
        var normalized = dataType?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!ValidDataTypes.Contains(normalized))
            throw new ArgumentException($"dataType must be one of: {string.Join(", ", ValidDataTypes)}.", nameof(dataType));
        return normalized;
    }

    /// <summary>Validates isFilterable/filterType consistency against the currently registered filter strategies,
    /// so a newly-added ISpecFilterStrategy automatically expands the accepted set without a code change here.</summary>
    public static string? ValidateFilterType(bool isFilterable, string? filterType, IReadOnlyCollection<string> supportedFilterTypes)
    {
        if (!isFilterable)
        {
            if (!string.IsNullOrWhiteSpace(filterType))
                throw new ArgumentException("filterType must be null when isFilterable is false.", nameof(filterType));
            return null;
        }

        var normalized = filterType?.Trim().ToLowerInvariant() ?? string.Empty;
        if (normalized.Length == 0 || !supportedFilterTypes.Contains(normalized))
            throw new ArgumentException($"filterType is required and must be one of: {string.Join(", ", supportedFilterTypes)}.", nameof(filterType));
        return normalized;
    }
}
