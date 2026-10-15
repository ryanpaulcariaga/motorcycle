# Data Model: Bike Model Reassignment

No entity or schema changes are required.

## Bike

Existing fields relevant to the operation:

- `Id`: identifies the variant.
- `ModelId`: existing BikeModel foreign key; the only business property changed.
- `Year` and `VariantName`: retained as-is and used with the target model for duplicate validation.
- `UpdatedAt`: refreshed when an actual reassignment is persisted.
- `MsrpPrice`, `Slug`, `Specs`, `IsPublished`, `CreatedAt`, and related images: retained unchanged.

## BikeModel

The existing target model must exist. A bike can be reassigned only when moving it does not collide with another bike having the same target model, year, and variant name.

## State transition

`Bike.ModelId = currentModelId` → `Bike.ModelId = targetModelId`

If the selected model is already current, the operation is a no-op. Invalid target IDs and duplicate combinations are rejected without mutating the bike.
