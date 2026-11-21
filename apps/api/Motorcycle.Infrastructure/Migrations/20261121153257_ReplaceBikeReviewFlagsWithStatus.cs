using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceBikeReviewFlagsWithStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "review_status",
                table: "bikes",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "notReviewed");

            migrationBuilder.Sql("""
                UPDATE bikes
                SET review_status = CASE
                    WHEN is_reviewed THEN 'reviewed'
                    WHEN is_in_review THEN 'inReview'
                    ELSE 'notReviewed'
                END;
                """);

            migrationBuilder.DropColumn(
                name: "is_in_review",
                table: "bikes");

            migrationBuilder.DropColumn(
                name: "is_reviewed",
                table: "bikes");

            migrationBuilder.AddCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes",
                sql: "review_status IN ('notReviewed', 'inReview', 'reviewed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes");

            migrationBuilder.AddColumn<bool>(
                name: "is_in_review",
                table: "bikes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_reviewed",
                table: "bikes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE bikes
                SET is_reviewed = review_status = 'reviewed',
                    is_in_review = review_status = 'inReview';
                """);

            migrationBuilder.DropColumn(
                name: "review_status",
                table: "bikes");

        }
    }
}
