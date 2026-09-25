using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Auth;

public sealed class ExternalAuthProviderFactory : IExternalAuthProviderFactory
{
    private readonly IEnumerable<IExternalAuthProvider> _providers;

    public ExternalAuthProviderFactory(IEnumerable<IExternalAuthProvider> providers) => _providers = providers;

    public IExternalAuthProvider Resolve(string provider)
    {
        var match = _providers.FirstOrDefault(p => string.Equals(p.Provider, provider, StringComparison.OrdinalIgnoreCase));
        return match ?? throw new NotSupportedException($"External auth provider '{provider}' is not supported.");
    }
}
