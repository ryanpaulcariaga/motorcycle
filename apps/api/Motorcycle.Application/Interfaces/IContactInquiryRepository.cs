using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IContactInquiryRepository
{
    Task AddAsync(ContactInquiry inquiry, CancellationToken ct);
    Task<(IReadOnlyList<ContactInquiry> Items, int TotalCount, int UnreadCount)> GetPageAsync(
        int page, int pageSize, CancellationToken ct);
    Task<bool> SetReadAsync(int id, bool isRead, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}
