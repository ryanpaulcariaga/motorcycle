namespace Motorcycle.Application.Interfaces;

/// <summary>Per-provider OAuth client credentials and redirect target, supplied by API configuration.</summary>
public sealed record ExternalAuthProviderConfig(string ClientId, string ClientSecret, string RedirectUri);

/// <summary>Normalized identity returned by any external auth provider after a successful code exchange.
/// <paramref name="EmailVerified"/> must only be true when the provider itself attests the email is verified,
/// since it gates automatic account linking by email.</summary>
public sealed record ExternalAuthProfile(string ProviderUserId, string? Email, bool EmailVerified, string? DisplayName);

/// <summary>Strategy contract for one external sign-in provider (Facebook today, Google/others later).
/// Resolved by <see cref="IExternalAuthProviderFactory"/> so new providers plug in without touching
/// controller or account-linking logic.</summary>
public interface IExternalAuthProvider
{
    string Provider { get; }
    string BuildAuthorizationUrl(ExternalAuthProviderConfig config, string state, string codeChallenge);
    Task<ExternalAuthProfile> ExchangeCodeAsync(ExternalAuthProviderConfig config, string code, string codeVerifier, CancellationToken ct = default);
}

public interface IExternalAuthProviderFactory
{
    IExternalAuthProvider Resolve(string provider);
}
