using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/contact")]
public sealed class ContactInquiriesController(IContactInquiryService service) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.Contact)]
    [RequestSizeLimit(65536)]
    public async Task<IActionResult> Create(CreateContactInquiryRequest request, CancellationToken ct)
    {
        await service.CreateAsync(request, ct);
        return Accepted();
    }
}
