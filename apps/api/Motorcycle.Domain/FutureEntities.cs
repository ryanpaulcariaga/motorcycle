namespace Motorcycle.Domain;

// Future tables for Phase 5+ — schema stubs to avoid breaking migrations later

public class BikeView
{
    public Guid Id { get; set; }
    public Guid? BikeId { get; set; }
    public string? SessionHash { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}

public class SpecSearchLog
{
    public Guid Id { get; set; }
    public string? SpecCode { get; set; }
    public string? FilterValue { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}

public class BikeVote
{
    public Guid Id { get; set; }
    public Guid BikeId { get; set; }
    public string? SessionOrUserId { get; set; }
    public string VoteType { get; set; } = string.Empty; // 'upvote', 'downvote'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BikeComment
{
    public Guid Id { get; set; }
    public Guid BikeId { get; set; }
    public string? AuthorName { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsApproved { get; set; } = false;
}

public class SurveyResponse
{
    public Guid Id { get; set; }
    public int? Year { get; set; }
    public string? RespondentRef { get; set; }
    public Dictionary<string, object> Payload { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
