# Data Model: Bike Catalog Management

Stage 2 adds no new tables or columns. It adds administrator-facing mutation and validation over the existing `Bike` entity (and read/reference use of `BikeImage`, `BikeModel`, and specification metadata). Field names below are the existing EF Core model in `Motorcycle.Domain`.

## Bike (variant)

| Field | Type/shape | Rules |
|---|---|---|
| `id` | integer identity | Stable internal record identifier. |
| `modelId` | required integer (FK → BikeModel) | Must reference an existing `BikeModel`; immutable after creation is not required, but changing it must re-validate the uniqueness rule below. |
| `variantName` | required string | Non-empty, bounded length. Combined with `modelId` and `year`, must be unique. |
| `year` | required integer | Must be present (a value of `0` represents "unknown source year" per existing convention, but administrator-created variants must supply a real year to be considered valid for publish). |
| `msrpPrice` | nullable decimal | Optional; not required to save a draft, but recommended before publishing. |
| `slug` | string | Generated using the existing convention already used by public catalog routes; not manually edited by administrators in this stage. |
| `specs` | JSONB key/value map | Keys must match an existing `SpecDefinition.Code` (across all groups, not category-filtered); values must match the definition's `DataType` (`number`, `text`, `boolean`, `enum`). Unrecognized keys or mismatched types are rejected. |
| `isPublished` | boolean | Gates public visibility. Defaults to `false` on create. Can be toggled independently of edits to other fields (no unpublish-before-edit requirement). |
| `createdAt` | UTC timestamp | Set on creation, never changed. |
| `updatedAt` | UTC timestamp | Set whenever any mutable field changes, including publish-state toggles. |

### Bike State Transitions

| Transition | Validation | Result |
|---|---|---|
| Create | `BikeModel` referenced by `modelId` exists; `variantName` and `year` present; `(modelId, year, variantName)` unique; submitted `specs` keys/types valid | New `Bike` is persisted with `isPublished = false`. |
| Update | Same field validation as create; target `Bike` exists | Existing values are replaced and returned, regardless of current `isPublished` state. |
| Publish | Target exists; `variantName` and `year` are present (minimum required core details) | `isPublished` set to `true`; variant becomes visible on public catalog/detail/comparison routes immediately. |
| Unpublish | Target exists | `isPublished` set to `false`; variant is hidden from public routes immediately but remains in admin. |
| Delete | Target exists; zero dependent `BikeImage` rows | `Bike` row is permanently removed (hard delete). |
| Delete blocked | One or more `BikeImage` rows reference target `Bike.Id` | No data is removed; return `409` with `bike_referenced` and the dependent image count. |

## Related Entities (read-only in this feature)

| Entity | Fields used | Relationship |
|---|---|---|
| `BikeModel` | `id`, `brandId`, `categoryId`, `name` | Parent of `Bike`. Must exist for create/update. Unchanged by this feature. |
| `BikeImage` | `id`, `bikeId` | Existing dependent entity; any reference blocks `Bike` deletion. Image upload/assignment remains a separate, deferred feature. |
| `SpecGroup` / `SpecDefinition` | `code`, `dataType`, `groupId`, `sortOrder` | Read-only lookup used to validate and label submitted `specs` values. Not category-scoped. |

## Data Integrity and Persistence

- API services (not the admin client) enforce required fields, `BikeModel` existence, `(modelId, year, variantName)` uniqueness, publish-readiness, and delete protection.
- The existing database relationship from `Bike` to `BikeImage` remains in place; the application check prevents a referenced `Bike` from reaching delete persistence, mirroring the existing `BikeModel` → `Bike` protection.
- Uniqueness is enforced both at the application layer and, where practical, via a database unique index to handle races (added if not already present on `(model_id, year, variant_name)`).
- No new migration is required for `Bike`/`BikeImage` columns; any uniqueness index addition is a migration containing only an index, not a schema/column change.
- Deleted `Bike` rows are not recoverable; no soft-delete/archived state is introduced this stage.
