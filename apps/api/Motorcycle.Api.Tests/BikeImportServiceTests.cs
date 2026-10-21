using Motorcycle.Api.Services;
using Motorcycle.Api.Tests.Fakes;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Services;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public class BikeImportServiceTests
{
    private static (BikeImportService Service, FakeBikeAdminRepository Repository) CreateService()
    {
        var repository = new FakeBikeAdminRepository();
        return (new BikeImportService(repository, new FakeBikeModelRepository(), new FakeSpecGroupRepository()), repository);
    }

    private static async Task<Bike> AddBikeAsync(FakeBikeAdminRepository repository, string variant)
    {
        var bike = new Bike
        {
            ModelId = 1,
            VariantName = variant,
            Year = 2024,
            Slug = $"kawasaki-ninja-400-{variant.ToLowerInvariant()}-2024",
            Specs = new() { ["engine_displacement_cc"] = 399, ["abs"] = true }
        };
        await repository.AddAsync(bike);
        return bike;
    }

    private static BikeImportRow Row(int number, object? id, string variant, object? year = null, Dictionary<string, object?>? specs = null) =>
        new(number, id, "Kawasaki", "Ninja 400", variant, year ?? 2025.0, 8999.0, specs ?? new());

    private static BikeImportRequest Request(params BikeImportRow[] rows) =>
        new(new[] { "engine_displacement_cc", "abs" }, rows);

    [Fact]
    public async Task ImportAsync_InsertsBlankIdAndUpdatesExistingId()
    {
        var (service, repository) = CreateService();
        var existing = await AddBikeAsync(repository, "Base");

        var result = await service.ImportAsync(Request(
            Row(2, (double)existing.Id, "Base", 2024.0, new() { ["engine_displacement_cc"] = 451.0, ["abs"] = "No" }),
            Row(3, null, "SE", 2025.0, new() { ["engine_displacement_cc"] = "398", ["abs"] = "Yes" })));

        Assert.Equal(new BikeImportResultDto(1, 1, 0), result);
        Assert.Equal(451L, existing.Specs["engine_displacement_cc"]);
        Assert.Equal(false, existing.Specs["abs"]);
        Assert.Equal(8999m, existing.MsrpPrice);
        var created = repository.Bikes.Single(b => b.VariantName == "SE");
        Assert.False(created.IsPublished);
        Assert.Equal(398L, created.Specs["engine_displacement_cc"]);
        Assert.Equal("kawasaki-ninja-400-se-2025", created.Slug);
    }

    [Fact]
    public async Task ImportAsync_BlankSpecCellClearsSpecAndUnchangedRowIsCounted()
    {
        var (service, repository) = CreateService();
        var existing = await AddBikeAsync(repository, "Base");

        var cleared = await service.ImportAsync(Request(
            new BikeImportRow(2, (double)existing.Id, "Kawasaki", "Ninja 400", "Base", 2024.0, 8999.0, new() { ["abs"] = null })));
        Assert.Equal(1, cleared.Updated);
        Assert.False(existing.Specs.ContainsKey("abs"));

        var same = await service.ImportAsync(Request(
            new BikeImportRow(2, (double)existing.Id, "Kawasaki", "Ninja 400", "Base", 2024.0, 8999.0, new() { ["abs"] = null })));
        Assert.Equal(1, same.Unchanged);
    }

    [Fact]
    public async Task ImportAsync_CollectsEveryErrorAndSavesNothing()
    {
        var (service, repository) = CreateService();
        var existing = await AddBikeAsync(repository, "Base");

        var ex = await Assert.ThrowsAsync<BikeImportValidationException>(() => service.ImportAsync(Request(
            Row(2, (double)existing.Id, "Base", 2024.0, new() { ["engine_displacement_cc"] = "lots" }),
            Row(3, 999.0, "Ghost"),
            Row(4, null, "Bad Year", "abc"),
            Row(5, null, "Bad Bool", 2025.0, new() { ["abs"] = "maybe" }),
            new BikeImportRow(6, null, "Honda", "Nope", "X", 2025.0, null, new()),
            Row(7, null, "Neg", 2025.0) with { MsrpPrice = -5.0 })));

        Assert.Equal(6, ex.Errors.Select(e => e.Row).Distinct().Count());
        Assert.Equal(399, existing.Specs["engine_displacement_cc"]);
        Assert.Single(repository.Bikes);
    }

    [Fact]
    public async Task ImportAsync_RejectsDuplicateIdsAndDuplicateVariants()
    {
        var (service, repository) = CreateService();
        var existing = await AddBikeAsync(repository, "Base");
        await AddBikeAsync(repository, "Keep");

        var ex = await Assert.ThrowsAsync<BikeImportValidationException>(() => service.ImportAsync(Request(
            Row(2, (double)existing.Id, "Base", 2024.0),
            Row(3, (double)existing.Id, "Other", 2024.0),
            Row(4, null, "Twin"),
            Row(5, null, "twin"),
            Row(6, null, "Keep", 2024.0))));

        Assert.Contains(ex.Errors, e => e.Row == 3 && e.Message.Contains("more than once"));
        Assert.Contains(ex.Errors, e => e.Row == 5 && e.Message.Contains("Duplicates row 4"));
        Assert.Contains(ex.Errors, e => e.Row == 6 && e.Message.Contains("already exists"));
    }

    [Fact]
    public async Task ImportAsync_RejectsUnknownSpecColumn()
    {
        var (service, _) = CreateService();
        var ex = await Assert.ThrowsAsync<BikeImportValidationException>(() => service.ImportAsync(
            new BikeImportRequest(new[] { "nope" }, new[] { Row(2, null, "A") })));
        Assert.Contains(ex.Errors, e => e.Message.Contains("not a known specification"));
    }

    [Fact]
    public async Task Workbook_ReadsGroupBandAndRejectsEditedOrNewColumns()
    {
        var (service, repository) = CreateService();
        await AddBikeAsync(repository, "Base");
        repository.Bikes[0].Model = new BikeModel { Id = 1, Name = "Ninja 400", Brand = new Brand { Name = "Kawasaki" }, Category = new Category { Name = "Sport" } };
        var bytes = BikeWorkbook.Build(await service.GetExportAsync(null, null, null, null));

        using var stream = new MemoryStream(bytes);
        using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
        var sheet = workbook.Worksheet("Bikes");
        Assert.Equal("Engine", sheet.Cell(1, 9).GetString());
        sheet.Cell(2, 9).Value = "Cubic capacity [engine_displacement_cc]"; // renamed label: still accepted
        sheet.Cell(2, 10).Value = "ABS [abz]"; // edited code: rejected
        sheet.Cell(2, 11).Value = "Brand new column"; // not a spec: rejected
        sheet.Cell(3, 11).Value = "x";
        using var edited = new MemoryStream();
        workbook.SaveAs(edited);
        edited.Position = 0;

        var request = BikeWorkbook.Read(edited);
        Assert.Equal(2, request.HeaderRow);
        var ex = await Assert.ThrowsAsync<BikeImportValidationException>(() => service.ImportAsync(request));
        Assert.Equal(2, ex.Errors.Count(e => e.Row == 2 && e.Message.Contains("not a known specification")));
    }

    [Fact]
    public async Task Workbook_RoundTripsExportThroughImport()
    {
        var (service, repository) = CreateService();
        await AddBikeAsync(repository, "Base");
        var bike = repository.Bikes[0];
        bike.Model = new BikeModel { Id = 1, Name = "Ninja 400", Brand = new Brand { Name = "Kawasaki" }, Category = new Category { Name = "Sport" } };

        var export = await service.GetExportAsync(null, null, null, null);
        var bytes = BikeWorkbook.Build(export);
        using var stream = new MemoryStream(bytes);
        var request = BikeWorkbook.Read(stream);

        Assert.Single(request.Rows);
        Assert.Equal(bike.Id, (int)(double)request.Rows[0].Id!);
        var result = await service.ImportAsync(request);
        Assert.Equal(new BikeImportResultDto(0, 0, 1), result);
    }
}
