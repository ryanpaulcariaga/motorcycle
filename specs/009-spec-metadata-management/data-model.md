# Data Model: Specification Metadata Management

## SpecGroup

| Field | Type / Constraint | Notes |
|---|---|---|
| `id` | int, PK, identity | Unchanged. |
| `code` | string, required, max 100, **globally unique** (unchanged — already enforced by `ix_spec_groups_code`) | Lowercase snake_case, `^[a-z][a-z0-9_]*$`. Not used as a `bikes.specs` key, so renaming it never touches bike data. |
| `name` | string, required, max 255 | Display label shown in public/admin UIs. |
| `sortOrder` | int, required, default 0 | Ordered globally against every other `SpecGroup`. Reorder via bulk endpoint (see contracts). |
| `iconName` | string, optional, max 255 | Unchanged, cosmetic only. |
| `createdAt` | UTC timestamp | Unchanged, set on create. |

**New validation**: `code`/`name` non-empty; `code` format regex; `code` uniqueness (case-insensitive) checked in the application service in addition to the existing DB unique index, so a friendly `409 spec_group_code_exists` is returned before the index would throw a raw DB constraint violation.

**Delete rule (changed)**: Deleting a `SpecGroup` is rejected with `409 spec_group_referenced` (plus a dependent-definition count) while `SpecDefinition` rows reference it. The FK (`SpecDefinition.GroupId` → `SpecGroup.Id`) changes from `OnDelete(Cascade)` to `OnDelete(Restrict)` in a new migration, so the database also refuses the cascade.

## SpecDefinition

| Field | Type / Constraint | Notes |
|---|---|---|
| `id` | int, PK, identity | Unchanged. |
| `groupId` | int, required, FK → `SpecGroup.Id` | Editable — moving a definition to a different group is a normal update, not a special operation. Restrict on delete (see above). |
| `code` | string, required, max 100, **globally unique (changed from per-group)** | Lowercase snake_case, `^[a-z][a-z0-9_]*$`. This is the `bikes.specs` JSONB key. Renaming triggers the cascade described below. |
| `label` | string, required, max 255 | Unchanged. |
| `dataType` | string, required, one of `number`/`text`/`boolean`/`enum` | Unchanged enumeration; validated the same way `BikeValidators.IsValueValidForType` already validates bike spec values. |
| `unit` | string, optional, max 50 | Unchanged. |
| `sortOrder` | int, required, default 0 | Ordered within its own `groupId`, independent of other groups' definition orders. Reorder via bulk endpoint (see contracts). Moving to a new group without an explicit reorder appends the definition at the end of the new group's order (`max(sortOrder) + 1` within that group). |
| `isFilterable` | bool, required, default false | Unchanged. |
| `filterType` | string, nullable | Required (non-null) when `isFilterable` is true; must be null when `isFilterable` is false; must match one of the currently registered `ISpecFilterStrategy.FilterType` values (dynamic, not hardcoded — see research.md). |
| `createdAt` | UTC timestamp | Unchanged, set on create. |

**Schema change**: unique index moves from `(group_id, code)` to `code` alone (see research.md migration approach). `group_id` keeps its existing (non-unique) index for lookups by group.

**Delete rule (changed)**: Deleting a `SpecDefinition` is rejected with `409 spec_definition_referenced` (plus an affected-bike count) while any `Bike.Specs` contains a non-null value under its `code`.

## Bike.Specs (existing entity, new write path only)

No schema change. This feature adds exactly one new write path into the existing `bikes.specs` JSONB column: the rename-cascade bulk `UPDATE` described in research.md, executed only when a `SpecDefinition.Code` changes and only for rows where the *old* code key is present. All other reads/writes of `Bike.Specs` (via the existing bike admin create/edit endpoints, public detail/compare responses) are unaffected and unchanged by this feature.

## State Transitions

### SpecGroup

| Transition | Validation | Result |
|---|---|---|
| Create | `code` format + uniqueness (case-insensitive); `name` non-empty | New `SpecGroup` persisted; `sortOrder` defaults to end-of-list unless supplied. |
| Update | Same as create, excluding self when checking `code` uniqueness | Fields replaced; renaming `code` has no cascade (not a `bikes.specs` key). |
| Reorder | All submitted IDs exist | `sortOrder` set per the submitted order across all groups. |
| Delete | Zero child `SpecDefinition` rows | Group permanently removed. |
| Delete blocked | ≥1 child `SpecDefinition` row | No data removed; `409 spec_group_referenced` with dependent count. |

### SpecDefinition

| Transition | Validation | Result |
|---|---|---|
| Create | `code` format + uniqueness (case-insensitive, global); `label` non-empty; `dataType` valid; `groupId` exists; `filterType`/`isFilterable` consistency | New `SpecDefinition` persisted; `sortOrder` defaults to end-of-list within its group unless supplied. |
| Update (no code change) | Same as create, excluding self when checking `code` uniqueness | Fields replaced; if `groupId` changed and no explicit `sortOrder` supplied, `sortOrder` is re-appended at the end of the new group's list. |
| Update (code change) | Same as above, plus: new code must not equal any other definition's code (case-insensitive); old code and new code both captured | Definition's `code` updated **and**, in the same transaction, every `Bike.Specs` entry keyed by the old code is renamed to the new code, preserving its value. A rename to the same code (no-op) is a normal successful update with no bulk SQL executed. |
| Reorder (within a group) | All submitted IDs exist and share the same `groupId` | `sortOrder` set per the submitted order within that group. |
| Delete | Zero bikes with a non-null value under this definition's `code` | Definition permanently removed. |
| Delete blocked | ≥1 bike with a non-null value under this definition's `code` | No data removed; `409 spec_definition_referenced` with affected-bike count. |

## Related Entities (read-only in this feature)

| Entity | Fields used | Relationship |
|---|---|---|
| `Bike` | `id`, `specs` | Target of the rename-cascade bulk update; otherwise unaffected — value editing continues through the existing `/api/admin/bikes` endpoints. |
| `ISpecFilterStrategy` (all registered implementations) | `FilterType` | Read-only source of truth for validating `filterType` values; no changes to the strategies themselves. |
