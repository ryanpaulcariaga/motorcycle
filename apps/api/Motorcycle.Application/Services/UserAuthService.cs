using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class UserAuthService : IUserAuthService
{
    private readonly IUserRepository _repository;

    public UserAuthService(IUserRepository repository) => _repository = repository;

    public async Task<User> FindOrCreateUserAsync(string provider, ExternalAuthProfile profile, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(profile.ProviderUserId))
            throw new ArgumentException("Provider user ID is required.", nameof(profile));

        var existingLogin = await _repository.GetExternalLoginAsync(provider, profile.ProviderUserId, ct);
        if (existingLogin is not null)
        {
            var linkedUser = existingLogin.User ?? await _repository.GetByIdAsync(existingLogin.UserId, ct)
                ?? throw new InvalidOperationException("External login is missing its linked user.");
            ApplyProfileSnapshot(linkedUser, profile);
            await _repository.SaveChangesAsync(ct);
            return linkedUser;
        }

        // Only a provider-verified email can auto-link a new sign-in method to an existing account;
        // an unverified email could let anyone claim someone else's address across providers.
        var normalizedEmail = profile.Email?.Trim().ToLowerInvariant();
        User? user = null;
        if (profile.EmailVerified && !string.IsNullOrWhiteSpace(normalizedEmail))
            user = await _repository.GetByEmailAsync(normalizedEmail, ct);

        if (user is null)
        {
            user = new User
            {
                Email = normalizedEmail,
                EmailVerified = profile.EmailVerified && !string.IsNullOrWhiteSpace(normalizedEmail),
                DisplayName = profile.DisplayName,
            };
            await _repository.AddAsync(user, ct);
        }
        else
        {
            ApplyProfileSnapshot(user, profile);
        }

        var login = new UserExternalLogin
        {
            User = user,
            Provider = provider,
            ProviderUserId = profile.ProviderUserId,
            EmailAtProvider = profile.Email,
        };
        await _repository.AddExternalLoginAsync(login, ct);
        await _repository.SaveChangesAsync(ct);
        return user;
    }

    public Task<User?> GetActiveUserAsync(int userId, CancellationToken ct = default) => _repository.GetByIdAsync(userId, ct);

    private static void ApplyProfileSnapshot(User user, ExternalAuthProfile profile)
    {
        if (string.IsNullOrWhiteSpace(user.DisplayName) && !string.IsNullOrWhiteSpace(profile.DisplayName))
            user.DisplayName = profile.DisplayName;
        if (string.IsNullOrWhiteSpace(user.Email) && profile.EmailVerified && !string.IsNullOrWhiteSpace(profile.Email))
        {
            user.Email = profile.Email!.Trim().ToLowerInvariant();
            user.EmailVerified = true;
        }
        user.UpdatedAt = DateTime.UtcNow;
    }
}
