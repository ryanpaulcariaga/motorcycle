namespace Motorcycle.Application.DTOs;

public sealed record ReorderBikeImagesRequest(IReadOnlyList<int> ImageIds);

public sealed record BikeImageAdminDto(
    int Id,
    string BlobUrl,
    int SortOrder,
    bool IsPrimary);
