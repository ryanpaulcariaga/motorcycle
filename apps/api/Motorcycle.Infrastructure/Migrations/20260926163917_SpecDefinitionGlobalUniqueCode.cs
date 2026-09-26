using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SpecDefinitionGlobalUniqueCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_spec_definitions_spec_groups_group_id",
                table: "spec_definitions");

            migrationBuilder.DropIndex(
                name: "ix_spec_definitions_group_id_code",
                table: "spec_definitions");

            migrationBuilder.CreateIndex(
                name: "ix_spec_definitions_code",
                table: "spec_definitions",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_spec_definitions_group_id",
                table: "spec_definitions",
                column: "group_id");

            migrationBuilder.AddForeignKey(
                name: "fk_spec_definitions_spec_groups_group_id",
                table: "spec_definitions",
                column: "group_id",
                principalTable: "spec_groups",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_spec_definitions_spec_groups_group_id",
                table: "spec_definitions");

            migrationBuilder.DropIndex(
                name: "ix_spec_definitions_code",
                table: "spec_definitions");

            migrationBuilder.DropIndex(
                name: "ix_spec_definitions_group_id",
                table: "spec_definitions");

            migrationBuilder.CreateIndex(
                name: "ix_spec_definitions_group_id_code",
                table: "spec_definitions",
                columns: new[] { "group_id", "code" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_spec_definitions_spec_groups_group_id",
                table: "spec_definitions",
                column: "group_id",
                principalTable: "spec_groups",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
