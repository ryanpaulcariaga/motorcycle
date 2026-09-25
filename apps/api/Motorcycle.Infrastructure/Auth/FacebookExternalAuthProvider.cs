using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Auth;

/// <summary>Facebook Authorization Code + PKCE strategy implementation. Requests the `email` permission
/// so users can be linked across providers later; Facebook only returns an email for accounts that
/// have a verified one, so any email it returns is treated as verified.</summary>
public sealed class FacebookExternalAuthProvider : IExternalAuthProvider
{
    private const string AuthorizeUrl = "https://www.facebook.com/v20.0/dialog/oauth";
    private const string TokenUrl = "https://graph.facebook.com/v20.0/oauth/access_token";
    private const string ProfileUrl = "https://graph.facebook.com/me";

    private readonly HttpClient _httpClient;

    public FacebookExternalAuthProvider(HttpClient httpClient) => _httpClient = httpClient;

    public string Provider => Domain.ExternalAuthProviders.Facebook;

    public string BuildAuthorizationUrl(ExternalAuthProviderConfig config, string state, string codeChallenge)
    {
        var parameters = new Dictionary<string, string>
        {
            ["client_id"] = config.ClientId,
            ["redirect_uri"] = config.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = "public_profile,email",
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256",
        };
        var query = new FormUrlEncodedContent(parameters).ReadAsStringAsync().GetAwaiter().GetResult();
        return $"{AuthorizeUrl}?{query}";
    }

    public async Task<ExternalAuthProfile> ExchangeCodeAsync(ExternalAuthProviderConfig config, string code, string codeVerifier, CancellationToken ct = default)
    {
        var tokenParameters = new Dictionary<string, string>
        {
            ["client_id"] = config.ClientId,
            ["client_secret"] = config.ClientSecret,
            ["redirect_uri"] = config.RedirectUri,
            ["code"] = code,
            ["code_verifier"] = codeVerifier,
        };
        var tokenQuery = await new FormUrlEncodedContent(tokenParameters).ReadAsStringAsync(ct);
        var tokenResponse = await _httpClient.GetAsync($"{TokenUrl}?{tokenQuery}", ct);
        if (!tokenResponse.IsSuccessStatusCode)
            throw new InvalidOperationException("Facebook token exchange failed.");
        var token = await tokenResponse.Content.ReadFromJsonAsync<FacebookTokenResponse>(cancellationToken: ct);
        if (string.IsNullOrWhiteSpace(token?.AccessToken))
            throw new InvalidOperationException("Facebook did not return an access token.");

        var profile = await _httpClient.GetFromJsonAsync<FacebookProfile>(
            $"{ProfileUrl}?fields=id,email,name&access_token={Uri.EscapeDataString(token.AccessToken)}", ct);
        if (string.IsNullOrWhiteSpace(profile?.Id))
            throw new InvalidOperationException("Facebook profile lookup failed.");

        return new ExternalAuthProfile(profile.Id, profile.Email, EmailVerified: !string.IsNullOrWhiteSpace(profile.Email), profile.Name);
    }

    private sealed record FacebookTokenResponse([property: JsonPropertyName("access_token")] string? AccessToken);
    private sealed record FacebookProfile(string? Id, string? Email, string? Name);
}
