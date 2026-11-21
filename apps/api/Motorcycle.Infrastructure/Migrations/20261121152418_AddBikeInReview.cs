using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeInReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_in_review",
                table: "bikes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_in_review",
                table: "bikes");
        }
    }
}
