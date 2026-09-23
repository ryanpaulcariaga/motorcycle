# Admin Bikes API Contract

All endpoints require the `ActiveAdministrator` authorization policy (an API-managed HttpOnly session with an active `AdminRole`), identical to the existing `/api/admin/bike-models` and `/api/admin/admin-roles` endpoints. Unauthenticated requests receive `401`; authenticated requests without an active administrator role receive `403`.

Base path: `/api/admin/bikes`

## GET /api/admin/bikes

List bike variants, optionally scoped to one `BikeModel`.

**Query parameters**: `modelId` (optional integer) — when present, restricts results to that model's variants.

**Response `200`**: `BikeAdminListItemDto[]`

```json
[
  {
    "id": 12,
    "modelId": 3,
    "modelName": "Ninja 400",
    "brandName": "Kawasaki",
    "variantName": "SE",
    "year": 2024,
    "msrpPrice": 6199.00,
    "isPublished": false,
    "createdAt": "2026-09-20T12:00:00Z",
    "updatedAt": "2026-09-20T12:00:00Z"
  }
]
```

## GET /api/admin/bikes/{id}

Get one variant's full detail, including its current spec values.

**Response `200`**: `BikeAdminDetailDto` (adds `specs: { [code: string]: unknown }` to the list item shape)

**Response `404`**: `{ "message": "Bike was not found." }`

## POST /api/admin/bikes

Create a new variant under an existing `BikeModel`.

**Request**: `CreateBikeRequest`

```json
{
  "modelId": 3,
  "variantName": "SE",
  "year": 2024,
  "msrpPrice": 6199.00,
  "specs": { "engine_displacement_cc": 399, "abs": true }
}
```

**Response `201`**: `BikeAdminDetailDto`

**Response `400`**: missing/invalid `variantName`/`year`, or `specs` contains an unrecognized code or a value that doesn't match the definition's `dataType`.

**Response `404`**: `{ "message": "BikeModel was not found." }` when `modelId` does not reference an existing `BikeModel`.

**Response `409`**: `{ "code": "bike_exists", "message": "A bike with this model, year, and variant name already exists." }`

## PUT /api/admin/bikes/{id}

Edit an existing variant's core fields and/or specs. Allowed regardless of current `isPublished` state; changes to a published variant are immediately visible on the public catalog.

**Request**: `UpdateBikeRequest` (same shape as `CreateBikeRequest`, minus `modelId` reassignment unless explicitly supported)

**Response `200`**: `BikeAdminDetailDto`

**Response `400`/`404`/`409`**: same conditions as `POST`.

## PATCH /api/admin/bikes/{id}/publish

Publish a variant.

**Response `200`**: `BikeAdminDetailDto` with `isPublished: true`

**Response `400`**: `{ "code": "bike_not_publishable", "message": "Bike is missing required details (year, variant name) and cannot be published." }`

**Response `404`**: `{ "message": "Bike was not found." }`

## PATCH /api/admin/bikes/{id}/unpublish

Unpublish a variant. Always succeeds if the variant exists (no precondition beyond existence).

**Response `200`**: `BikeAdminDetailDto` with `isPublished: false`

**Response `404`**: `{ "message": "Bike was not found." }`

## DELETE /api/admin/bikes/{id}

Permanently delete a variant.

**Response `204`**: no content

**Response `404`**: `{ "message": "Bike was not found." }`

**Response `409`**: `{ "code": "bike_referenced", "message": "Bike is referenced by N image(s).", "dependentCount": N }` when one or more `BikeImage` rows reference the bike.

## Notes

- Public, anonymous `/api/bikes*` routes are unchanged by this contract and continue to filter to `isPublished == true` only.
- `specs` validation errors return a field-level breakdown (`{ "code": "invalid", "field": "abs", "message": "..." }` per offending key) so the admin form can surface actionable messages.
- All mutations flow through `Motorcycle.Application`'s `IBikeAdminService`; no controller queries EF Core directly, per the Clean Architecture constitution gate.
