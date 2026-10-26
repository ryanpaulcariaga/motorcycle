namespace Motorcycle.Api.Common;

public static class AdminOriginValidator
{
    public static bool IsAllowed(string? requestOrigin, IEnumerable<string> allowedOrigins)
    {
        if (!TryGetOrigin(requestOrigin, out var suppliedOrigin)) {
            return false;
        }

        return allowedOrigins.Any(configuredOrigin =>
            TryGetOrigin(configuredOrigin, out var allowedOrigin) &&
            string.Equals(suppliedOrigin, allowedOrigin, StringComparison.OrdinalIgnoreCase));
    }

    private static bool TryGetOrigin(string? value, out string origin)
    {
        origin = string.Empty;
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) ||
            !string.IsNullOrEmpty(uri.UserInfo) ||
            uri.AbsolutePath != "/" ||
            !string.IsNullOrEmpty(uri.Query) ||
            !string.IsNullOrEmpty(uri.Fragment)) {
            return false;
        }

        origin = uri.GetLeftPart(UriPartial.Authority);
        return true;
    }
}
