namespace Motorcycle.Application.Interfaces;

public interface IDatabaseConnectionTester
{
    /// <summary>Returns true when a query against the bikes table returned a row.</summary>
    Task<bool> CanReadBikeAsync(CancellationToken ct);
}
