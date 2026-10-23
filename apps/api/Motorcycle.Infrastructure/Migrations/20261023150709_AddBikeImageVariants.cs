using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeImageVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "height",
                table: "bike_images",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "large_url",
                table: "bike_images",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "medium_url",
                table: "bike_images",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "small_url",
                table: "bike_images",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "width",
                table: "bike_images",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "xl_url",
                table: "bike_images",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "height",
                table: "bike_images");

            migrationBuilder.DropColumn(
                name: "large_url",
                table: "bike_images");

            migrationBuilder.DropColumn(
                name: "medium_url",
                table: "bike_images");

            migrationBuilder.DropColumn(
                name: "small_url",
                table: "bike_images");

            migrationBuilder.DropColumn(
                name: "width",
                table: "bike_images");

            migrationBuilder.DropColumn(
                name: "xl_url",
                table: "bike_images");
        }
    }
}
