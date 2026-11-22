using System.ComponentModel.DataAnnotations;

namespace Motorcycle.Application.DTOs;

/// <summary>A visitor's contact inquiry.</summary>
public sealed record CreateContactInquiryRequest
{
    [StringLength(100)]
    public string? Name { get; init; }

    [Required, EmailAddress, StringLength(254)]
    public required string Email { get; init; }

    [Required, StringLength(5000)]
    public required string Message { get; init; }
}

/// <summary>A contact inquiry visible to administrators.</summary>
public sealed record ContactInquiryDto(int Id, string? Name, string Email, string Message, DateTimeOffset CreatedAt);

/// <summary>A page of contact inquiries.</summary>
public sealed record ContactInquiryPageDto(IReadOnlyList<ContactInquiryDto> Items, int Page, int PageSize, int TotalCount);
