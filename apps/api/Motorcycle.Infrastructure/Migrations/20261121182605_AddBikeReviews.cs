using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM bike_comments;");

            migrationBuilder.DropColumn(
                name: "author_name",
                table: "bike_comments");

            migrationBuilder.DropColumn(
                name: "is_approved",
                table: "bike_comments");

            migrationBuilder.AlterColumn<string>(
                name: "body",
                table: "bike_comments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "rating",
                table: "bike_comments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "bike_comments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "bike_comments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_bike_comments_bike_id",
                table: "bike_comments",
                column: "bike_id");

            migrationBuilder.CreateIndex(
                name: "ix_bike_comments_bike_id_user_id",
                table: "bike_comments",
                columns: new[] { "bike_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_bike_comments_user_id",
                table: "bike_comments",
                column: "user_id");

            migrationBuilder.AddCheckConstraint(
                name: "ck_bike_comments_rating",
                table: "bike_comments",
                sql: "rating BETWEEN 1 AND 5");

            migrationBuilder.AddForeignKey(
                name: "fk_bike_comments_bikes_bike_id",
                table: "bike_comments",
                column: "bike_id",
                principalTable: "bikes",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_bike_comments_users_user_id",
                table: "bike_comments",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bike_comments_bikes_bike_id",
                table: "bike_comments");

            migrationBuilder.DropForeignKey(
                name: "fk_bike_comments_users_user_id",
                table: "bike_comments");

            migrationBuilder.DropIndex(
                name: "ix_bike_comments_bike_id",
                table: "bike_comments");

            migrationBuilder.DropIndex(
                name: "ix_bike_comments_bike_id_user_id",
                table: "bike_comments");

            migrationBuilder.DropIndex(
                name: "ix_bike_comments_user_id",
                table: "bike_comments");

            migrationBuilder.DropCheckConstraint(
                name: "ck_bike_comments_rating",
                table: "bike_comments");

            migrationBuilder.DropColumn(
                name: "rating",
                table: "bike_comments");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "bike_comments");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "bike_comments");

            migrationBuilder.AlterColumn<string>(
                name: "body",
                table: "bike_comments",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "author_name",
                table: "bike_comments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_approved",
                table: "bike_comments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
