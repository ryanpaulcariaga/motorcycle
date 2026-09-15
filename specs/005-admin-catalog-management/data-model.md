# Data Model: Admin Catalog Management

The admin feature uses the existing catalog model; no separate administration data store is introduced. Stage 1 manages `BikeModel`; the other catalog entities below are documented for later stages.

## Existing Managed Entities

| Entity | Admin-managed fields | Rules |
|---|---|---|
| `BikeModel` | brand, category, model-line name | Brand and category must exist; `(brand, name)` is unique; a model line groups its variants |
| `Bike` | Deferred: model, complete source variant name, year, MSRP, slug, `specs`, publication state | Later bike CRUD must enforce model existence, source variant labels, unique slugs, spec validation, and year `0` for unknown imported years |
| `BikeImage` | Deferred: image URL, sort order, primary state | Later image stage; belongs to one bike and allows at most one primary image |
| `Brand` | name, logo URL | Name is unique |
| `Category` | name | Name is unique |
| `SpecGroup` | Deferred: code, name, sort order, icon name | Later specification metadata stage |
| `SpecDefinition` | Deferred: group, code, label, data type, unit, sort order, filterability, filter type | Later specification metadata stage |

## State Transitions

| Entity | Transition | Authorization and validation |
|---|---|---|
| BikeModel | Create, update, delete | Administrator only; deletion is rejected when any Bike references the model |
| Bike | Publication and CRUD | Deferred to a later stage |
| BikeImage | Image assignment and primary state | Deferred to a later stage |
| Spec metadata | Create, update, reorder, delete | Deferred to a later stage |

## Data Integrity

- All mutations run through application validation and EF Core persistence.
- The API, rather than the admin client, enforces unique BikeModel names and the BikeModel deletion conflict rule.
- Schema changes remain EF Core migration changes in `Motorcycle.Infrastructure/Migrations/`.
- Audit-log requirements are deferred until the administrator identity and compliance needs are finalized.
