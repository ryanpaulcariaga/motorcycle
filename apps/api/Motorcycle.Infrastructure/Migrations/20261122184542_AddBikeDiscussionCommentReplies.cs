using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Motorcycle.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeDiscussionCommentReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "parent_comment_id",
                table: "bike_discussion_comments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_bike_discussion_comments_parent_comment_id",
                table: "bike_discussion_comments",
                column: "parent_comment_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bike_discussion_comments_bike_discussion_comments_parent_co~",
                table: "bike_discussion_comments",
                column: "parent_comment_id",
                principalTable: "bike_discussion_comments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bike_discussion_comments_bike_discussion_comments_parent_co~",
                table: "bike_discussion_comments");

            migrationBuilder.DropIndex(
                name: "ix_bike_discussion_comments_parent_comment_id",
                table: "bike_discussion_comments");

            migrationBuilder.DropColumn(
                name: "parent_comment_id",
                table: "bike_discussion_comments");
        }
    }
}
