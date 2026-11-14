using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsDailyCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "analytics_daily_counts",
                columns: table => new
                {
                    day = table.Column<DateOnly>(type: "date", nullable: false),
                    metric = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    dimension1 = table.Column<int>(type: "integer", nullable: false),
                    dimension2 = table.Column<int>(type: "integer", nullable: false),
                    count = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_analytics_daily_counts", x => new { x.day, x.metric, x.dimension1, x.dimension2 });
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "analytics_daily_counts");
        }
    }
}
