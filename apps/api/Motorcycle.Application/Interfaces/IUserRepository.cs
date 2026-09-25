using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<UserExternalLogin?> GetExternalLoginAsync(string provider, string providerUserId, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    Task AddExternalLoginAsync(UserExternalLogin login, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
