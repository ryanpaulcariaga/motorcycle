using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeComparisons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bike_comparisons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    bike_a_id = table.Column<int>(type: "integer", nullable: false),
                    bike_b_id = table.Column<int>(type: "integer", nullable: false),
                    compare_count = table.Column<int>(type: "integer", nullable: false),
                    first_compared_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_compared_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bike_comparisons", x => x.id);
                    table.CheckConstraint("ck_bike_comparisons_ordered", "bike_a_id < bike_b_id");
                    table.ForeignKey(
                        name: "fk_bike_comparisons_bikes_bike_a_id",
                        column: x => x.bike_a_id,
                        principalTable: "bikes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_bike_comparisons_bikes_bike_b_id",
                        column: x => x.bike_b_id,
                        principalTable: "bikes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bike_comparisons_bike_a_id_bike_b_id",
                table: "bike_comparisons",
                columns: new[] { "bike_a_id", "bike_b_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_bike_comparisons_bike_b_id",
                table: "bike_comparisons",
                column: "bike_b_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bike_comparisons");
        }
    }
}
