using Microsoft.EntityFrameworkCore;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;

namespace Motorcycle.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly MotorcycleDbContext _context;

    public UserRepository(MotorcycleDbContext context) => _context = context;

    public Task<User?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Users.SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        _context.Users.SingleOrDefaultAsync(x => x.Email == email, ct);

    public Task<UserExternalLogin?> GetExternalLoginAsync(string provider, string providerUserId, CancellationToken ct = default) =>
        _context.UserExternalLogins
            .Include(x => x.User)
            .SingleOrDefaultAsync(x => x.Provider == provider && x.ProviderUserId == providerUserId, ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await _context.Users.AddAsync(user, ct);

    public async Task AddExternalLoginAsync(UserExternalLogin login, CancellationToken ct = default) =>
        await _context.UserExternalLogins.AddAsync(login, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
