using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/bikes/{bikeId:int}/images")]
[Authorize(Policy = "ActiveAdministrator")]
public sealed class AdminBikeImagesController : ControllerBase
{
    private readonly IBikeImageAdminService _service;
    public AdminBikeImagesController(IBikeImageAdminService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BikeImageAdminDto>>> GetAll(int bikeId, CancellationToken ct)
    {
        try { return Ok(await _service.GetAllAsync(bikeId, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<BikeImageAdminDto>> Upload(int bikeId, IFormFile file, CancellationToken ct)
    {
        if (file is null) return BadRequest(new { message = "An image file is required." });
        try
        {
            await using var stream = file.OpenReadStream();
            var result = await _service.UploadAsync(bikeId, stream, file.FileName, file.ContentType, file.Length, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{imageId:int}/primary")]
    public async Task<ActionResult<BikeImageAdminDto>> SetPrimary(int bikeId, int imageId, CancellationToken ct)
    {
        try { return Ok(await _service.SetPrimaryAsync(bikeId, imageId, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("order")]
    public async Task<ActionResult<IReadOnlyList<BikeImageAdminDto>>> Reorder(int bikeId, ReorderBikeImagesRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.ReorderAsync(bikeId, request, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int bikeId, int imageId, CancellationToken ct)
    {
        try { await _service.DeleteAsync(bikeId, imageId, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
