using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IContactInquiryRepository
{
    Task AddAsync(ContactInquiry inquiry, CancellationToken ct);
    Task<(IReadOnlyList<ContactInquiry> Items, int TotalCount)> GetPageAsync(int page, int pageSize, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}
