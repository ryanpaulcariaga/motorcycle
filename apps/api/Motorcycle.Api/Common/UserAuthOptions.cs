namespace Motorcycle.Api.Common;

/// <summary>Per-provider OAuth client credentials for public user sign-in.
/// Google is a config placeholder for a future provider; it is not yet wired into DI.</summary>
public sealed class ExternalProviderCredentials
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}

public sealed class UserAuthOptions
{
    public const string SectionName = "UserAuth";
    public string WebAppUrl { get; set; } = string.Empty;
    public ExternalProviderCredentials Facebook { get; set; } = new();
    public ExternalProviderCredentials Google { get; set; } = new();
}
