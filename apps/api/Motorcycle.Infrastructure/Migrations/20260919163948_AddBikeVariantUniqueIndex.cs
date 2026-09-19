using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeVariantUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_bikes_model_id_year_variant_name",
                table: "bikes",
                columns: new[] { "model_id", "year", "variant_name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_bikes_model_id_year_variant_name",
                table: "bikes");
        }
    }
}
