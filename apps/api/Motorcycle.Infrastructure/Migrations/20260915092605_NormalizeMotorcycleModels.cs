using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeMotorcycleModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bikes_brands_brand_id",
                table: "bikes");

            migrationBuilder.DropForeignKey(
                name: "fk_bikes_categories_category_id",
                table: "bikes");

            migrationBuilder.CreateTable(
                name: "motorcycle_models",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    brand_id = table.Column<int>(type: "integer", nullable: false),
                    category_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_motorcycle_models", x => x.id);
                    table.ForeignKey(
                        name: "fk_motorcycle_models_brands_brand_id",
                        column: x => x.brand_id,
                        principalTable: "brands",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_motorcycle_models_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO motorcycle_models (brand_id, category_id, name, created_at)
                SELECT DISTINCT brand_id, category_id, model_name, NOW()
                FROM bikes;
                """);

            migrationBuilder.AddColumn<int>(
                name: "model_id",
                table: "bikes",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE bikes AS b
                SET model_id = m.id
                FROM motorcycle_models AS m
                WHERE m.brand_id = b.brand_id
                  AND m.category_id = b.category_id
                  AND m.name = b.model_name;
                """);

            migrationBuilder.DropIndex(
                name: "ix_bikes_brand_id",
                table: "bikes");

            migrationBuilder.DropColumn(
                name: "brand_id",
                table: "bikes");

            migrationBuilder.DropIndex(
                name: "ix_bikes_category_id",
                table: "bikes");

            migrationBuilder.DropColumn(
                name: "category_id",
                table: "bikes");

            migrationBuilder.RenameColumn(
                name: "model_name",
                table: "bikes",
                newName: "variant_name");

            migrationBuilder.Sql("UPDATE bikes SET variant_name = 'Standard';");

            migrationBuilder.AlterColumn<int>(
                name: "model_id",
                table: "bikes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_bikes_model_id",
                table: "bikes",
                column: "model_id");

            migrationBuilder.CreateIndex(
                name: "ix_motorcycle_models_brand_id_name",
                table: "motorcycle_models",
                columns: new[] { "brand_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_motorcycle_models_category_id",
                table: "motorcycle_models",
                column: "category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bikes_motorcycle_models_model_id",
                table: "bikes",
                column: "model_id",
                principalTable: "motorcycle_models",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bikes_motorcycle_models_model_id",
                table: "bikes");

            migrationBuilder.AddColumn<int>(
                name: "brand_id",
                table: "bikes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "category_id",
                table: "bikes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "model_name",
                table: "bikes",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE bikes AS b
                SET brand_id = m.brand_id,
                    category_id = m.category_id,
                    model_name = m.name
                FROM motorcycle_models AS m
                WHERE m.id = b.model_id;
                """);

            migrationBuilder.DropIndex(
                name: "ix_bikes_model_id",
                table: "bikes");

            migrationBuilder.DropColumn(
                name: "model_id",
                table: "bikes");

            migrationBuilder.DropTable(
                name: "motorcycle_models");

            migrationBuilder.DropColumn(
                name: "variant_name",
                table: "bikes");

            migrationBuilder.CreateIndex(
                name: "ix_bikes_brand_id",
                table: "bikes",
                column: "brand_id");

            migrationBuilder.CreateIndex(
                name: "ix_bikes_category_id",
                table: "bikes",
                column: "category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bikes_brands_brand_id",
                table: "bikes",
                column: "brand_id",
                principalTable: "brands",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_bikes_categories_category_id",
                table: "bikes",
                column: "category_id",
                principalTable: "categories",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
