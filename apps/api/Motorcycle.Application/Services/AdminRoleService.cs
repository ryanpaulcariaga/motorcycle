using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Common;
using Motorcycle.Domain;

namespace Motorcycle.Application.Services;

public sealed class AdminRoleService : IAdminRoleService
{
    private readonly IAdminRoleRepository _repository;

    public AdminRoleService(IAdminRoleRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<AdminRole>> GetAllAsync(CancellationToken ct = default) =>
        await _repository.GetAllAsync(ct);

    public Task<AdminRole> BootstrapAsync(string facebookUserId, string? email, string? displayName, CancellationToken ct = default) =>
        ProvisionInternalAsync(facebookUserId, email, displayName, AdminRoles.Administrator, allowExistingActive: true, ct);

    public Task<AdminRole> ProvisionAsync(string facebookUserId, string? email, string? displayName, string role, CancellationToken ct = default) =>
        ProvisionInternalAsync(facebookUserId, email, displayName, role, allowExistingActive: false, ct);

    public async Task<AdminRole> UpdateAsync(int id, string? email, string? displayName, string role, bool isActive, CancellationToken ct = default)
    {
        ValidateRole(role);
        var entity = await _repository.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Administrator role was not found.");
        entity.EmailSnapshot = email;
        entity.DisplayNameSnapshot = displayName;
        entity.Role = role;
        entity.IsActive = isActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);
        return entity;
    }

    private async Task<AdminRole> ProvisionInternalAsync(string facebookUserId, string? email, string? displayName, string role, bool allowExistingActive, CancellationToken ct)
    {
            AdminRoleValidators.Validate(facebookUserId, role);
        var existing = await _repository.GetByFacebookUserIdAsync(facebookUserId, ct);
        if (existing is not null)
        {
            if (allowExistingActive && existing.IsActive && existing.Role == AdminRoles.Administrator)
                return existing;
            throw new InvalidOperationException("An administrator role already exists for this Facebook user.");
        }

        var entity = new AdminRole
        {
            FacebookUserId = facebookUserId.Trim(),
            EmailSnapshot = email?.Trim(),
            DisplayNameSnapshot = displayName?.Trim(),
            Role = role,
            IsActive = true,
        };
        await _repository.AddAsync(entity, ct);
        await _repository.SaveChangesAsync(ct);
        return entity;
    }

    private static void ValidateRole(string role)
    {
        if (!string.Equals(role, AdminRoles.Administrator, StringComparison.Ordinal))
            throw new ArgumentException("Only the Administrator role is supported.", nameof(role));
    }
}
