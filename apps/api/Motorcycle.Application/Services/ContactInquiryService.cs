using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class ContactInquiryService(IContactInquiryRepository repository, TimeProvider clock) : IContactInquiryService
{
    public Task CreateAsync(CreateContactInquiryRequest request, CancellationToken ct)
    {
        var name = request.Name?.Trim();
        return repository.AddAsync(new ContactInquiry
        {
            Name = string.IsNullOrEmpty(name) ? null : name,
            Email = request.Email.Trim(),
            Message = request.Message.Trim(),
            CreatedAt = clock.GetUtcNow()
        }, ct);
    }

    public async Task<ContactInquiryPageDto> GetPageAsync(int page, int pageSize, CancellationToken ct)
    {
        var (items, totalCount) = await repository.GetPageAsync(page, pageSize, ct);
        return new ContactInquiryPageDto(
            items.Select(item => new ContactInquiryDto(item.Id, item.Name, item.Email, item.Message, item.CreatedAt)).ToArray(),
            page, pageSize, totalCount);
    }

    public Task<bool> DeleteAsync(int id, CancellationToken ct) => repository.DeleteAsync(id, ct);
}
