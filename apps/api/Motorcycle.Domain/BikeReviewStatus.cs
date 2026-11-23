namespace Motorcycle.Domain;

public static class BikeReviewStatus
{
    public const string Draft = "draft";
    public const string InProgress = "inProgress";
    public const string Completed = "completed";

    public static string Get(Bike bike) => bike.ReviewStatus;

    public static void Validate(string? status)
    {
        if (status is not (Draft or InProgress or Completed)) {
            throw new ArgumentException("Review status must be draft, inProgress, or completed.");
        }
    }

    public static void Set(Bike bike, string status, DateTime? completedAt = null)
    {
        Validate(status);
        if (status == Completed && (bike.ReviewStatus != Completed || bike.ReviewCompletedAt is null)) {
            bike.ReviewCompletedAt = completedAt ?? DateTime.UtcNow;
        }
        else if (status != Completed) {
            bike.ReviewCompletedAt = null;
        }
        bike.ReviewStatus = status;
    }
}
