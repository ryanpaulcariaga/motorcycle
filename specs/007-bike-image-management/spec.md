# Feature Specification: Bike Image Management

**Feature Branch**: `007-bike-image-management`
**Status**: Implemented; focused acceptance validation outstanding

## User Scenarios

### Upload and manage bike images
An active administrator can upload images to a bike variant, view its assigned images, choose one primary image, reorder images, and remove an image. Public bike detail and list responses use the stored public URLs.

### Acceptance Scenarios

1. An administrator uploads a supported image and it appears in the bike's image list and public URL response.
2. An administrator marks one image primary and all other images become non-primary.
3. An administrator reorders assigned images and the new order persists.
4. An administrator deletes an image and the database reference and Blob object are removed.
5. Unauthenticated and non-administrator requests cannot mutate or inspect admin image assignments.
6. Invalid file types, empty files, and oversized files are rejected without creating a database row.

## Functional Requirements

- **FR-001**: The API MUST own all Blob Storage operations; browsers MUST NOT receive storage credentials.
- **FR-002**: Image mutations MUST require the existing active-administrator policy.
- **FR-003**: Uploads MUST accept only configured raster image types and enforce a maximum file size.
- **FR-004**: Each bike MAY have multiple images, with at most one primary image.
- **FR-005**: Image ordering MUST be persisted and returned in ascending order.
- **FR-006**: Removing an image MUST remove both its database reference and Blob object.
- **FR-007**: Public catalog responses MUST continue exposing only images belonging to published bikes.

## Assumptions

- The provisioned `images` container is public-read for marketing images.
- The API uses the existing `BikeImage` table; no migration is needed.
- Uploads are limited to 10 MiB and JPEG, PNG, WebP, or GIF content types.
