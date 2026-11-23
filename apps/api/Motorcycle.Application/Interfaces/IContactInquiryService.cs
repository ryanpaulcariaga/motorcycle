using Motorcycle.Application.DTOs;

namespace Motorcycle.Application.Interfaces;

public interface IContactInquiryService
{
    Task CreateAsync(CreateContactInquiryRequest request, CancellationToken ct);
    Task<ContactInquiryPageDto> GetPageAsync(int page, int pageSize, CancellationToken ct);
    Task<bool> SetReadAsync(int id, bool isRead, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}
