namespace Motorcycle.Application.DTOs;

/// <summary>One spreadsheet row. Cell values keep their raw spreadsheet type (string, double, bool, DateTime or null).</summary>
public sealed record BikeImportRow(
    int RowNumber,
    object? Id,
    object? Brand,
    object? Model,
    object? VariantName,
    object? Year,
    object? MsrpPrice,
    Dictionary<string, object?> Specs);

/// <summary>SpecCodes lists the specification columns present in the file; a blank cell in one of them clears that spec.</summary>
public sealed record BikeImportRequest(IReadOnlyList<string> SpecCodes, IReadOnlyList<BikeImportRow> Rows, int HeaderRow = 1);

public sealed record BikeImportError(int Row, string Column, string Message);

public sealed record BikeImportResultDto(int Created, int Updated, int Unchanged);

public sealed record BikeExportColumnDto(string Code, string Label, string DataType, string? Unit, string GroupName);

public sealed record BikeExportDto(IReadOnlyList<BikeExportColumnDto> Columns, IReadOnlyList<BikeSpecGridRowDto> Rows);

public sealed class BikeImportValidationException : Exception
{
    public IReadOnlyList<BikeImportError> Errors { get; }

    public BikeImportValidationException(IReadOnlyList<BikeImportError> errors)
        : base($"The import file has {errors.Count} validation error(s). No changes were saved.") => Errors = errors;
}
