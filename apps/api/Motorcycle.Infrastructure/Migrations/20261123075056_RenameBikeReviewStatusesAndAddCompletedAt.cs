using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameBikeReviewStatusesAndAddCompletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes");

            migrationBuilder.AlterColumn<string>(
                name: "review_status",
                table: "bikes",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "draft",
                oldClrType: typeof(string),
                oldType: "character varying(16)",
                oldMaxLength: 16,
                oldDefaultValue: "notReviewed");

            migrationBuilder.AddColumn<DateTime>(
                name: "review_completed_at",
                table: "bikes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE bikes
                SET review_status = CASE review_status
                    WHEN 'notReviewed' THEN 'draft'
                    WHEN 'inReview' THEN 'inProgress'
                    WHEN 'reviewed' THEN 'completed'
                END,
                review_completed_at = CASE
                    WHEN review_status = 'reviewed' THEN updated_at
                    ELSE NULL
                END;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes",
                sql: "review_status IN ('draft', 'inProgress', 'completed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes");

            migrationBuilder.Sql("""
                UPDATE bikes
                SET review_status = CASE review_status
                    WHEN 'draft' THEN 'notReviewed'
                    WHEN 'inProgress' THEN 'inReview'
                    WHEN 'completed' THEN 'reviewed'
                END;
                """);

            migrationBuilder.DropColumn(
                name: "review_completed_at",
                table: "bikes");

            migrationBuilder.AlterColumn<string>(
                name: "review_status",
                table: "bikes",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "notReviewed",
                oldClrType: typeof(string),
                oldType: "character varying(16)",
                oldMaxLength: 16,
                oldDefaultValue: "draft");

            migrationBuilder.AddCheckConstraint(
                name: "ck_bikes_review_status",
                table: "bikes",
                sql: "review_status IN ('notReviewed', 'inReview', 'reviewed')");
        }
    }
}
