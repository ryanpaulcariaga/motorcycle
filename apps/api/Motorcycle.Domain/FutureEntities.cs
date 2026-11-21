namespace Motorcycle.Domain;

// Future tables for Phase 5+ — schema stubs to avoid breaking migrations later

public class BikeView
{
    public int Id { get; set; }
    public int? BikeId { get; set; }
    public string? SessionHash { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}

public class SpecSearchLog
{
    public int Id { get; set; }
    public string? SpecCode { get; set; }
    public string? FilterValue { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}

public class BikeVote
{
    public int Id { get; set; }
    public int BikeId { get; set; }
    public string? SessionOrUserId { get; set; }
    public string VoteType { get; set; } = string.Empty; // 'upvote', 'downvote'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BikeComment
{
    public int Id { get; set; }
    public int BikeId { get; set; }
    public int UserId { get; set; }
    public int Rating { get; set; }
    public string? Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Bike Bike { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class SurveyResponse
{
    public int Id { get; set; }
    public int? Year { get; set; }
    public string? RespondentRef { get; set; }
    public Dictionary<string, object> Payload { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
