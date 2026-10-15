namespace Motorcycle.Application.DTOs;

public sealed record CategoryAdminDto(int Id, string Name, int ModelCount, int BikeCount);

public sealed record CategoryRequest(string Name);
