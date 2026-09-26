# Research: Specification Metadata Management

## Decision: Make `spec_definitions.code` globally unique (not per-group)

**Rationale**: `bikes.specs` is a single flat JSONB map keyed by `code` (see `Motorcycle.Domain.Bike.Specs`, `Dictionary<string, object>`), consumed by `BikeService`/`BikeAdminService` via `bike.Specs.TryGetValue(def.Code, ...)` with no group qualifier. The current schema only enforces uniqueness on `(group_id, code)` (`ix_spec_definitions_group_id_code`), so two different groups could hold the same code today, and any bike's stored value under that code would be ambiguous — it could belong to either definition. Global uniqueness is the only design that keeps the flat map unambiguous, and it is what the user explicitly asked for.

**Migration approach**: Add a new EF Core migration that:
1. Runs a pre-check query (`SELECT code, COUNT(*) FROM spec_definitions GROUP BY code HAVING COUNT(*) > 1`) is not something EF migrations can conditionally branch on at deploy time; instead, verified once via the current seed data (all codes in `DatabaseSeeder`/`MotorcycleDataSeeder` are already globally unique — confirmed by inspection, no duplicates across the Engine/Body/Performance/Features groups).
2. Drops `ix_spec_definitions_group_id_code` and creates a new unique index on `code` alone (`ix_spec_definitions_code`).
3. Since this repo's convention seeds/migrates against disposable local/dev databases and the schema has no production data yet (per `plan-motorcycle-web-app.md`, application code is not yet deployed), no data-migration/dedup step is required beyond the index change itself. If this changes before this feature ships, add a dedup pre-step.

**Alternatives considered**: Keep per-group uniqueness and instead prefix bike spec keys with group code (e.g., `engine.cc`) — rejected; it's a breaking change to every existing bike row, the public API contract, and the frontend spec-rendering code, for no benefit over simply enforcing global uniqueness at the definition level.

## Decision: Rename-cascade is a single transactional operation combining an EF Core update and a raw bulk SQL statement

**Rationale**: `Bike.Specs` is mapped as a JSONB column via a `ValueConverter`/`ValueComparer` pair (see `MotorcycleDbContext.OnModelCreating`), which round-trips through JSON serialization — EF Core cannot express a partial "rename this one key inside this JSONB column across N rows" as a LINQ query. The efficient and atomic way to do this in PostgreSQL is one `UPDATE` statement using the `-` (delete key) and `||` (concatenate) JSONB operators:

```sql
UPDATE bikes
SET specs = (specs - @oldCode) || jsonb_build_object(@newCode, specs -> @oldCode)
WHERE specs ? @oldCode;
```

This is executed via `DbContext.Database.ExecuteSqlInterpolatedAsync(...)` **inside the same `DbContext.Database.BeginTransactionAsync()` transaction** as the `SpecDefinition.Code` property update, so `SaveChangesAsync()` and the raw SQL either both commit or both roll back (FR-006). No new package/dependency is needed — Npgsql's EF Core provider already supports parameterized raw SQL execution.

**Alternatives considered**: Loading every affected `Bike` into memory, mutating its `Specs` dictionary in C#, and calling `SaveChangesAsync()` — rejected; this requires transferring and rehydrating every bike's specs from the database and back for what is a pure key-rename, and does not scale as the bike count grows (the project's stated design target is 200–1000+ bikes/year). The raw SQL approach does the rename inside PostgreSQL in one statement regardless of row count.

## Decision: Block delete on both `SpecGroup` (has definitions) and `SpecDefinition` (bikes hold a value)

**Rationale**: This directly mirrors the existing, already-established pattern in this codebase: `BikeModelReferencedException` / `409 bike_model_referenced` when a `BikeModel` still has `Bike` rows, and `BikeReferencedException` / `409 bike_referenced` when a `Bike` still has `BikeImage` rows. Applying the same shape (`SpecGroupReferencedException` / `409 spec_group_referenced`, `SpecDefinitionReferencedException` / `409 spec_definition_referenced`) keeps the conflict-handling UX and API contract consistent across every admin CRUD surface in the app, and prevents an administrator from silently orphaning bike spec values or losing spec metadata.

**Schema implication**: `SpecGroup.Definitions` is currently configured with `OnDelete(DeleteBehavior.Cascade)` (`sg.HasMany(x => x.Definitions).WithOne(x => x.Group)...OnDelete(DeleteBehavior.Cascade)`), which today would silently delete all child definitions when a group is deleted. This must change to `DeleteBehavior.Restrict` so the database itself backstops the application-level check, consistent with how `BikeModel`→`Bike` and `Bike`→`BikeImage` are configured. This is an EF Core migration change (`migrationBuilder.AlterTable`/`DropForeignKey`+`AddForeignKey` with `onDelete: restrict`), not a data migration.

**Alternatives considered**: Cascade-delete definitions with the group, and let orphaned `bikes.specs` keys silently persist as "unknown" values (already tolerated today by `ValidateSpecs`/`BikeService` rendering, which skip unrecognized codes) — rejected as the user, in the parallel session request, explicitly wants the system to protect against silent data loss during a *rename*; the same protection should extend to *deletion*, and this is confirmed as the intended default pending the user's review of this spec.

## Decision: `filterType` validity is derived dynamically from registered `ISpecFilterStrategy` implementations, not a hardcoded list

**Rationale**: The codebase already resolves filter strategies by `FilterType` string through `ISpecFilterStrategyFactory`/`SpecFilterStrategyFactory`, built from `IEnumerable<ISpecFilterStrategy>` registered in `Program.cs` (`NumberRangeFilterStrategy`, `ExactMatchFilterStrategy`, `MultiSelectFilterStrategy`, `BooleanFilterStrategy`). Validating a submitted `filterType` against `factory`'s known set (or a new `IReadOnlyCollection<string> ISpecFilterStrategyFactory.SupportedFilterTypes` accessor) keeps this feature automatically in sync if a new strategy is ever added — consistent with the project's established Strategy-pattern extensibility goal (mirrors how `IExternalAuthProvider`/`IExternalAuthProviderFactory` was designed for the auth feature).

**Alternatives considered**: Hardcode `range`/`exact`/`multiselect`/`boolean` as an allowed set in a validator — rejected; it duplicates information already expressed by DI registration and would silently drift out of sync if a strategy is renamed or added.

## Decision: Code format validation — lowercase snake_case, `^[a-z][a-z0-9_]*$`, max 100 characters (confirmed)

**Rationale**: Matches every code already seeded (`cc`, `horsepower`, `engine_type`, `bore_stroke`, `acceleration_0_100`, etc. — note `acceleration_0_100` starts with a letter but contains digits after an underscore, which the proposed regex already allows since digits are permitted after the first character). 100 characters is confirmed as the enforced maximum: comfortably above the longest existing seeded code (`cylinder_arrangement`, 21 characters), while remaining well under the underlying column's raw 255-character capacity (`HasMaxLength(255)` on `Code`/`Label` in `MotorcycleDbContext`), keeping the JSON key short and readable across every `bikes.specs` row.

**Alternatives considered**: No format restriction (accept any string) — rejected; since the code becomes a raw JSON object key across every bike row, arbitrary characters (spaces, dots, dollar signs used by some JSON tooling) or mixed case would make the flat map error-prone and harder to query with the JSONB operators already used elsewhere in this codebase (`specs->>'horsepower'`). Using the column's full 255-character capacity as the enforced maximum — rejected; unnecessarily long JSON keys with no benefit given the existing convention never exceeds ~25 characters.

## Decision: `dataType` changes are hard-blocked when incompatible bike values exist (confirmed)

**Rationale**: Consistent with the confirmed delete-blocking philosophy above — the system never silently converts or discards a bike's stored specification value. When an administrator changes a `SpecDefinition.DataType`, the service loads every bike with a non-null value under that code and validates it against the *new* type using the same `IsValueValidForType`-style check already used by `BikeValidators.ValidateSpecs`. If any value is incompatible, the update is rejected outright (`400` field-level error naming the affected-bike count); the administrator must fix or clear those bike values first, then retry the `dataType` change. No warn-and-proceed or best-effort conversion path is offered.

**Alternatives considered**: Warn-and-proceed (allow the change, flag affected bikes for manual follow-up) — rejected; the user explicitly confirmed a hard block, and it keeps this feature's safety guarantee (no silent data loss) uniform across renames, deletes, and now data-type changes.

## Decision: Reordering follows the existing `BikeImage` "bulk order" endpoint pattern

**Rationale**: `PUT /api/admin/bikes/{bikeId}/images/order` already accepts `{ "imageIds": [3, 1, 2] }` and persists the complete new order in one request/response cycle. Reusing this shape for `PUT /api/admin/spec-groups/order` (`{ "groupIds": [...] }`, sets `SortOrder` globally) and `PUT /api/admin/spec-groups/{groupId}/spec-definitions/order` (`{ "definitionIds": [...] }`, sets `SortOrder` scoped to that group) keeps the reordering UX and contract consistent with an already-shipped, already-understood feature in this codebase, and lets the admin UI reuse the same drag-and-drop interaction pattern already built for bike images.

**Alternatives considered**: A single `PATCH .../sort-order` per-item endpoint requiring N requests to reorder N items — rejected; the bulk endpoint is already proven in this codebase and is one request regardless of list size.
