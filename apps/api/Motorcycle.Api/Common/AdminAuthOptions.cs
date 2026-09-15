namespace Motorcycle.Api.Common;

public sealed class AdminAuthOptions
{
    public const string SectionName = "AdminAuth";
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = "motorcycle-api";
    public string RsaPublicKeyPem { get; set; } = string.Empty;
}
