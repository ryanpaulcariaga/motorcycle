using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Motorcycle.Application.DTOs;

namespace Motorcycle.Api.Services;

/// <summary>Builds and reads the Excel workbook used for bulk bike export/import.</summary>
public static class BikeWorkbook
{
    public const string ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public const string BikesSheet = "Bikes";
    private const int GroupRow = 1;
    private const int HeaderRow = 2;
    private const int TypeRow = 3;
    private const int SampleRow = 4;
    private const int FirstDataRow = 5;
    private const string TypeRowLabel = "TYPE (not data)";
    private const string SampleRowLabel = "SAMPLE (not data)";

    private static readonly string[] CoreHeaders = { "Id", "Brand", "Model", "Category", "Variant Name", "Year", "MSRP Price", "Published" };
    private static readonly string[] RequiredHeaders = { "Id", "Brand", "Model", "Variant Name", "Year", "MSRP Price" };
    private static readonly Regex CodePattern = new(@"\[([^\[\]]+)\]\s*$", RegexOptions.Compiled);

    public static byte[] Build(BikeExportDto export)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(BikesSheet);

        for (var i = 0; i < CoreHeaders.Length; i++) {
            sheet.Cell(HeaderRow, i + 1).Value = CoreHeaders[i];
        }

        sheet.Cell(GroupRow, 1).Value = "Bike details";
        for (var i = 0; i < export.Columns.Count; i++) {
            var column = export.Columns[i];
            sheet.Cell(GroupRow, CoreHeaders.Length + i + 1).Value = column.GroupName;
            sheet.Cell(HeaderRow, CoreHeaders.Length + i + 1).Value = $"{column.Label} [{column.Code}]";
        }

        var lastColumn = CoreHeaders.Length + export.Columns.Count;
        var groupBand = sheet.Range(GroupRow, 1, GroupRow, lastColumn);
        groupBand.Style.Font.Bold = true;
        groupBand.Style.Fill.BackgroundColor = XLColor.FromHtml("#C9A227");
        var header = sheet.Range(HeaderRow, 1, HeaderRow, lastColumn);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F2937");
        header.Style.Font.FontColor = XLColor.White;
        // Category and Published are reference-only columns.
        sheet.Cell(HeaderRow, 4).Style.Fill.BackgroundColor = XLColor.Gray;
        sheet.Cell(HeaderRow, 8).Style.Fill.BackgroundColor = XLColor.Gray;

        // Rows 3-4 describe each column and are not data; the importer skips them.
        string[] coreTypes = { "Whole number, blank = new bike", "Text", "Text", "Reference only", "Text", "Whole number (0 = unknown)", "Number, optional", "Reference only" };
        string[] coreSamples = { "(sample) 123", "(sample) Kawasaki", "(sample) Ninja 400", "(sample) Sport", "(sample) ABS", "(sample) 2025", "(sample) 8999.00", "(sample) No" };
        sheet.Cell(TypeRow, 1).Value = TypeRowLabel;
        sheet.Cell(SampleRow, 1).Value = SampleRowLabel;
        for (var i = 0; i < CoreHeaders.Length; i++) {
            if (i > 0) {
                sheet.Cell(TypeRow, i + 1).Value = coreTypes[i];
            }

            if (i > 0) {
                sheet.Cell(SampleRow, i + 1).Value = coreSamples[i];
            }
        }

        for (var i = 0; i < export.Columns.Count; i++) {
            var column = export.Columns[i];
            var (typeText, sample) = column.DataType switch
            {
                "number" => ($"Number{(string.IsNullOrWhiteSpace(column.Unit) ? string.Empty : $" ({column.Unit})")}", "(sample) 123.45"),
                "boolean" => ("Yes / No", "(sample) Yes"),
                "enum" => ("Text (one of the allowed values)", "(sample) Option"),
                _ => ("Text", "(sample) Some text")
            };
            sheet.Cell(TypeRow, CoreHeaders.Length + i + 1).Value = typeText;
            sheet.Cell(SampleRow, CoreHeaders.Length + i + 1).Value = sample;
        }

        var typeBand = sheet.Range(TypeRow, 1, TypeRow, lastColumn);
        typeBand.Style.Font.Italic = true;
        typeBand.Style.Fill.BackgroundColor = XLColor.FromHtml("#FDE68A");
        typeBand.Style.Font.FontColor = XLColor.FromHtml("#78350F");
        var sampleBand = sheet.Range(SampleRow, 1, SampleRow, lastColumn);
        sampleBand.Style.Font.Italic = true;
        sampleBand.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF3C7");
        sampleBand.Style.Font.FontColor = XLColor.FromHtml("#92400E");
        sampleBand.Style.Border.BottomBorder = XLBorderStyleValues.Medium;

        var rowNumber = FirstDataRow;
        foreach (var bike in export.Rows) {
            sheet.Cell(rowNumber, 1).Value = bike.Id;
            sheet.Cell(rowNumber, 2).Value = bike.BrandName;
            sheet.Cell(rowNumber, 3).Value = bike.ModelName;
            sheet.Cell(rowNumber, 4).Value = bike.CategoryName;
            sheet.Cell(rowNumber, 5).Value = bike.VariantName;
            sheet.Cell(rowNumber, 6).Value = bike.Year;
            if (bike.MsrpPrice.HasValue) {
                sheet.Cell(rowNumber, 7).Value = bike.MsrpPrice.Value;
            }

            sheet.Cell(rowNumber, 8).Value = bike.IsPublished ? "Yes" : "No";
            for (var i = 0; i < export.Columns.Count; i++) {
                if (bike.Specs.TryGetValue(export.Columns[i].Code, out var value) && value is not null) {
                    WriteSpec(sheet.Cell(rowNumber, CoreHeaders.Length + i + 1), value);
                }
            }

            rowNumber++;
        }

        // Yes/No lists keep boolean columns clean, including rows the user appends below the export.
        var lastRow = Math.Max(rowNumber - 1, FirstDataRow);
        for (var i = 0; i < export.Columns.Count; i++) {
            if (export.Columns[i].DataType == "boolean") {
                var column = CoreHeaders.Length + i + 1;
                sheet.Range(FirstDataRow, column, lastRow + 1000, column).CreateDataValidation().List("\"Yes,No\"", true);
            }
        }

        sheet.SheetView.FreezeRows(FirstDataRow - 1);
        sheet.SheetView.FreezeColumns(5);
        sheet.Columns(1, CoreHeaders.Length).AdjustToContents(1, Math.Min(lastRow, 200));
        sheet.Columns(CoreHeaders.Length + 1, lastColumn).Width = 22;

        AddGuide(workbook, export);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteSpec(IXLCell cell, object value)
    {
        switch (value) {
            case JsonElement { ValueKind: JsonValueKind.Number } number:
                cell.Value = number.GetDouble();
                break;
            case JsonElement { ValueKind: JsonValueKind.True }:
                cell.Value = "Yes";
                break;
            case JsonElement { ValueKind: JsonValueKind.False }:
                cell.Value = "No";
                break;
            case JsonElement element:
                cell.Value = element.ToString();
                break;
            case bool flag:
                cell.Value = flag ? "Yes" : "No";
                break;
            case int or long or float or double or decimal:
                cell.Value = Convert.ToDouble(value);
                break;
            default:
                cell.Value = value.ToString();
                break;
        }
    }

    private static void AddGuide(XLWorkbook workbook, BikeExportDto export)
    {
        var guide = workbook.Worksheets.Add("Guide");
        var lines = new[]
        {
            "How to use this file",
            "Edit the 'Bikes' sheet, save it, then use Import in Bikes Bulk Edit. Rows 1-4 (spec group, headers, TYPE, SAMPLE) are not data: keep them in place; the TYPE and SAMPLE rows are skipped on import. Your data starts on row 5.",
            "Id filled in: the existing bike with that Id is updated.",
            "Id blank: a new (unpublished) bike is added. Brand, Model, Variant Name and Year are required.",
            "Brand and Model must match an existing Bikes Model (case-insensitive).",
            "Year is a whole number (0 if unknown). MSRP Price is a number, or blank.",
            "A blank specification cell clears that spec for an existing bike.",
            "Boolean specs use Yes or No. Number specs must be numeric. Do not change the [code] in headers (the label before it may be renamed).",
            "Columns that are not specifications (or whose [code] was edited) are rejected. To add a new spec, create it under Specifications first, then export again.",
            "Category and Published columns are for reference only and are ignored on import.",
            "The import is all-or-nothing: if any row is invalid, nothing is saved and every error is listed."
        };
        for (var i = 0; i < lines.Length; i++) {
            guide.Cell(i + 1, 1).Value = lines[i];
        }

        guide.Cell(1, 1).Style.Font.Bold = true;
        var start = lines.Length + 2;
        string[] headers = { "Group", "Column", "Code", "Type", "Unit" };
        for (var i = 0; i < headers.Length; i++) {
            guide.Cell(start, i + 1).Value = headers[i];
            guide.Cell(start, i + 1).Style.Font.Bold = true;
        }

        for (var i = 0; i < export.Columns.Count; i++) {
            var column = export.Columns[i];
            guide.Cell(start + 1 + i, 1).Value = column.GroupName;
            guide.Cell(start + 1 + i, 2).Value = column.Label;
            guide.Cell(start + 1 + i, 3).Value = column.Code;
            guide.Cell(start + 1 + i, 4).Value = column.DataType;
            guide.Cell(start + 1 + i, 5).Value = column.Unit ?? string.Empty;
        }

        guide.Column(1).Width = 40;
    }

    /// <summary>Reads an uploaded workbook. Throws <see cref="BikeImportValidationException"/> for an unreadable file or bad header row.</summary>
    public static BikeImportRequest Read(Stream stream)
    {
        XLWorkbook workbook;
        try {
            workbook = new XLWorkbook(stream);
        }
        catch (Exception) {
            throw Fail("The file is not a valid .xlsx workbook.");
        }

        using (workbook) {
            var sheet = workbook.Worksheets.FirstOrDefault(s => s.Name.Equals(BikesSheet, StringComparison.OrdinalIgnoreCase))
                ?? workbook.Worksheets.FirstOrDefault()
                ?? throw Fail("The workbook has no worksheets.");

            var lastColumn = sheet.LastColumnUsed()?.ColumnNumber() ?? 0;
            var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 0;

            // Exports start with a spec-group band above the headers; plain files may start with the headers.
            var headerRow = Enumerable.Range(1, 2).FirstOrDefault(r =>
                Enumerable.Range(1, lastColumn).Any(c => sheet.Cell(r, c).GetString().Trim().Equals("Variant Name", StringComparison.OrdinalIgnoreCase)));
            if (headerRow == 0) {
                headerRow = 1;
            }

            if (lastRow <= headerRow) {
                throw Fail("The sheet has no data rows.");
            }

            var errors = new List<BikeImportError>();
            var coreColumns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var specColumns = new List<(string Code, int Column)>();
            var seenCodes = new HashSet<string>(StringComparer.Ordinal);
            for (var column = 1; column <= lastColumn; column++) {
                var title = sheet.Cell(headerRow, column).GetString().Trim();
                if (title.Length == 0) {
                    continue;
                }

                var core = CoreHeaders.FirstOrDefault(h => h.Equals(title, StringComparison.OrdinalIgnoreCase));
                if (core is not null) {
                    if (!coreColumns.TryAdd(core, column)) {
                        errors.Add(new BikeImportError(headerRow, title, $"Column '{title}' appears more than once."));
                    }

                    continue;
                }

                var match = CodePattern.Match(title);
                var code = match.Success ? match.Groups[1].Value.Trim() : title;
                if (!seenCodes.Add(code)) {
                    errors.Add(new BikeImportError(headerRow, title, $"Specification column '{code}' appears more than once."));
                }
                else {
                    specColumns.Add((code, column));
                }
            }

            foreach (var required in RequiredHeaders.Where(h => !coreColumns.ContainsKey(h))) {
                errors.Add(new BikeImportError(headerRow, required, $"Required column '{required}' is missing."));
            }

            if (errors.Count > 0) {
                throw new BikeImportValidationException(errors);
            }

            var rows = new List<BikeImportRow>();
            var firstData = headerRow + 1;
            // Skip the TYPE / SAMPLE description rows that exports place under the headers.
            while (firstData <= lastRow && IsDescriptionRow(sheet.Cell(firstData, coreColumns["Id"]).GetString())) {
                firstData++;
            }

            for (var rowNumber = firstData; rowNumber <= lastRow; rowNumber++) {
                var cells = Enumerable.Range(1, lastColumn).Select(c => ReadCell(sheet.Cell(rowNumber, c))).ToArray();
                if (cells.All(IsBlank)) {
                    continue;
                }

                object? Core(string name) => cells[coreColumns[name] - 1];
                rows.Add(new BikeImportRow(
                    rowNumber,
                    Core("Id"),
                    Core("Brand"),
                    Core("Model"),
                    Core("Variant Name"),
                    Core("Year"),
                    Core("MSRP Price"),
                    specColumns.ToDictionary(s => s.Code, s => cells[s.Column - 1])));
            }

            return new BikeImportRequest(specColumns.Select(s => s.Code).ToList(), rows, headerRow);
        }
    }

    private static bool IsDescriptionRow(string idCell) =>
        idCell.Trim().Equals(TypeRowLabel, StringComparison.OrdinalIgnoreCase)
        || idCell.Trim().Equals(SampleRowLabel, StringComparison.OrdinalIgnoreCase);

    private static object? ReadCell(IXLCell cell)
    {
        var value = cell.Value;
        if (value.IsBlank) {
            return null;
        }

        if (value.IsBoolean) {
            return value.GetBoolean();
        }

        if (value.IsNumber) {
            return value.GetNumber();
        }

        if (value.IsDateTime) {
            return value.GetDateTime();
        }

        return value.IsText ? value.GetText() : cell.GetString();
    }

    private static bool IsBlank(object? value) => value is null || (value is string s && string.IsNullOrWhiteSpace(s));

    private static BikeImportValidationException Fail(string message) =>
        new(new[] { new BikeImportError(0, "File", message) });
}
