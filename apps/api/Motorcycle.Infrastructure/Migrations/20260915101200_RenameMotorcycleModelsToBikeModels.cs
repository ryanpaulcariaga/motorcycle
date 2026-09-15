using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameMotorcycleModelsToBikeModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bikes_motorcycle_models_model_id",
                table: "bikes");

            migrationBuilder.AlterColumn<int>(
                name: "year",
                table: "bikes",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.RenameTable(
                name: "motorcycle_models",
                newName: "bike_models");

            migrationBuilder.RenameIndex(
                name: "ix_motorcycle_models_brand_id_name",
                table: "bike_models",
                newName: "ix_bike_models_brand_id_name");

            migrationBuilder.RenameIndex(
                name: "ix_motorcycle_models_category_id",
                table: "bike_models",
                newName: "ix_bike_models_category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bikes_bike_models_model_id",
                table: "bikes",
                column: "model_id",
                principalTable: "bike_models",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bikes_bike_models_model_id",
                table: "bikes");

            migrationBuilder.AlterColumn<int>(
                name: "year",
                table: "bikes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.RenameTable(
                name: "bike_models",
                newName: "motorcycle_models");

            migrationBuilder.RenameIndex(
                name: "ix_bike_models_brand_id_name",
                table: "motorcycle_models",
                newName: "ix_motorcycle_models_brand_id_name");

            migrationBuilder.RenameIndex(
                name: "ix_bike_models_category_id",
                table: "motorcycle_models",
                newName: "ix_motorcycle_models_category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bikes_motorcycle_models_model_id",
                table: "bikes",
                column: "model_id",
                principalTable: "motorcycle_models",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
