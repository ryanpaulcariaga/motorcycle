# Admin API Contract

All endpoints in this contract are planned. They use the shared ASP.NET Core API and require a valid Microsoft Entra ID bearer token with the configured administrator role or group claim.

## Boundary

- Base path: `/api/admin`
- Authorization: authenticated administrator required for every endpoint
- Public catalog routes remain under their existing paths and remain read-only
- Requests and responses use Application DTOs mirrored by `apps/admin` TypeScript types

## Catalog Operations

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/bikes` | Search and page all bikes, including unpublished entries |
| `POST` | `/api/admin/bikes` | Create a bike |
| `GET` | `/api/admin/bikes/{id}` | Read a bike for editing |
| `PUT` | `/api/admin/bikes/{id}` | Update bike details, specs, and publication state |
| `DELETE` | `/api/admin/bikes/{id}` | Delete a bike subject to referential-integrity rules |

`CreateBikeRequest` and `UpdateBikeRequest` include `brandId`, `categoryId`, `modelName`, `year`, `msrpPrice`, `slug`, `specs`, and `isPublished`. The API validates supplied `specs` against current specification definitions.

## Metadata Operations

Protected CRUD endpoints manage `/brands`, `/categories`, `/spec-groups`, and `/spec-definitions` below the same `/api/admin` boundary. Their requests include the entity fields listed in [data-model.md](../data-model.md); metadata reorder requests include an explicit `sortOrder`.

## Image Operations

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/bikes/{id}/images` | Upload and assign an image through the API |
| `PUT` | `/api/admin/bikes/{id}/images/{imageId}` | Change sort order or primary state |
| `DELETE` | `/api/admin/bikes/{id}/images/{imageId}` | Remove an image assignment |

The upload endpoint accepts `multipart/form-data`. The API validates allowed image formats and configured size limits, stores the image using server-side Blob Storage access, and returns the assigned image DTO. Setting `isPrimary` to true makes that image the motorcycle's sole primary image.
