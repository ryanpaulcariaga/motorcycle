using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Api.Services;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/bikes")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminBikesController : ControllerBase
{
    private readonly IBikeAdminService _service;
    private readonly IBikeImportService _importService;
    private const long MaxImportBytes = 5 * 1024 * 1024;

    public AdminBikesController(IBikeAdminService service, IBikeImportService importService)
    {
        _service = service;
        _importService = importService;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] int? brandId, [FromQuery] int? categoryId, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, CancellationToken ct)
    {
        if (brandId.HasValue && brandId <= 0) {
            return BadRequest(new { message = "Brand must be a positive ID." });
        }

        var export = await _importService.GetExportAsync(brandId, categoryId, minPrice, maxPrice, ct);
        return File(BikeWorkbook.Build(export), BikeWorkbook.ContentType, $"bikes-{DateTime.UtcNow:yyyyMMdd-HHmmss}.xlsx");
    }

    [HttpPost("import")]
    [RequestSizeLimit(MaxImportBytes + 1024 * 1024)]
    public async Task<IActionResult> Import(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) {
            return BadRequest(new { message = "Choose an .xlsx file to import." });
        }

        if (file.Length > MaxImportBytes || !file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)) {
            return BadRequest(new { message = "The file must be an .xlsx workbook no larger than 5 MB." });
        }

        try {
            BikeImportRequest request;
            await using (var stream = file.OpenReadStream()) {
                request = BikeWorkbook.Read(stream);
            }

            return Ok(await _importService.ImportAsync(request, ct));
        } catch (BikeImportValidationException ex) {
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BikeAdminListItemDto>>> GetAll([FromQuery] int? modelId, CancellationToken ct) =>
        Ok(await _service.GetAllAsync(modelId, ct));

    [HttpGet("spec-values")]
    public async Task<ActionResult<IReadOnlyList<BikeSpecValueItemDto>>> GetSpecValues([FromQuery] int? brandId, [FromQuery] int? categoryId, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, [FromQuery] string specCode, CancellationToken ct)
    {
        if (brandId.HasValue && brandId <= 0) {
            return BadRequest(new { message = "Brand must be a positive ID." });
        }

        try {
            return Ok(await _service.GetSpecValuesAsync(brandId, categoryId, minPrice, maxPrice, specCode, ct));
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("spec-values")]
    public async Task<ActionResult<object>> UpdateSingleSpec(UpdateSingleSpecRequest request, CancellationToken ct)
    {
        try {
            return Ok(new { updatedCount = await _service.UpdateSingleSpecAsync(request, ct) });
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("spec-grid")]
    public async Task<ActionResult<IReadOnlyList<BikeSpecGridRowDto>>> GetSpecGrid([FromQuery] int? brandId, [FromQuery] int? categoryId, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, CancellationToken ct)
    {
        if (brandId.HasValue && brandId <= 0) {
            return BadRequest(new { message = "Brand must be a positive ID." });
        }

        return Ok(await _service.GetSpecGridAsync(brandId, categoryId, minPrice, maxPrice, ct));
    }

    [HttpPut("spec-grid")]
    public async Task<ActionResult<object>> UpdateSpecGrid(UpdateSpecGridRequest request, CancellationToken ct)
    {
        try {
            return Ok(new { updatedCount = await _service.UpdateSpecGridAsync(request, ct) });
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BikeAdminDetailDto>> GetById(int id, CancellationToken ct)
    {
        try {
            return Ok(await _service.GetByIdAsync(id, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<BikeAdminDetailDto>> Create(CreateBikeRequest request, CancellationToken ct)
    {
        try {
            var result = await _service.CreateAsync(request, ct); return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return Conflict(new { code = "bike_exists", message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BikeAdminDetailDto>> Update(int id, UpdateBikeRequest request, CancellationToken ct)
    {
        try {
            return Ok(await _service.UpdateAsync(id, request, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return Conflict(new { code = "bike_exists", message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/model")]
    public async Task<IActionResult> ReassignModel(int id, ReassignBikeModelRequest request, CancellationToken ct)
    {
        try {
            await _service.ReassignModelAsync(id, request, ct);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (ArgumentException ex) {
            return BadRequest(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return Conflict(new { code = "bike_exists", message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/publish")]
    public async Task<ActionResult<BikeAdminDetailDto>> Publish(int id, CancellationToken ct)
    {
        try {
            return Ok(await _service.PublishAsync(id, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (InvalidOperationException ex) {
            return BadRequest(new { code = "bike_not_publishable", message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/unpublish")]
    public async Task<ActionResult<BikeAdminDetailDto>> Unpublish(int id, CancellationToken ct)
    {
        try {
            return Ok(await _service.UnpublishAsync(id, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/reviewed")]
    public async Task<ActionResult<BikeAdminDetailDto>> SetReviewed(int id, SetBikeReviewedRequest request, CancellationToken ct)
    {
        try {
            return Ok(await _service.SetReviewedAsync(id, request.IsReviewed, ct));
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try {
            await _service.DeleteAsync(id, ct); return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(new { message = ex.Message });
        } catch (BikeReferencedException ex) {
            return Conflict(new { code = "bike_referenced", message = ex.Message, dependentCount = ex.DependentCount });
        }
    }
}
