# Admin API Contract

Stage 1 endpoints in this contract are planned. They use the shared ASP.NET Core API and require a valid Facebook OAuth2-backed admin session or bearer token accepted by the API's configured admin allowlist.

## Boundary

- Base path: `/api/admin`
- Authorization: authenticated administrator required for every endpoint
- Public catalog routes remain under their existing paths and remain read-only
- Requests and responses use Application DTOs mirrored by `apps/admin` TypeScript types

## BikeModel Operations (Stage 1)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/bike-models` | List BikeModel records for administration |
| `POST` | `/api/admin/bike-models` | Create a BikeModel |
| `GET` | `/api/admin/bike-models/{id}` | Read a BikeModel for editing |
| `PUT` | `/api/admin/bike-models/{id}` | Update a BikeModel |
| `DELETE` | `/api/admin/bike-models/{id}` | Delete a BikeModel when no bikes reference it |

`CreateBikeModelRequest` and `UpdateBikeModelRequest` include `brandId`, `categoryId`, and `name`. Deleting a referenced BikeModel returns `409 Conflict` with an actionable error code/message. Bike CRUD is deferred to a later stage.

## Deferred Operations

Bike CRUD, Azure Blob image upload/assignment, and spec-group/spec-definition CRUD are intentionally deferred and must not be added to the Stage 1 contract.

## Metadata Operations

Protected CRUD endpoints manage `/brands`, `/categories`, `/spec-groups`, and `/spec-definitions` below the same `/api/admin` boundary. Their requests include the entity fields listed in [data-model.md](../data-model.md); metadata reorder requests include an explicit `sortOrder`.

## Image Operations

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/bikes/{id}/images` | Upload and assign an image through the API |
| `PUT` | `/api/admin/bikes/{id}/images/{imageId}` | Change sort order or primary state |
| `DELETE` | `/api/admin/bikes/{id}/images/{imageId}` | Remove an image assignment |

The upload endpoint accepts `multipart/form-data`. The API validates allowed image formats and configured size limits, stores the image using server-side Blob Storage access, and returns the assigned image DTO. Setting `isPrimary` to true makes that image the motorcycle's sole primary image.
