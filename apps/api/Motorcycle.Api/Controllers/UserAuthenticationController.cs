using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Motorcycle.Api.Common;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Domain;

namespace Motorcycle.Api.Controllers;

/// <summary>Public-user sign-in shared by any first-party frontend (currently `apps/web`).
/// Supports multiple external providers behind one session model: each provider is exchanged
/// through <see cref="IExternalAuthProvider"/> and resolved to a single <see cref="User"/> by
/// <see cref="IUserAuthService"/>, so a person can sign in with Facebook today and a future
/// provider (e.g. Google) later and land on the same account when the email is verified.</summary>
[ApiController]
[Route("api/auth")]
public sealed class UserAuthenticationController : ControllerBase
{
    public const string SchemeName = "UserAuth";
    private const string StateCookiePrefix = "mc_user_oauth_state_";
    private const string VerifierCookiePrefix = "mc_user_oauth_verifier_";

    private readonly UserAuthOptions _options;
    private readonly IExternalAuthProviderFactory _providerFactory;
    private readonly IUserAuthService _userAuthService;

    public UserAuthenticationController(
        IOptions<UserAuthOptions> options,
        IExternalAuthProviderFactory providerFactory,
        IUserAuthService userAuthService)
    {
        _options = options.Value;
        _providerFactory = providerFactory;
        _userAuthService = userAuthService;
    }

    [HttpGet("{provider}")]
    public IActionResult StartSignIn(string provider)
    {
        var (authProvider, config) = Resolve(provider);
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
        Response.Cookies.Append(StateCookiePrefix + provider, state, cookieOptions);
        Response.Cookies.Append(VerifierCookiePrefix + provider, verifier, cookieOptions);
        return Redirect(authProvider.BuildAuthorizationUrl(config, state, challenge));
    }

    [HttpGet("{provider}/callback")]
    public async Task<IActionResult> CompleteSignIn(string provider, [FromQuery] string? code, [FromQuery] string? state, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
            return RedirectToWeb("oauth_cancelled");

        var expectedState = Request.Cookies[StateCookiePrefix + provider];
        var verifier = Request.Cookies[VerifierCookiePrefix + provider];
        Response.Cookies.Delete(StateCookiePrefix + provider);
        Response.Cookies.Delete(VerifierCookiePrefix + provider);
        if (string.IsNullOrWhiteSpace(expectedState) || string.IsNullOrWhiteSpace(verifier) ||
            !CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(expectedState), System.Text.Encoding.UTF8.GetBytes(state)))
            return RedirectToWeb("Invalid OAuth state.");

        try
        {
            var (authProvider, config) = Resolve(provider);
            var profile = await authProvider.ExchangeCodeAsync(config, code, verifier, ct);
            var user = await _userAuthService.FindOrCreateUserAsync(authProvider.Provider, profile, ct);
            if (!user.IsActive) return RedirectToWeb("This account has been disabled.");

            var claims = new List<Claim> { new("sub", user.Id.ToString()) };
            if (!string.IsNullOrWhiteSpace(user.Email)) claims.Add(new Claim(ClaimTypes.Email, user.Email));
            if (!string.IsNullOrWhiteSpace(user.DisplayName)) claims.Add(new Claim(ClaimTypes.Name, user.DisplayName));

            await HttpContext.SignInAsync(SchemeName, new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName)), new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30),
            });
            return Redirect(_options.WebAppUrl);
        }
        catch (InvalidOperationException)
        {
            return RedirectToWeb("Sign-in is temporarily unavailable.");
        }
        catch (NotSupportedException)
        {
            return RedirectToWeb("Unsupported sign-in provider.");
        }
        catch (HttpRequestException)
        {
            return RedirectToWeb("Sign-in is temporarily unavailable.");
        }
    }

    [HttpGet("session")]
    [Authorize(Policy = "AuthenticatedUser")]
    public async Task<IActionResult> GetSession(CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        var user = await _userAuthService.GetActiveUserAsync(userId, ct);
        if (user is null || !user.IsActive) return Unauthorized();
        return Ok(new UserSessionDto(user.Id, user.Email, user.DisplayName));
    }

    [HttpPost("signout")]
    public async Task<IActionResult> SignOut()
    {
        await HttpContext.SignOutAsync(SchemeName);
        return NoContent();
    }

    private (IExternalAuthProvider Provider, ExternalAuthProviderConfig Config) Resolve(string provider)
    {
        var authProvider = _providerFactory.Resolve(provider);
        var credentials = string.Equals(authProvider.Provider, ExternalAuthProviders.Facebook, StringComparison.OrdinalIgnoreCase)
            ? _options.Facebook
            : _options.Google;
        if (string.IsNullOrWhiteSpace(credentials.ClientId) || string.IsNullOrWhiteSpace(credentials.ClientSecret) ||
            string.IsNullOrWhiteSpace(credentials.RedirectUri) || string.IsNullOrWhiteSpace(_options.WebAppUrl))
            throw new InvalidOperationException($"User authentication for '{provider}' is not configured.");
        return (authProvider, new ExternalAuthProviderConfig(credentials.ClientId, credentials.ClientSecret, credentials.RedirectUri));
    }

    private IActionResult RedirectToWeb(string error) => Redirect($"{_options.WebAppUrl}/?authError={Uri.EscapeDataString(error)}");

    private static string Base64Url(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
