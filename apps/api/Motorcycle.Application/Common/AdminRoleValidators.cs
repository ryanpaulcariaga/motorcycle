using Motorcycle.Domain;

namespace Motorcycle.Application.Common;

public static class AdminRoleValidators
{
    public static void Validate(string facebookUserId, string role)
    {
        if (string.IsNullOrWhiteSpace(facebookUserId))
            throw new ArgumentException("Facebook user ID is required.", nameof(facebookUserId));
        if (!string.Equals(role, AdminRoles.Administrator, StringComparison.Ordinal))
            throw new ArgumentException("Only the Administrator role is supported.", nameof(role));
    }
}
