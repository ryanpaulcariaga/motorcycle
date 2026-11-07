using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeSpecVerifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bike_spec_verifications",
                columns: table => new
                {
                    bike_id = table.Column<int>(type: "integer", nullable: false),
                    spec_definition_id = table.Column<int>(type: "integer", nullable: false),
                    source_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bike_spec_verifications", x => new { x.bike_id, x.spec_definition_id });
                    table.ForeignKey(
                        name: "fk_bike_spec_verifications_bikes_bike_id",
                        column: x => x.bike_id,
                        principalTable: "bikes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_bike_spec_verifications_spec_definitions_spec_definition_id",
                        column: x => x.spec_definition_id,
                        principalTable: "spec_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bike_spec_verifications_spec_definition_id",
                table: "bike_spec_verifications",
                column: "spec_definition_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bike_spec_verifications");
        }
    }
}
