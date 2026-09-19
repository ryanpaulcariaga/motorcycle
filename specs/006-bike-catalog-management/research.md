# Phase 0 Research: Bike Catalog Management

All Technical Context decisions below were resolved during specification/clarification; no `NEEDS CLARIFICATION` markers remain. This document records the rationale and alternatives considered for the non-obvious choices.

## Decision: Reuse `Bike`/`BikeImage` schema as-is (no migration)

- **Rationale**: `Bike` and `BikeImage` domain entities and their EF Core mapping already exist from the original catalog migration (used today by the public read-only API and the dev seeder). Stage 2 only adds an authorization/mutation surface, not new columns or tables.
- **Alternatives considered**: Adding a soft-delete/archived flag to `Bike` — rejected per clarification (hard delete only, no archived state needed this stage).

## Decision: Mirror the `BikeModelService`/`AdminBikeModelsController` pattern for `Bike`

- **Rationale**: Stage 1 already established a proven, constitution-compliant pattern (Application service + repository interface + controller translating domain exceptions to `400`/`404`/`409`) for an admin-mutable entity referencing lookup data. Reusing it minimizes new architectural surface and keeps reviewers' mental model consistent.
- **Alternatives considered**: A generic/shared CRUD base class — rejected as premature abstraction for two entities; `BikeModelService` and the new `BikeAdminService` are simple enough that duplication is clearer than a shared generic.

## Decision: Allow direct edits to published variants (no unpublish-first gate)

- **Rationale**: Confirmed via clarification. Matches the existing `BikeModel` edit flow, which has no publish-state concept and already allows direct edits. Keeps the admin workflow simple (single "Save" action regardless of publish state).
- **Alternatives considered**: Require unpublish before edit (safer against showing partially-edited data, but adds friction and an extra state transition the spec doesn't require); add an explicit "republish" confirmation step (adds UI complexity without a stated requirement).

## Decision: Hard delete only; block when `BikeImage` rows exist

- **Rationale**: Confirmed via clarification. Mirrors the existing `BikeModelReferencedException` / `409 bike_model_referenced` pattern — introduce an equivalent `BikeReferencedException` / `409 bike_referenced` when `BikeImage.BikeId` rows reference the target `Bike`.
- **Alternatives considered**: Soft delete/archive — rejected; not required this stage and would add an unused state to the `Bike` entity ahead of need.

## Decision: Validate specification values against the full spec-definition set, not category-filtered

- **Rationale**: Confirmed via clarification. `SpecDefinition` has no category-scoping field today (`GroupId` only), and spec-definition/category mapping is out of scope (deferred to the later "specification metadata" stage). Validating against the full set requires no new mapping data and keeps this feature's scope bounded to variant CRUD.
- **Alternatives considered**: Introduce a new category-to-spec-definition mapping table to filter which specs apply — rejected as out of scope; would expand this feature into spec-metadata management territory that is explicitly deferred.

## Decision: Validate spec values by `SpecDefinition.DataType` using a lightweight type-check helper

- **Rationale**: The existing `ISpecFilterStrategy` family (`NumberRangeFilterStrategy`, `ExactMatchFilterStrategy`, `MultiSelectFilterStrategy`, `BooleanFilterStrategy`) is designed for *filtering* comparisons, not input validation, and is keyed by `FilterType` (which can be null for non-filterable specs). A separate small validator keyed by `DataType` (`number`, `text`, `boolean`, `enum`) checks that submitted values are shape-correct without conflating filtering and validation concerns.
- **Alternatives considered**: Extend `ISpecFilterStrategy` with a `Validate` method — rejected; would couple filtering strategy contracts (keyed by `FilterType`) to a concern keyed by `DataType`, and not every `SpecDefinition` has a `FilterType`.

## Decision: Slug handling unchanged

- **Rationale**: Public catalog routes already key bikes by `slug` (e.g., `kawasaki-ninja-400-2024`). This feature reuses whatever existing slug convention/generation the seeder already follows; no new slug format or uniqueness rule is introduced.
- **Alternatives considered**: Let administrators manually set the slug — deferred; not requested and adds validation surface (collision handling) beyond this feature's scope.

## Decision: No new automated concurrency control

- **Rationale**: Per clarification/assumption, simultaneous edits use last-write-wins, matching the low-traffic, single-operator-team usage pattern of the admin app (same assumption already made for Stage 1 `BikeModel` edits).
- **Alternatives considered**: Optimistic concurrency tokens (`RowVersion`) — rejected as unnecessary complexity for the current scale/scope.
