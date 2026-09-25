namespace Motorcycle.Domain;

/// <summary>Supported external identity providers a User can sign in with.</summary>
public static class ExternalAuthProviders
{
    public const string Facebook = "Facebook";
    public const string Google = "Google";
}

/// <summary>Links one external provider identity (e.g. a Facebook user ID) to a single internal User.
/// A User can have multiple rows here, one per provider, so signing in with Facebook or Google
/// (matched by verified email) resolves to the same account.</summary>
public class UserExternalLogin
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Provider { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public string? EmailAtProvider { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
