using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Motorcycle.Domain;

namespace Motorcycle.Infrastructure.Persistence;

public class MotorcycleDbContext : DbContext
{
    public MotorcycleDbContext(DbContextOptions<MotorcycleDbContext> options)
        : base(options)
    {
    }

    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Bike> Bikes => Set<Bike>();
    public DbSet<BikeImage> BikeImages => Set<BikeImage>();
    public DbSet<SpecGroup> SpecGroups => Set<SpecGroup>();
    public DbSet<SpecDefinition> SpecDefinitions => Set<SpecDefinition>();

    // Future tables (Phase 5+)
    public DbSet<BikeView> BikeViews => Set<BikeView>();
    public DbSet<SpecSearchLog> SpecSearchLogs => Set<SpecSearchLog>();
    public DbSet<BikeVote> BikeVotes => Set<BikeVote>();
    public DbSet<BikeComment> BikeComments => Set<BikeComment>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Value comparers for JSON columns
        var dictConverter = new ValueConverter<Dictionary<string, object>, string>(
            v => System.Text.Json.JsonSerializer.Serialize(v),
            v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(v) ?? new()
        );

        var dictComparer = new ValueComparer<Dictionary<string, object>>(
            (c1, c2) => c1!.SequenceEqual(c2!),
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => new Dictionary<string, object>(c)
        );

        // Brand configuration
        modelBuilder.Entity<Brand>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).IsRequired().HasMaxLength(255);
            b.Property(x => x.LogoBlobUrl).HasMaxLength(2048);
            b.HasIndex(x => x.Name).IsUnique();
            b.HasMany(x => x.Bikes).WithOne(x => x.Brand).HasForeignKey(x => x.BrandId).OnDelete(DeleteBehavior.Cascade);
        });

        // Category configuration
        modelBuilder.Entity<Category>(c =>
        {
            c.HasKey(x => x.Id);
            c.Property(x => x.Name).IsRequired().HasMaxLength(255);
            c.HasIndex(x => x.Name).IsUnique();
            c.HasMany(x => x.Bikes).WithOne(x => x.Category).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        // Bike configuration
        modelBuilder.Entity<Bike>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ModelName).IsRequired().HasMaxLength(255);
            b.Property(x => x.Slug).IsRequired().HasMaxLength(512);
            b.Property(x => x.MsrpPrice).HasPrecision(10, 2);
            
            // JSONB mapping for specs with value comparer
            b.Property(x => x.Specs)
                .HasColumnType("jsonb")
                .HasConversion(dictConverter)
                .Metadata.SetValueComparer(dictComparer);
            
            b.HasIndex(x => x.BrandId);
            b.HasIndex(x => x.CategoryId);
            b.HasIndex(x => x.Year);
            b.HasIndex(x => x.MsrpPrice);
            b.HasIndex(x => x.Slug).IsUnique();
            
            // GIN index for JSONB specs (raw SQL in migration)
            // CREATE INDEX idx_bikes_specs GIN (specs);
            
            b.HasMany(x => x.Images).WithOne(x => x.Bike).HasForeignKey(x => x.BikeId).OnDelete(DeleteBehavior.Cascade);
        });

        // BikeImage configuration
        modelBuilder.Entity<BikeImage>(bi =>
        {
            bi.HasKey(x => x.Id);
            bi.Property(x => x.BlobUrl).IsRequired().HasMaxLength(2048);
            bi.HasIndex(x => x.BikeId);
        });

        // SpecGroup configuration
        modelBuilder.Entity<SpecGroup>(sg =>
        {
            sg.HasKey(x => x.Id);
            sg.Property(x => x.Code).IsRequired().HasMaxLength(255);
            sg.Property(x => x.Name).IsRequired().HasMaxLength(255);
            sg.Property(x => x.IconName).HasMaxLength(255);
            sg.HasIndex(x => x.Code).IsUnique();
            sg.HasMany(x => x.Definitions).WithOne(x => x.Group).HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        // SpecDefinition configuration
        modelBuilder.Entity<SpecDefinition>(sd =>
        {
            sd.HasKey(x => x.Id);
            sd.Property(x => x.Code).IsRequired().HasMaxLength(255);
            sd.Property(x => x.Label).IsRequired().HasMaxLength(255);
            sd.Property(x => x.DataType).IsRequired().HasMaxLength(50);
            sd.Property(x => x.Unit).HasMaxLength(50);
            sd.Property(x => x.FilterType).HasMaxLength(50);
            sd.HasIndex(x => new { x.GroupId, x.Code }).IsUnique();
        });

        // Future tables (schema stubs for Phase 5+)
        modelBuilder.Entity<BikeView>(bv =>
        {
            bv.HasKey(x => x.Id);
            bv.Property(x => x.SessionHash).HasMaxLength(255);
        });

        modelBuilder.Entity<SpecSearchLog>(ssl =>
        {
            ssl.HasKey(x => x.Id);
            ssl.Property(x => x.SpecCode).HasMaxLength(255);
            ssl.Property(x => x.FilterValue).HasMaxLength(255);
        });

        modelBuilder.Entity<BikeVote>(bv =>
        {
            bv.HasKey(x => x.Id);
            bv.Property(x => x.SessionOrUserId).HasMaxLength(255);
            bv.Property(x => x.VoteType).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<BikeComment>(bc =>
        {
            bc.HasKey(x => x.Id);
            bc.Property(x => x.AuthorName).HasMaxLength(255);
            bc.Property(x => x.Body).IsRequired();
        });

        modelBuilder.Entity<SurveyResponse>(sr =>
        {
            sr.HasKey(x => x.Id);
            sr.Property(x => x.RespondentRef).HasMaxLength(255);
            sr.Property(x => x.Payload)
                .HasColumnType("jsonb")
                .HasConversion(dictConverter)
                .Metadata.SetValueComparer(dictComparer);
        });

        ApplySnakeCaseNames(modelBuilder);
    }

    // PostgreSQL convention is snake_case; EF Core defaults to the C# PascalCase member names,
    // so tables/columns/keys/indexes are renamed here after all entity configuration is applied.
    private static void ApplySnakeCaseNames(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName()!));

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }

            foreach (var key in entity.GetKeys())
            {
                key.SetName(ToSnakeCase(key.GetName()!));
            }

            foreach (var foreignKey in entity.GetForeignKeys())
            {
                foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()!));
            }

            foreach (var index in entity.GetIndexes())
            {
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()!));
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        // Handles acronym runs correctly (e.g. "IX_Categories_Name" -> "ix_categories_name")
        var withBoundaries = System.Text.RegularExpressions.Regex.Replace(input, "([a-z0-9])([A-Z])", "$1_$2");
        withBoundaries = System.Text.RegularExpressions.Regex.Replace(withBoundaries, "([A-Z]+)([A-Z][a-z])", "$1_$2");
        return withBoundaries.ToLowerInvariant();
    }
}
