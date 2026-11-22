namespace Motorcycle.Application.DTOs;

public sealed record UserDataExportDto(
    string SchemaVersion,
    DateTime GeneratedAtUtc,
    UserAccountExportDto Account,
    IReadOnlyList<UserExternalLoginExportDto> ExternalLogins,
    IReadOnlyList<UserInterestExportDto> InterestActivity,
    IReadOnlyList<UserReviewExportDto> Reviews,
    IReadOnlyList<UserDiscussionCommentExportDto> Comments);

public sealed record UserAccountExportDto(
    int Id,
    string? Email,
    bool EmailVerified,
    string? DisplayName,
    bool InterestTrackingEnabled,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record UserExternalLoginExportDto(
    string Provider,
    string ProviderUserId,
    string? EmailAtProvider,
    DateTime LinkedAtUtc);

public sealed record UserInterestExportDto(
    DateOnly Day,
    string Metric,
    int CatalogId,
    long Count);

public sealed record UserReviewExportDto(
    int Id,
    int BikeId,
    int Rating,
    string? Body,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record UserDiscussionCommentExportDto(
    int Id,
    int BikeId,
    int? ParentCommentId,
    string Body,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
