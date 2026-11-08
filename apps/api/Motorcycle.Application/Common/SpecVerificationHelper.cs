using System.Globalization;
using System.Text.Json;
using Motorcycle.Application.DTOs;
using Motorcycle.Domain;

namespace Motorcycle.Application.Common;

public static class SpecVerificationHelper
{
    public static bool ValuesEqual(object? left, object? right) => Canonical(left) == Canonical(right);

    public static bool SpecsChanged(IReadOnlyDictionary<string, object> oldSpecs, IReadOnlyDictionary<string, object> newSpecs) =>
        oldSpecs.Keys.Union(newSpecs.Keys).Any(code =>
            !ValuesEqual(oldSpecs.GetValueOrDefault(code), newSpecs.GetValueOrDefault(code)));

    public static bool ChangesVerification(Bike bike, IEnumerable<SpecVerificationUpdate> changes) =>
        changes.Any(change =>
        {
            var existing = bike.SpecVerifications.FirstOrDefault(v => v.SpecDefinition.Code == change.SpecCode);
            return change.IsVerified != (existing is not null)
                || (existing is not null && change.IsVerified
                    && existing.SourceUrl != (string.IsNullOrWhiteSpace(change.SourceUrl) ? null : change.SourceUrl.Trim()));
        });

    public static void UpdateReviewed(Bike bike)
    {
        var populatedCodes = bike.Specs.Where(pair => HasValue(pair.Value)).Select(pair => pair.Key).ToList();
        var verifiedCodes = bike.SpecVerifications.Select(v => v.SpecDefinition.Code).ToHashSet();
        bike.IsReviewed = populatedCodes.Count > 0 && populatedCodes.All(verifiedCodes.Contains);
    }

    private static bool HasValue(object? value) =>
        value is not null
        && (value is not string text || !string.IsNullOrWhiteSpace(text))
        && (value is not JsonElement element || element.ValueKind != JsonValueKind.Null
            && (element.ValueKind != JsonValueKind.String || !string.IsNullOrWhiteSpace(element.GetString())));

    private static string Canonical(object? value)
    {
        if (value is JsonElement element) {
            return element.ValueKind switch
            {
                JsonValueKind.Null => "null",
                JsonValueKind.Number => element.TryGetDecimal(out var number)
                    ? "number:" + number.ToString("G29", CultureInfo.InvariantCulture)
                    : "number:" + element.GetDouble().ToString("R", CultureInfo.InvariantCulture),
                JsonValueKind.String => "string:" + element.GetString(),
                JsonValueKind.True => "bool:true",
                JsonValueKind.False => "bool:false",
                _ => element.GetRawText()
            };
        }

        return value switch
        {
            null => "null",
            bool b => b ? "bool:true" : "bool:false",
            string s => "string:" + s,
            byte or short or int or long or decimal =>
                "number:" + Convert.ToDecimal(value, CultureInfo.InvariantCulture).ToString("G29", CultureInfo.InvariantCulture),
            float or double => CanonicalFloatingPoint(Convert.ToDouble(value, CultureInfo.InvariantCulture)),
            _ => JsonSerializer.Serialize(value)
        };
    }

    private static string CanonicalFloatingPoint(double value)
    {
        var text = value.ToString("R", CultureInfo.InvariantCulture);
        if (decimal.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var number)) {
            return "number:" + number.ToString("G29", CultureInfo.InvariantCulture);
        }
        return "number:" + text;
    }

    public static void Invalidate(Bike bike, IReadOnlyDictionary<string, object> newSpecs, bool identityChanged, ISet<string>? reconfirmed = null)
    {
        foreach (var verification in bike.SpecVerifications.ToList()) {
            var code = verification.SpecDefinition.Code;
            bike.Specs.TryGetValue(code, out var previous);
            newSpecs.TryGetValue(code, out var current);
            if (identityChanged || !ValuesEqual(previous, current)) {
                if (reconfirmed?.Contains(code) == true) {
                    verification.VerifiedAt = DateTime.UtcNow;
                }
                else {
                    bike.SpecVerifications.Remove(verification);
                }
            }
        }
    }

    public static void Reset(Bike bike, IEnumerable<SpecVerificationUpdate> changes)
    {
        var reconfirmed = changes.Where(change => change.IsVerified).Select(change => change.SpecCode).ToHashSet();
        foreach (var verification in bike.SpecVerifications.ToList()) {
            if (reconfirmed.Contains(verification.SpecDefinition.Code)) {
                verification.SourceUrl = null;
                verification.VerifiedAt = DateTime.UtcNow;
            }
            else {
                bike.SpecVerifications.Remove(verification);
            }
        }
    }

    public static void ValidateChanges(
        IEnumerable<SpecVerificationUpdate> changes,
        IReadOnlyDictionary<string, SpecDefinition> definitions,
        IReadOnlyDictionary<string, object> specs)
    {
        var seen = new HashSet<string>();
        foreach (var change in changes) {
            if (string.IsNullOrWhiteSpace(change.SpecCode) || !definitions.ContainsKey(change.SpecCode) || !seen.Add(change.SpecCode)) {
                throw new ArgumentException("Each verification must have a unique, recognized specification code.");
            }
            if (change.IsVerified && (!specs.TryGetValue(change.SpecCode, out var value) || !HasValue(value))) {
                throw new ArgumentException($"A value is required to verify '{change.SpecCode}'.");
            }
            if (!string.IsNullOrWhiteSpace(change.SourceUrl)
                && (change.SourceUrl.Length > 2048 || !Uri.TryCreate(change.SourceUrl.Trim(), UriKind.Absolute, out var uri)
                    || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))) {
                throw new ArgumentException("Source URL must be an absolute HTTP or HTTPS URL of at most 2048 characters.");
            }
        }
    }

    public static void Apply(Bike bike, IEnumerable<SpecVerificationUpdate> changes, IReadOnlyDictionary<string, SpecDefinition> definitions)
    {
        foreach (var change in changes) {
            var definition = definitions[change.SpecCode];
            var existing = bike.SpecVerifications.FirstOrDefault(v => v.SpecDefinitionId == definition.Id);
            if (!change.IsVerified) {
                if (existing is not null) {
                    bike.SpecVerifications.Remove(existing);
                }
                continue;
            }

            var url = string.IsNullOrWhiteSpace(change.SourceUrl) ? null : change.SourceUrl.Trim();
            if (existing is null) {
                bike.SpecVerifications.Add(new BikeSpecVerification
                {
                    BikeId = bike.Id,
                    SpecDefinitionId = definition.Id,
                    SpecDefinition = definition,
                    SourceUrl = url,
                    VerifiedAt = DateTime.UtcNow
                });
            }
            else if (existing.SourceUrl != url) {
                existing.SourceUrl = url;
                existing.VerifiedAt = DateTime.UtcNow;
            }
        }
    }

    public static Dictionary<string, SpecVerificationDto> ToDto(Bike bike, IReadOnlyDictionary<string, SpecDefinition>? definitions = null)
    {
        var codes = definitions?.Values.ToDictionary(d => d.Id, d => d.Code);
        return bike.SpecVerifications.ToDictionary(
            v => v.SpecDefinition?.Code ?? codes![v.SpecDefinitionId],
            v => new SpecVerificationDto(v.SourceUrl, v.VerifiedAt));
    }
}
