namespace Motorcycle.Api.Common;

public sealed class AdminAuthOptions
{
    public const string SectionName = "AdminAuth";
    public string FacebookClientId { get; set; } = string.Empty;
    public string FacebookClientSecret { get; set; } = string.Empty;
    public string FacebookRedirectUri { get; set; } = string.Empty;
    public string AdminAppUrl { get; set; } = string.Empty;
}
