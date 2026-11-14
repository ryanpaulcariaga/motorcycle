namespace Motorcycle.Domain;

public class UserInterestDailyCount
{
    public int UserId { get; set; }
    public DateOnly Day { get; set; }
    public string Metric { get; set; } = "";
    public int CatalogId { get; set; }
    public long Count { get; set; }
}
