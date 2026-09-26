# API Contract: Spec Metadata Administration

Base path: `/api/admin`. All endpoints require the `ActiveAdministrator` policy (same session/cookie boundary as every other `/api/admin` route). Public, anonymous `GET /api/spec-groups` is unchanged by this feature and continues to be the read surface for `apps/web` and the existing bike admin form.

## Spec Groups

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/spec-groups` | List all groups with their definitions (same shape as the public endpoint, but not cached, for immediate admin-side consistency after a write). |
| `GET` | `/api/admin/spec-groups/{id}` | Single group detail. |
| `POST` | `/api/admin/spec-groups` | Create a group. |
| `PUT` | `/api/admin/spec-groups/{id}` | Update a group's `code`, `name`, `iconName`. |
| `PUT` | `/api/admin/spec-groups/order` | Bulk-reorder groups: body `{ "groupIds": [3, 1, 2] }`; sets `sortOrder` for every listed group in that order. |
| `DELETE` | `/api/admin/spec-groups/{id}` | Delete an empty group. `409` with `spec_group_referenced` + dependent-definition count if it still has definitions. |

`CreateSpecGroupRequest` / `UpdateSpecGroupRequest`: `{ code, name, iconName? }`. `code` is validated for format and global uniqueness (case-insensitive); duplicate returns `409` with `spec_group_code_exists`.

## Spec Definitions

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/spec-definitions` | List all definitions (optionally `?groupId=` to scope), including current `groupId`, `sortOrder`, and all other fields. |
| `GET` | `/api/admin/spec-definitions/{id}` | Single definition detail. |
| `POST` | `/api/admin/spec-definitions` | Create a definition under an existing group. |
| `PUT` | `/api/admin/spec-definitions/{id}` | Update a definition, including a `code` rename (triggers the bike-spec rename-cascade transactionally) and/or a `groupId` change (move to another group). |
| `PUT` | `/api/admin/spec-groups/{groupId}/spec-definitions/order` | Bulk-reorder definitions within one group: body `{ "definitionIds": [5, 2, 9] }`; sets `sortOrder` for every listed definition, scoped to `groupId`. All IDs must currently belong to `groupId` or the request is rejected. |
| `DELETE` | `/api/admin/spec-definitions/{id}` | Delete a definition. `409` with `spec_definition_referenced` + affected-bike count if any bike currently has a non-null value under its code. |

`CreateSpecDefinitionRequest` / `UpdateSpecDefinitionRequest`:

```jsonc
{
  "groupId": 1,
  "code": "cubic_centimeter",
  "label": "Displacement",
  "dataType": "number",   // number | text | boolean | enum
  "unit": "cc",           // optional
  "isFilterable": true,
  "filterType": "range"   // required when isFilterable = true; must match a registered ISpecFilterStrategy
}
```

- `code` duplicate (case-insensitive, across all groups) → `409` with `spec_definition_code_exists`.
- Unknown `groupId` → `400` with a field-level validation error.
- `isFilterable = true` with missing/unsupported `filterType`, or `isFilterable = false` with a non-null `filterType` → `400` field-level validation error.
- Invalid `code` format → `400` field-level validation error.

## Errors

Same shared conventions as every other `/api/admin` surface (`docs/api.md`):

- `401 Unauthorized` — missing/expired admin session.
- `403 Forbidden` — session valid but no active `AdminRole`.
- `400 Bad Request` — field-level validation errors (required fields, format, type/filter consistency).
- `404 Not Found` — unknown group/definition ID.
- `409 Conflict` — `spec_group_code_exists`, `spec_definition_code_exists`, `spec_group_referenced`, `spec_definition_referenced`.

## Rename-Cascade Behavior (informative, not a separate endpoint)

`PUT /api/admin/spec-definitions/{id}` is the *only* endpoint that can change `code`. When the submitted `code` differs from the definition's current code (case-insensitive comparison to detect a true rename, not just a casing tweak — casing tweaks are also allowed and treated as a rename to the newly-cased value):

1. Validate the new code (format + global uniqueness against every *other* definition).
2. In one database transaction: update the `SpecDefinition.Code` column, then execute the bulk `bikes.specs` key-rename statement (see research.md) scoped to bikes that currently hold the old code.
3. Commit both together; return the updated definition. Any failure rolls back both changes and returns an error — no partial rename is ever observable.

No separate "preview" or "dry run" endpoint is introduced in this iteration; the admin UI should show a confirmation dialog before submitting a code change, since it affects existing bike data.
