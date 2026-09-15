using Motorcycle.Application.Interfaces;

namespace Motorcycle.Api.Bootstrap;

public static class AdminBootstrapCommand
{
    public static bool IsRequested(string[] args) =>
        args.Length > 1 && string.Equals(args[0], "admin", StringComparison.OrdinalIgnoreCase)
        && string.Equals(args[1], "bootstrap", StringComparison.OrdinalIgnoreCase);

    public static async Task<int> RunAsync(IServiceProvider services, string[] args, CancellationToken ct = default)
    {
        var values = Parse(args);
        if (!values.TryGetValue("facebook-user-id", out var facebookUserId) || string.IsNullOrWhiteSpace(facebookUserId))
            throw new ArgumentException("--facebook-user-id is required.");

        values.TryGetValue("email", out var email);
        values.TryGetValue("display-name", out var displayName);

        var roleService = services.GetRequiredService<IAdminRoleService>();
        var role = await roleService.BootstrapAsync(facebookUserId, email, displayName, ct);
        Console.WriteLine($"Administrator bootstrap ready for Facebook user {role.FacebookUserId} (record {role.Id}).");
        return 0;
    }

    private static Dictionary<string, string> Parse(string[] args)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 2; index < args.Length; index++)
        {
            var key = args[index].TrimStart('-');
            if (string.IsNullOrWhiteSpace(key) || index + 1 >= args.Length || args[index + 1].StartsWith('-'))
                continue;
            values[key] = args[++index];
        }
        return values;
    }
}
