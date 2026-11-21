namespace Motorcycle.Domain;

public static class BikeReviewStatus
{
    public const string NotReviewed = "notReviewed";
    public const string InReview = "inReview";
    public const string Reviewed = "reviewed";

    public static string Get(Bike bike) => bike.ReviewStatus;

    public static void Validate(string? status)
    {
        if (status is not (NotReviewed or InReview or Reviewed)) {
            throw new ArgumentException("Review status must be notReviewed, inReview, or reviewed.");
        }
    }

    public static void Set(Bike bike, string status)
    {
        Validate(status);
        bike.ReviewStatus = status;
    }
}
