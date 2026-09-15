# Data Model: Admin Catalog Management

The admin feature uses the existing catalog model; no separate administration data store is introduced.

## Existing Managed Entities

| Entity | Admin-managed fields | Rules |
|---|---|---|
| `Bike` | brand, category, model name, year, MSRP, slug, `specs`, publication state | Brand and category must exist; slug is unique; each supplied spec code must have a definition and its value must match the definition data type |
| `BikeImage` | image URL, sort order, primary state | Belongs to one bike; image assignment is removed when deleted; a motorcycle has at most one primary image |
| `Brand` | name, logo URL | Name is unique |
| `Category` | name | Name is unique |
| `SpecGroup` | code, name, sort order, icon name | Code is unique; groups order specification metadata |
| `SpecDefinition` | group, code, label, data type, unit, sort order, filterability, filter type | Group must exist; code is unique within its group; data type governs allowed motorcycle spec values |

## State Transitions

| Entity | Transition | Authorization and validation |
|---|---|---|
| Bike | Draft/unpublished to published | Administrator only; all required catalog data and assigned primary image rules must pass |
| Bike | Published to unpublished | Administrator only; the bike is removed from public results |
| BikeImage | Non-primary to primary | Administrator only; atomically clear any existing primary image for that bike |
| Spec metadata | Create, update, reorder, delete | Administrator only; prevent deletion or require migration of metadata referenced by existing motorcycle values |

## Data Integrity

- All mutations run through application validation and EF Core persistence.
- The API, rather than the admin client, enforces unique names/codes/slugs and image-primary invariants.
- Schema changes remain EF Core migration changes in `Motorcycle.Infrastructure/Migrations/`.
- Audit-log requirements are deferred until the administrator identity and compliance needs are finalized.
