using Motorcycle.Api.Common;

namespace Motorcycle.Api.Tests;

public sealed class AdminOriginValidatorTests
{
    private static readonly string[] AllowedOrigins = ["https://admin.example.com"];

    [Fact]
    public void AllowsConfiguredOrigin()
    {
        Assert.True(AdminOriginValidator.IsAllowed("https://admin.example.com", AllowedOrigins));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://attacker.example")]
    [InlineData("https://admin.example.com.attacker.example")]
    [InlineData("https://admin.example.com/path")]
    [InlineData("javascript:alert(1)")]
    public void RejectsMissingUntrustedOrMalformedOrigin(string? origin)
    {
        Assert.False(AdminOriginValidator.IsAllowed(origin, AllowedOrigins));
    }
}
