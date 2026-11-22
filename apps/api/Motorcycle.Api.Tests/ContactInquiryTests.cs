using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Motorcycle.Api.Common;
using Motorcycle.Api.Controllers;
using Motorcycle.Application.DTOs;
using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Domain;
using Motorcycle.Infrastructure.Persistence;
using Motorcycle.Infrastructure.Repositories;

namespace Motorcycle.Api.Tests;

public sealed class ContactInquiryTests
{
    [Fact]
    public async Task InquiryIsStoredListedAndDeleted()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        var service = new ContactInquiryService(new ContactInquiryRepository(db), TimeProvider.System);

        await service.CreateAsync(new CreateContactInquiryRequest
        {
            Name = " Rider ",
            Email = "rider@example.com",
            Message = " A suggestion "
        }, default);

        var page = await service.GetPageAsync(1, 20, default);
        var inquiry = Assert.Single(page.Items);
        Assert.Equal(1, page.TotalCount);
        Assert.Equal("Rider", inquiry.Name);
        Assert.Equal("rider@example.com", inquiry.Email);
        Assert.Equal("A suggestion", inquiry.Message);
        Assert.True(await service.DeleteAsync(inquiry.Id, default));
        Assert.False(await service.DeleteAsync(inquiry.Id, default));
        Assert.Empty((await service.GetPageAsync(1, 20, default)).Items);
    }

    [Fact]
    public async Task InboxPaginatesNewestFirst()
    {
        var options = new DbContextOptionsBuilder<MotorcycleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new MotorcycleDbContext(options);
        var timestamp = DateTimeOffset.UtcNow;
        db.ContactInquiries.AddRange(
            new ContactInquiry { Email = "one@example.com", Message = "One", CreatedAt = timestamp },
            new ContactInquiry { Email = "two@example.com", Message = "Two", CreatedAt = timestamp });
        await db.SaveChangesAsync();
        var repository = new ContactInquiryRepository(db);

        var (items, count) = await repository.GetPageAsync(2, 1, default);
        Assert.Equal(2, count);
        Assert.Equal("One", Assert.Single(items).Message);
    }

    [Theory]
    [InlineData("", "message")]
    [InlineData("invalid", "message")]
    [InlineData("rider@example.com", "   ")]
    public void InvalidRequestsFailModelValidation(string email, string message)
    {
        var request = new CreateContactInquiryRequest { Email = email, Message = message };
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), [], true));
    }

    [Fact]
    public void OversizedFieldsFailModelValidation()
    {
        var request = new CreateContactInquiryRequest
        {
            Name = new string('n', 101), Email = "rider@example.com", Message = new string('x', 5001)
        };
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), errors, true));
        Assert.Equal(2, errors.Count);
    }

    [Fact]
    public void PublicSubmissionIsRateLimitedAndInboxIsProtected()
    {
        var method = typeof(ContactInquiriesController).GetMethod(nameof(ContactInquiriesController.Create))!;
        Assert.Equal(RateLimitPolicies.Contact, method.GetCustomAttribute<EnableRateLimitingAttribute>()?.PolicyName);
        Assert.Equal("ActiveAdministrator", typeof(AdminContactInquiriesController)
            .GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        Assert.Equal("api/admin/contact-inquiries", typeof(AdminContactInquiriesController)
            .GetCustomAttribute<RouteAttribute>()?.Template);
    }

    [Fact]
    public async Task HttpSubmissionValidatesPersistsAndProtectsInbox()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["RateLimiting:ContactPerMinute"] = "2"
        });
        builder.Services.AddDbContext<MotorcycleDbContext>(options =>
            options.UseInMemoryDatabase(Guid.NewGuid().ToString()), ServiceLifetime.Singleton);
        builder.Services.AddScoped<IContactInquiryRepository, ContactInquiryRepository>();
        builder.Services.AddScoped<IContactInquiryService, ContactInquiryService>();
        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddControllers().AddApplicationPart(typeof(ContactInquiriesController).Assembly);
        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
        {
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
        });
        builder.Services.AddAuthorization(options =>
            options.AddPolicy("ActiveAdministrator", policy => policy.RequireAuthenticatedUser()));
        builder.Services.AddApiRateLimiting(builder.Configuration);

        await using var app = builder.Build();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        var invalid = await client.PostAsJsonAsync("/api/contact", new { email = "bad", message = " " });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var valid = await client.PostAsJsonAsync("/api/contact", new { email = "rider@example.com", message = "Hello" });
        Assert.Equal(HttpStatusCode.Accepted, valid.StatusCode);
        var limited = await client.PostAsJsonAsync("/api/contact", new { email = "rider@example.com", message = "Again" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/contact-inquiries")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.DeleteAsync("/api/admin/contact-inquiries/1")).StatusCode);

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MotorcycleDbContext>();
        Assert.Equal("Hello", Assert.Single(await db.ContactInquiries.ToListAsync()).Message);
    }
}
