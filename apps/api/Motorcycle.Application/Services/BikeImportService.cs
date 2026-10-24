using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Motorcycle.Application.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class BikeImportService : IBikeImportService
{
    public const int MaxRows = 5000;
    private const int MaxTextLength = 1000;
    private const int MaxYear = 2100;

    private readonly IBikeAdminRepository _repository;
    private readonly IBikeModelRepository _bikeModelRepository;
    private readonly ISpecGroupRepository _specGroupRepository;

    public BikeImportService(IBikeAdminRepository repository, IBikeModelRepository bikeModelRepository, ISpecGroupRepository specGroupRepository)
    {
        _repository = repository;
        _bikeModelRepository = bikeModelRepository;
        _specGroupRepository = specGroupRepository;
    }

    private sealed record ParsedRow(
        BikeImportRow Source,
        int? BikeId,
        BikeModel? Model,
        string? VariantName,
        int? Year,
        decimal? MsrpPrice,
        Dictionary<string, object?> Specs);

    public async Task<BikeExportDto> GetExportAsync(
        int? brandId,
        int? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        CancellationToken ct = default,
        string? sortBy = null,
        string sortDirection = "asc")
    {
        var specGroups = await _specGroupRepository.GetAllWithDefinitionsAsync(ct);
        var definitions = specGroups
            .SelectMany(g => g.Definitions)
            .ToDictionary(d => d.Code, d => d);
        var columns = specGroups
            .OrderBy(g => g.SortOrder)
            .SelectMany(g => g.Definitions.OrderBy(d => d.SortOrder).Select(d => new BikeExportColumnDto(d.Code, d.Label, d.DataType, d.Unit, g.Name)))
            .ToList();
        var bikes = await _repository.GetForSpecEditAsync(brandId, categoryId, minPrice, maxPrice, ct);
        var rows = bikes.Select(b => new BikeSpecGridRowDto(
            b.Id,
            b.Model?.Name ?? string.Empty,
            b.Model?.Brand?.Name ?? string.Empty,
            b.Model?.Category?.Name ?? string.Empty,
            b.VariantName,
            b.Year,
            b.MsrpPrice,
            b.IsPublished,
            b.Specs.ToDictionary(s => s.Key, s => (object?)s.Value))).ToList();
        rows = BikeSpecGridSorter.Sort(rows, sortBy, sortDirection, definitions).ToList();
        return new BikeExportDto(columns, rows);
    }

    public async Task<BikeImportResultDto> ImportAsync(BikeImportRequest request, CancellationToken ct = default)
    {
        var errors = new List<BikeImportError>();
        if (request.Rows.Count == 0) {
            throw new BikeImportValidationException(new[] { new BikeImportError(0, "File", "The file contains no data rows.") });
        }

        if (request.Rows.Count > MaxRows) {
            throw new BikeImportValidationException(new[] { new BikeImportError(0, "File", $"The file contains more than {MaxRows} rows.") });
        }

        var definitions = (await _specGroupRepository.GetAllWithDefinitionsAsync(ct))
            .SelectMany(g => g.Definitions)
            .ToDictionary(d => d.Code, d => d);
        foreach (var code in request.SpecCodes.Where(c => !definitions.ContainsKey(c))) {
            errors.Add(new BikeImportError(request.HeaderRow, code, $"Column '{code}' is not a known specification. Spec columns must keep their [code] header; to add a new specification, create it under Specifications first and export again."));
        }

        var models = await _bikeModelRepository.GetAllAsync(ct);
        var modelLookup = models
            .GroupBy(m => ModelKey(m.Brand?.Name, m.Name))
            .ToDictionary(g => g.Key, g => g.First());
        var allBikes = await _repository.GetAllAsync(null, ct);
        var bikesById = allBikes.ToDictionary(b => b.Id);

        var parsedRows = new List<ParsedRow>();
        var seenIds = new HashSet<int>();
        foreach (var row in request.Rows) {
            var parsed = ParseRow(row, definitions, request.SpecCodes, modelLookup, bikesById, seenIds, errors);
            if (parsed is not null) {
                parsedRows.Add(parsed);
            }
        }

        CheckDuplicates(parsedRows, allBikes, errors);

        if (errors.Count > 0) {
            throw new BikeImportValidationException(errors.OrderBy(e => e.Row).ThenBy(e => e.Column).ToList());
        }

        return await ApplyAsync(parsedRows, allBikes, bikesById, ct);
    }

    private ParsedRow? ParseRow(
        BikeImportRow row,
        IReadOnlyDictionary<string, SpecDefinition> definitions,
        IReadOnlyList<string> specCodes,
        IReadOnlyDictionary<string, BikeModel> modelLookup,
        IReadOnlyDictionary<int, Bike> bikesById,
        HashSet<int> seenIds,
        List<BikeImportError> errors)
    {
        var before = errors.Count;
        void Fail(string column, string message) => errors.Add(new BikeImportError(row.RowNumber, column, message));

        int? bikeId = null;
        if (!IsBlank(row.Id)) {
            if (!TryParseInt(row.Id, out var id) || id <= 0) {
                Fail("Id", "Id must be a positive whole number, or blank to add a new bike.");
            }
            else if (!bikesById.ContainsKey(id)) {
                Fail("Id", $"Bike {id} does not exist. Leave Id blank to add a new bike.");
            }
            else if (!seenIds.Add(id)) {
                Fail("Id", $"Id {id} appears more than once in the file.");
            }
            else {
                bikeId = id;
            }
        }

        var brandName = ToText(row.Brand);
        var modelName = ToText(row.Model);
        BikeModel? model = null;
        if (brandName is null && modelName is null) {
            if (bikeId is null) {
                Fail("Brand", "Brand and Model are required for a new bike.");
            }
        }
        else if (brandName is null || modelName is null) {
            Fail(brandName is null ? "Brand" : "Model", "Brand and Model must both be provided.");
        }
        else if (!modelLookup.TryGetValue(ModelKey(brandName, modelName), out model)) {
            Fail("Model", $"Model '{brandName} {modelName}' does not exist. Create it under Bikes Model first.");
        }

        string? variantName = null;
        var variantText = ToText(row.VariantName);
        if (variantText is null) {
            Fail("Variant Name", "Variant name is required.");
        }
        else {
            try {
                variantName = BikeValidators.ValidateCore(variantText, 0).VariantName;
            }
            catch (ArgumentException ex) {
                Fail("Variant Name", ex.Message.Split(" (Parameter")[0]);
            }
        }

        int? year = null;
        if (IsBlank(row.Year)) {
            Fail("Year", "Year is required (use 0 if unknown).");
        }
        else if (!TryParseInt(row.Year, out var parsedYear) || parsedYear < 0 || parsedYear > MaxYear) {
            Fail("Year", $"Year must be a whole number between 0 and {MaxYear}.");
        }
        else {
            year = parsedYear;
        }

        decimal? price = null;
        if (!IsBlank(row.MsrpPrice)) {
            if (!TryParseNumber(row.MsrpPrice, out var parsedPrice) || parsedPrice < 0 || parsedPrice > 999_999_999_999m) {
                Fail("MSRP Price", "MSRP price must be a number that is zero or greater.");
            }
            else {
                price = Math.Round(parsedPrice, 2);
            }
        }

        var specs = new Dictionary<string, object?>();
        foreach (var code in specCodes.Where(definitions.ContainsKey)) {
            row.Specs.TryGetValue(code, out var raw);
            var definition = definitions[code];
            var column = $"{definition.Label} [{code}]";
            if (IsBlank(raw)) {
                specs[code] = null;
            }
            else if (TryCoerceSpec(raw, definition, out var value, out var message)) {
                specs[code] = value;
            }
            else {
                Fail(column, message);
            }
        }

        return errors.Count == before ? new ParsedRow(row, bikeId, model, variantName, year, price, specs) : null;
    }

    private static void CheckDuplicates(List<ParsedRow> rows, List<Bike> allBikes, List<BikeImportError> errors)
    {
        var finalKeys = new Dictionary<(int ModelId, int Year, string Variant), int>();
        var changedIds = rows.Where(r => r.BikeId is not null).Select(r => r.BikeId!.Value).ToHashSet();
        foreach (var bike in allBikes.Where(b => !changedIds.Contains(b.Id))) {
            finalKeys[(bike.ModelId, bike.Year, bike.VariantName.ToLowerInvariant())] = bike.Id;
        }

        var bikesById = allBikes.ToDictionary(b => b.Id);
        var seenInFile = new Dictionary<(int, int, string), int>();
        foreach (var row in rows) {
            var existing = row.BikeId is int id ? bikesById[id] : null;
            var modelId = row.Model?.Id ?? existing!.ModelId;
            var key = (modelId, row.Year!.Value, row.VariantName!.ToLowerInvariant());
            if (seenInFile.TryGetValue(key, out var firstRow)) {
                errors.Add(new BikeImportError(row.Source.RowNumber, "Variant Name", $"Duplicates row {firstRow}: same brand, model, year and variant name."));
            }
            else if (finalKeys.ContainsKey(key)) {
                errors.Add(new BikeImportError(row.Source.RowNumber, "Variant Name", "A bike with this model, year, and variant name already exists."));
            }
            else {
                seenInFile[key] = row.Source.RowNumber;
            }
        }
    }

    private async Task<BikeImportResultDto> ApplyAsync(List<ParsedRow> rows, List<Bike> allBikes, IReadOnlyDictionary<int, Bike> bikesById, CancellationToken ct)
    {
        var usedSlugs = allBikes.Select(b => b.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        int created = 0, updated = 0, unchanged = 0;

        foreach (var row in rows) {
            if (row.BikeId is int id) {
                var bike = bikesById[id];
                var specs = new Dictionary<string, object>(bike.Specs);
                foreach (var (code, value) in row.Specs) {
                    if (value is null) {
                        specs.Remove(code);
                    }
                    else {
                        specs[code] = value;
                    }
                }

                var modelChanged = row.Model is not null && row.Model.Id != bike.ModelId;
                var changed = modelChanged
                    || bike.VariantName != row.VariantName
                    || bike.Year != row.Year
                    || bike.MsrpPrice != row.MsrpPrice
                    || !SpecsEqual(bike.Specs, specs);
                if (!changed) {
                    unchanged++;
                    continue;
                }

                if (modelChanged) {
                    var tracked = await _bikeModelRepository.GetByIdAsync(row.Model!.Id, ct)
                        ?? throw new KeyNotFoundException("BikeModel was not found.");
                    bike.ModelId = tracked.Id;
                    bike.Model = tracked;
                }

                bike.VariantName = row.VariantName!;
                bike.Year = row.Year!.Value;
                bike.MsrpPrice = row.MsrpPrice;
                bike.Specs = specs;
                bike.UpdatedAt = now;
                updated++;
            }
            else {
                var baseSlug = ToSlug($"{row.Model!.Brand?.Name} {row.Model.Name} {row.VariantName} {row.Year}");
                var slug = baseSlug;
                for (var suffix = 2; !usedSlugs.Add(slug); suffix++) {
                    slug = $"{baseSlug}-{suffix}";
                }

                await _repository.AddAsync(new Bike
                {
                    ModelId = row.Model.Id,
                    VariantName = row.VariantName!,
                    Year = row.Year!.Value,
                    MsrpPrice = row.MsrpPrice,
                    Specs = row.Specs.Where(kv => kv.Value is not null).ToDictionary(kv => kv.Key, kv => kv.Value!),
                    IsPublished = false,
                    Slug = slug
                }, ct);
                created++;
            }
        }

        await _repository.SaveChangesAsync(ct);
        return new BikeImportResultDto(created, updated, unchanged);
    }

    private static bool SpecsEqual(Dictionary<string, object> left, Dictionary<string, object> right) =>
        left.Count == right.Count
        && left.All(kv => right.TryGetValue(kv.Key, out var other) && Canonical(kv.Value) == Canonical(other));

    private static string Canonical(object value) => value switch
    {
        JsonElement { ValueKind: JsonValueKind.Number } je => je.GetDecimal().ToString(CultureInfo.InvariantCulture),
        JsonElement je => je.ToString(),
        bool b => b ? "True" : "False",
        IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
        _ => value.ToString() ?? string.Empty
    };

    private static bool TryCoerceSpec(object? raw, SpecDefinition definition, out object? value, out string message)
    {
        value = null;
        message = string.Empty;
        switch (definition.DataType)
        {
            case "number":
                if (TryParseNumber(raw, out var number)) {
                    value = number == Math.Truncate(number) && Math.Abs(number) < long.MaxValue ? (object)(long)number : (double)number;
                    return true;
                }

                message = $"Expected a number{(definition.Unit is null ? string.Empty : $" ({definition.Unit})")}, but found '{Display(raw)}'.";
                return false;
            case "boolean":
                if (TryParseBoolean(raw, out var flag)) {
                    value = flag;
                    return true;
                }

                message = $"Expected Yes/No (or TRUE/FALSE), but found '{Display(raw)}'.";
                return false;
            default:
                if (raw is string or double or int or long or decimal) {
                    var text = ToText(raw)!;
                    if (text.Length > MaxTextLength) {
                        message = $"Text cannot exceed {MaxTextLength} characters.";
                        return false;
                    }

                    value = text;
                    return true;
                }

                message = $"Expected text, but found '{Display(raw)}'.";
                return false;
        }
    }

    private static bool IsBlank(object? value) => value is null || (value is string s && string.IsNullOrWhiteSpace(s));

    private static string? ToText(object? value)
    {
        if (IsBlank(value)) {
            return null;
        }

        return value switch
        {
            string s => s.Trim(),
            IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
            _ => value!.ToString()?.Trim()
        };
    }

    private static string Display(object? value) => value switch
    {
        null => string.Empty,
        IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
        _ => value.ToString() ?? string.Empty
    };

    private static bool TryParseNumber(object? raw, out decimal number)
    {
        number = 0;
        switch (raw)
        {
            case double d when double.IsFinite(d) && Math.Abs(d) < 7.9e27:
                number = (decimal)d;
                return true;
            case int i:
                number = i;
                return true;
            case long l:
                number = l;
                return true;
            case decimal m:
                number = m;
                return true;
            case string s:
                return decimal.TryParse(s.Trim().Replace(",", string.Empty), NumberStyles.Float, CultureInfo.InvariantCulture, out number);
            default:
                return false;
        }
    }

    private static bool TryParseInt(object? raw, out int value)
    {
        value = 0;
        if (!TryParseNumber(raw, out var number) || number != Math.Truncate(number) || number > int.MaxValue || number < int.MinValue) {
            return false;
        }

        value = (int)number;
        return true;
    }

    private static bool TryParseBoolean(object? raw, out bool value)
    {
        value = false;
        switch (raw)
        {
            case bool b:
                value = b;
                return true;
            case double d when d is 0 or 1:
                value = d == 1;
                return true;
            case string s:
                switch (s.Trim().ToLowerInvariant())
                {
                    case "true" or "yes" or "y" or "1":
                        value = true;
                        return true;
                    case "false" or "no" or "n" or "0":
                        return true;
                }

                return false;
            default:
                return false;
        }
    }

    private static string ModelKey(string? brand, string? model) =>
        $"{brand?.Trim().ToLowerInvariant()}\u0001{model?.Trim().ToLowerInvariant()}";

    private static string ToSlug(string source) =>
        Regex.Replace(source.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
}
