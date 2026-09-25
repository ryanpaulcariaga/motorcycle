namespace Motorcycle.Application.DTOs;

public sealed record UserSessionDto(int UserId, string? Email, string? DisplayName);
