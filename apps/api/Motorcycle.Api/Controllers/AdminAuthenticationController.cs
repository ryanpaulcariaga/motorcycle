using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Motorcycle.Api.Common;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthenticationController : ControllerBase
{
    private const string FacebookAuthorizeUrl = "https://www.facebook.com/v20.0/dialog/oauth";
    private const string FacebookTokenUrl = "https://graph.facebook.com/v20.0/oauth/access_token";
    private const string FacebookProfileUrl = "https://graph.facebook.com/me";
    private const string StateCookie = "mc_oauth_state";
    private const string VerifierCookie = "mc_oauth_verifier";
    private readonly AdminAuthOptions _options;
    private readonly IAdminRoleRepository _roles;
    private readonly IHttpClientFactory _httpClientFactory;

    public AdminAuthenticationController(
        IOptions<AdminAuthOptions> options,
        IAdminRoleRepository roles,
        IHttpClientFactory httpClientFactory)
    {
        _options = options.Value;
        _roles = roles;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("facebook")]
    public IActionResult StartFacebookSignIn()
    {
        EnsureConfigured();
        var state = Base64Url(RandomNumberGenerator.GetBytes(24));
        var verifier = Base64Url(RandomNumberGenerator.GetBytes(48));
        var challenge = Base64Url(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(verifier)));
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(10),
        };
        Response.Cookies.Append(StateCookie, state, cookieOptions);
        Response.Cookies.Append(VerifierCookie, verifier, cookieOptions);

        var parameters = new Dictionary<string, string>
        {
            ["client_id"] = _options.FacebookClientId,
            ["redirect_uri"] = _options.FacebookRedirectUri,
            ["response_type"] = "code",
            ["scope"] = "public_profile",
            ["state"] = state,
            ["code_challenge"] = challenge,
            ["code_challenge_method"] = "S256",
        };
        return Redirect($"{FacebookAuthorizeUrl}?{new FormUrlEncodedContent(parameters).ReadAsStringAsync().GetAwaiter().GetResult()}");
    }

    [HttpGet("facebook/callback")]
    public async Task<IActionResult> CompleteFacebookSignIn([FromQuery] string? code, [FromQuery] string? state, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
            return RedirectToAdmin("oauth_cancelled");

        var expectedState = Request.Cookies[StateCookie];
        var verifier = Request.Cookies[VerifierCookie];
        Response.Cookies.Delete(StateCookie);
        Response.Cookies.Delete(VerifierCookie);
        if (string.IsNullOrWhiteSpace(expectedState) || !CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(expectedState), System.Text.Encoding.UTF8.GetBytes(state)) || string.IsNullOrWhiteSpace(verifier))
            return RedirectToAdmin("Invalid OAuth state.");

        try
        {
            EnsureConfigured();
            var client = _httpClientFactory.CreateClient();
            var tokenParameters = new Dictionary<string, string>
            {
                ["client_id"] = _options.FacebookClientId,
                ["client_secret"] = _options.FacebookClientSecret,
                ["redirect_uri"] = _options.FacebookRedirectUri,
                ["code"] = code!,
                ["code_verifier"] = verifier,
            };
            var tokenResponse = await client.GetAsync($"{FacebookTokenUrl}?{await new FormUrlEncodedContent(tokenParameters).ReadAsStringAsync(ct)}", ct);
            if (!tokenResponse.IsSuccessStatusCode) return RedirectToAdmin("Facebook token exchange failed.");
            var token = await tokenResponse.Content.ReadFromJsonAsync<FacebookTokenResponse>(cancellationToken: ct);
            if (string.IsNullOrWhiteSpace(token?.AccessToken)) return RedirectToAdmin("Facebook did not return an access token.");

            var profile = await client.GetFromJsonAsync<FacebookProfile>($"{FacebookProfileUrl}?fields=id,email,name&access_token={Uri.EscapeDataString(token.AccessToken)}", ct);
            if (string.IsNullOrWhiteSpace(profile?.Id)) return RedirectToAdmin("Facebook profile lookup failed.");
            var role = await _roles.GetByFacebookUserIdAsync(profile.Id, ct);
            if (role?.IsActive != true) return RedirectToAdmin("This Facebook identity is not an active administrator.");

            var claims = new[]
            {
                new Claim("sub", profile.Id),
                new Claim(ClaimTypes.Name, profile.Name ?? profile.Id),
            };
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)), new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1),
            });
            return Redirect(_options.AdminAppUrl);
        }
        catch (HttpRequestException)
        {
            return RedirectToAdmin("Facebook sign-in is temporarily unavailable.");
        }
    }

    [HttpGet("session")]
    [Authorize(Policy = "ActiveAdministrator")]
    public IActionResult GetSession() => Ok(new { facebookUserId = User.FindFirstValue("sub"), displayName = User.Identity?.Name });

    [HttpPost("signout")]
    public async Task<IActionResult> SignOutAdmin()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private IActionResult RedirectToAdmin(string error) => Redirect($"{_options.AdminAppUrl}/?error={Uri.EscapeDataString(error)}");

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.FacebookClientId) || string.IsNullOrWhiteSpace(_options.FacebookClientSecret) ||
            string.IsNullOrWhiteSpace(_options.FacebookRedirectUri) || string.IsNullOrWhiteSpace(_options.AdminAppUrl))
            throw new InvalidOperationException("Admin Facebook authentication is not configured.");
    }

    private static string Base64Url(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private sealed record FacebookTokenResponse([property: JsonPropertyName("access_token")] string? AccessToken);
    private sealed record FacebookProfile(string? Id, string? Email, string? Name);
}