using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class ContactInquiryRepository(MotorcycleDbContext db) : IContactInquiryRepository
{
    public async Task AddAsync(ContactInquiry inquiry, CancellationToken ct)
    {
        db.ContactInquiries.Add(inquiry);
        await db.SaveChangesAsync(ct);
    }

    public async Task<(IReadOnlyList<ContactInquiry> Items, int TotalCount)> GetPageAsync(int page, int pageSize, CancellationToken ct)
    {
        var query = db.ContactInquiries.AsNoTracking();
        var count = await query.CountAsync(ct);
        var items = await query.OrderByDescending(item => item.CreatedAt).ThenByDescending(item => item.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, count);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var inquiry = await db.ContactInquiries.FindAsync([id], ct);
        if (inquiry is null)
        {
            return false;
        }

        db.ContactInquiries.Remove(inquiry);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
