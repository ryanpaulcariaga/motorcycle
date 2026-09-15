# Data Model: Admin Catalog Management

Stage 1 adds one authorization entity and manages the existing BikeModel aggregate. No frontend or API mutation path is added for bikes, images, or specification metadata.

## Administrator Role

| Field | Type/shape | Rules |
|---|---|---|
| `id` | integer identity | Stable internal record identifier. |
| `facebookUserId` | required string | Unique stable identity from Facebook; immutable after creation. |
| `emailSnapshot` | nullable string | Latest known email value for administration visibility; not an identity key. |
| `displayNameSnapshot` | nullable string | Latest known display name for administration visibility. |
| `role` | required controlled value | Stage 1 accepts only `Administrator`; unknown values are rejected. |
| `isActive` | boolean | Active records may authorize; inactive records remain stored and cannot authorize. |
| `createdAt` | UTC timestamp | Set when provisioned and never changed. |
| `updatedAt` | UTC timestamp | Set whenever role, status, or snapshots change. |

### Role State Transitions

| Transition | Allowed by | Result |
|---|---|---|
| Provision | Active administrator | Creates one active role record for an unassigned Facebook user ID. |
| Activate | Active administrator | Sets `isActive` to true; record remains otherwise unchanged. |
| Deactivate | Active administrator | Sets `isActive` to false; record remains queryable and immediately loses authorization. |
| Refresh snapshots / change role | Active administrator | Updates permitted mutable fields and `updatedAt`; Facebook user ID cannot change. |
| Delete | Nobody | Not supported in Stage 1. |

## BikeModel Aggregate

| Entity | Fields used by Stage 1 | Relationships and rules |
|---|---|---|
| `BikeModel` | `id`, `brandId`, `categoryId`, `name`, `createdAt` | Brand and category must exist. `(brandId, name)` is unique. One model has zero or more Bikes. |
| `Brand` | `id`, `name` | Existing lookup entity; name is unique. Used by BikeModel create/edit forms. |
| `Category` | `id`, `name` | Existing lookup entity; name is unique. Used by BikeModel create/edit forms. |
| `Bike` | `id`, `modelId` | Existing dependent entity. Any reference blocks BikeModel deletion. Bike mutations are deferred. |

### BikeModel State Transitions

| Transition | Validation | Result |
|---|---|---|
| Create | Required existing brand/category, non-empty bounded name, unique brand/name pair | New BikeModel is persisted. |
| Update | Same validation; target exists | Existing values are replaced and returned. |
| Delete | Target exists and dependent-bike count is zero | BikeModel is removed. |
| Delete blocked | One or more Bikes reference target | No data is removed; return `409` with `bike_model_referenced`. |

## Data Integrity and Persistence

- API services, not the admin client, enforce required fields, foreign-key existence, uniqueness, and delete protection.
- The existing database cascade from BikeModel to Bike remains in place, but the application check prevents a referenced model from reaching delete persistence.
- `AdminRole` schema changes use the existing EF Core migration and snake_case naming conventions.
- Unique identity and `(brand_id, name)` constraints are database-backed as well as application-validated to handle races.
- Role records are never physically deleted in Stage 1.
