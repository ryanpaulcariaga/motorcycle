namespace Motorcycle.Application.DTOs;

public sealed record AdminRoleDto(
    int Id,
    string FacebookUserId,
    string? EmailSnapshot,
    string? DisplayNameSnapshot,
    string Role,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CreateAdminRoleRequest(
    string FacebookUserId,
    string? EmailSnapshot,
    string? DisplayNameSnapshot,
    string Role);

public sealed record UpdateAdminRoleRequest(
    string? EmailSnapshot,
    string? DisplayNameSnapshot,
    string Role,
    bool IsActive);
