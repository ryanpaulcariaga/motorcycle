namespace Motorcycle.Domain;

public sealed class AnalyticsDailyCount
{
    public DateOnly Day { get; set; }
    public string Metric { get; set; } = string.Empty;
    public int Dimension1 { get; set; }
    public int Dimension2 { get; set; }
    public long Count { get; set; }
}
