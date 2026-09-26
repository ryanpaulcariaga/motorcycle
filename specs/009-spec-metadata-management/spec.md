# Feature Specification: Specification Metadata Management (spec_groups / spec_definitions)

**Feature Branch**: `009-spec-metadata-management`

**Created**: 2026-09-27

**Status**: Implemented

**Input**: User description: "Admin CRUD page covering spec_definitions and spec_groups. Renaming a spec_definitions code must rename the matching key in every bike's specs JSONB column in the same operation. Validate that a code is not already in use when adding or updating. Check whether spec_definitions.code already has a unique constraint. UI must let the administrator set each spec's group and sort order (grouping and sorting)."

## Clarifications

### Session 2026-09-27

- Q: `spec_definitions.code` currently has a unique index scoped to `(group_id, code)` only — two different groups can hold the same code today. Since `bikes.specs` is a single flat map keyed by code (not scoped by group), a duplicate code across groups would silently collide in that map. → A: Make `code` unique **globally** across all groups, not just per-group. This is what the user asked for ("check if there is already an existing code with the same value being saved") and it is the only design that keeps the flat `bikes.specs` map unambiguous.
- Q: What happens when an administrator deletes a `SpecGroup` that still has `SpecDefinition` rows, or deletes a `SpecDefinition` that bikes already have a value for? → A: **Confirmed.** Block both, mirroring the existing `BikeModel`/`Bike` "referenced" conflict pattern already used in this codebase (`bike_model_referenced`, `bike_referenced`). A group must be emptied (definitions moved or deleted) before it can be deleted; a definition that any bike currently has a non-null value for cannot be deleted until an administrator clears those values first.
- Q: What happens when an administrator changes a definition's `dataType` in a way that is incompatible with values bikes already store under its code (e.g., `text` → `number` where a bike stores a non-numeric string)? → A: **Confirmed: hard block.** The update is rejected outright with a detailed error message identifying how many bikes are affected (and, where practical, which ones) and why; no partial or best-effort conversion is attempted. The administrator must fix or clear the incompatible bike values first.
- Q: What code format and length is acceptable? → A: Lowercase snake_case matching the existing seeded convention (`cc`, `horsepower`, `engine_type`, `bore_stroke`) — enforced with a regex (`^[a-z][a-z0-9_]*$`). **Confirmed max length: 100 characters** — comfortably above the longest existing seeded code (`cylinder_arrangement`, 21 characters) while staying well under the column's raw 255-character capacity, keeping the JSON key short and readable across every `bikes.specs` row.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage spec groups (Priority: P1)

An authorized administrator creates, edits, reorders, and deletes specification groups (e.g., "Engine", "Body", "Performance") that organize the specification list shown on public bike detail/comparison pages and in the admin bike-editing form.

**Why this priority**: Groups are the top-level organizing structure; definitions cannot be meaningfully managed without an existing group to assign them to.

**Independent Test**: From an active administrator session, create a new group, edit its name/icon, reorder it relative to other groups, and delete an empty group; verify the public `/api/spec-groups` response and the bike admin form reflect the change immediately.

**Acceptance Scenarios**:

1. **Given** an active administrator, **When** they create a group with a unique code and a name, **Then** the group is saved and appears in the group list ordered by its sort order.
2. **Given** an existing group, **When** an administrator changes its name, icon, or sort order, **Then** the change is persisted and reflected everywhere the group is displayed (public spec-groups response, comparison page, admin bike form).
3. **Given** a group with zero spec definitions, **When** an administrator deletes it, **Then** the group is permanently removed.
4. **Given** a group with one or more spec definitions still assigned to it, **When** an administrator attempts to delete it, **Then** the deletion is rejected with a clear conflict message identifying how many definitions still reference it.
5. **Given** two or more groups, **When** an administrator reorders them (e.g., drag-and-drop or explicit position entry), **Then** the new order is persisted and reflected in every ordered listing (comparison table order, bike detail grouping, admin forms).

---

### User Story 2 - Manage spec definitions, including safe code renames (Priority: P1)

An authorized administrator creates, edits, reorders, moves between groups, and deletes individual specification definitions (e.g., "Displacement" / `cc`, "Horsepower" / `horsepower`). Renaming a definition's code updates every bike's stored specification value under that code in the same operation, so no data is silently orphaned.

**Why this priority**: This is the core of the feature — without safe code management, administrators cannot fix a poorly chosen code (e.g., `cc` → `cubic_centimeter`) without manually editing every affected bike's specs.

**Independent Test**: Create a definition, assign existing bikes a value under its code (via the existing bike admin form), rename the code, and confirm the previously-saved bike values are readable under the new code with no data loss. Attempt to save a duplicate code and confirm it is rejected.

**Acceptance Scenarios**:

1. **Given** an active administrator, **When** they create a definition with a unique code, label, data type, group, and sort order, **Then** the definition is saved and appears under its assigned group in sorted order.
2. **Given** an existing definition and a code value already used by any other definition (in the same group or a different one), **When** an administrator tries to save that code, **Then** the save is rejected with a clear "code already in use" message and no data changes.
3. **Given** an existing definition with code `cc` and at least one bike with a stored value under `cc`, **When** an administrator renames the code to `cubic_centimeter` and saves, **Then** the definition's code changes to `cubic_centimeter` **and** every bike that previously had a value under `cc` now has that same value under `cubic_centimeter` (and no longer has a `cc` key), verifiable via the bike detail/admin responses.
4. **Given** an existing definition, **When** an administrator changes its group assignment, **Then** the definition moves to the new group's spec list (appended at the end of that group's order unless explicitly repositioned) without altering any bike's stored values.
5. **Given** an existing definition, **When** an administrator changes its data type in a way that is incompatible with already-stored values (e.g., `text` → `number` where a bike stores a non-numeric string), **Then** the system rejects the change outright with a clear message stating how many bikes are affected and why; no value is converted or altered.
6. **Given** a definition that at least one bike currently has a non-null value for, **When** an administrator attempts to delete it, **Then** the deletion is rejected with a clear conflict message and a count of affected bikes.
7. **Given** a definition with `isFilterable` set to true, **When** an administrator saves it, **Then** a `filterType` compatible with the strategy already registered in the system must be supplied, or the save is rejected.
8. **Given** two or more definitions in the same group, **When** an administrator reorders them, **Then** the new order is persisted and reflected in the public comparison/detail responses and the admin bike form's spec input order.

---

### Edge Cases

- Saving a code that only differs by case (e.g., existing `CC` vs new `cc`) must be treated as a duplicate (comparison is case-insensitive) since `bikes.specs` keys are used verbatim and any case-sensitive "near duplicate" would be confusing rather than useful.
- Renaming a code to itself (no-op) must succeed without unnecessarily rewriting every bike row.
- Renaming a code that no bike currently uses must still succeed and simply update the definition (nothing to cascade).
- Attempting to rename a code to one already used by a *different* definition must be rejected as a duplicate, even mid-rename.
- The rename-cascade must be all-or-nothing: if the definition update or the bulk `bikes.specs` key rename fails partway, neither change is applied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide protected create, read, update, and delete operations for `spec_groups`, restricted to an active administrator.
- **FR-002**: System MUST provide protected create, read, update, and delete operations for `spec_definitions`, restricted to an active administrator.
- **FR-003**: System MUST reject a `spec_definitions.code` that duplicates any other definition's code (case-insensitive), across all groups, on both create and update.
- **FR-004**: System MUST reject a `spec_groups.code` that duplicates any other group's code (case-insensitive), on both create and update (this already exists as a per-column unique index and must remain enforced).
- **FR-005**: When an administrator changes a `spec_definitions.code` from an old value to a new value, the system MUST, in the same atomic operation: (a) persist the new code on the definition, and (b) for every bike row whose `specs` JSONB currently contains the old code as a key, replace that key with the new code while preserving its value, removing the old key.
- **FR-006**: The rename-cascade in FR-005 MUST be transactional: either both the definition change and every affected bike's key rename succeed, or neither is applied.
- **FR-007**: System MUST reject deleting a `spec_groups` row that still has one or more `spec_definitions` rows assigned to it, returning a clear conflict response with the dependent-definition count.
- **FR-008**: System MUST reject deleting a `spec_definitions` row if any bike currently stores a non-null value under its code, returning a clear conflict response with the count of affected bikes.
- **FR-009**: System MUST validate required fields on save: `spec_groups` requires a non-empty `code` and `name`; `spec_definitions` requires a non-empty `code`, `label`, a valid `dataType` (`number`, `text`, `boolean`, or `enum`), and a valid, existing `groupId`.
- **FR-010**: System MUST validate `spec_definitions.code` and `spec_groups.code` format: lowercase letters, digits, and underscores only, starting with a letter, bounded length (see Assumptions).
- **FR-011**: System MUST validate that when `isFilterable` is true, `filterType` is supplied and matches one of the filter types the system currently supports (kept in sync with registered filter strategies, not hardcoded, so adding a new strategy automatically expands the accepted set); when `isFilterable` is false, `filterType` MUST be null.
- **FR-012**: The administration UI MUST let an administrator set and change a `spec_definitions` row's `groupId` (which group it belongs to).
- **FR-013**: The administration UI MUST let an administrator set and change the sort order of `spec_groups` relative to each other, and the sort order of `spec_definitions` relative to other definitions within the same group.
- **FR-014**: Moving a `spec_definitions` row to a different group MUST NOT alter any bike's stored specification values; only its group assignment and (if unspecified) its position within the new group's order change.
- **FR-015**: All existing public and admin consumers of spec metadata (`GET /api/spec-groups`, bike detail/comparison responses, the existing bike admin create/edit form) MUST continue to reflect group/definition changes made through this feature without additional caching lag beyond what already exists today.
- **FR-016**: The administration UI MUST show loading, empty, validation-error, duplicate-code-conflict, referenced-on-delete-conflict, and success states for both groups and definitions.
- **FR-017**: System MUST reject a `dataType` change on a `spec_definitions` row if any bike currently stores a value under its code that is incompatible with the new `dataType`, returning a clear error with the affected-bike count; no value conversion is attempted and no data is altered.

### Key Entities

- **SpecGroup**: `id`, `code` (globally unique), `name`, `sortOrder`, `iconName` (optional). Parent of one or more `SpecDefinition` rows. Deletable only when it has zero child definitions.
- **SpecDefinition**: `id`, `groupId` (FK to `SpecGroup`), `code` (globally unique across all groups — **changed from the current per-group uniqueness**), `label`, `dataType`, `unit` (optional), `sortOrder` (scoped within its group), `isFilterable`, `filterType` (required when `isFilterable` is true, must match a registered filter strategy). Deletable only when no bike currently has a non-null value under its code.
- **Bike.Specs** (existing, read/write side-effect of this feature): a flat JSONB map of `code -> value` on every `Bike` row. This feature's rename-cascade is the only new write path into this map introduced by this feature; normal spec value editing continues through the existing bike admin create/edit endpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can create, edit, reorder, and delete a spec group or definition entirely through the admin UI, with zero direct database access.
- **SC-002**: Attempting to save a duplicate code (group or definition, case-insensitive, across all groups for definitions) is rejected 100% of the time with an actionable message, and no duplicate ever reaches the database.
- **SC-003**: Renaming a definition's code updates 100% of bikes that held a value under the old code, with zero data loss, verified by comparing bike spec values before and after the rename in an acceptance test with at least one affected bike.
- **SC-004**: Deleting a group with existing definitions, or a definition with existing bike values, is rejected 100% of the time with a clear, actionable conflict message.
- **SC-005**: Reordering groups or definitions is reflected in the public comparison/detail API responses without requiring a deployment or manual cache clear beyond the existing cache TTL.

## Assumptions

- `code` maximum length is 100 characters (a UX-level bound recommended and confirmed for this feature; the underlying columns retain their existing 255-character raw capacity — see `docs/database.md`).
- No change is made to the existing `dataType` or `filterType` string enumerations beyond validating them against the system's currently registered set.
