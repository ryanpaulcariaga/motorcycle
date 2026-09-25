using Motorcycle.Domain;

namespace Motorcycle.Application.Interfaces;

/// <summary>Resolves a signed-in public User for any supported external provider, linking new
/// provider identities to an existing account by verified email so one person can sign in with
/// Facebook today and Google (or another provider) later and land on the same account.</summary>
public interface IUserAuthService
{
    Task<User> FindOrCreateUserAsync(string provider, ExternalAuthProfile profile, CancellationToken ct = default);
    Task<User?> GetActiveUserAsync(int userId, CancellationToken ct = default);
}
