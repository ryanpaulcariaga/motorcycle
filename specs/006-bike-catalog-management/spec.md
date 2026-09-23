# Feature Specification: Bike Catalog Management

**Feature Branch**: `006-bike-catalog-management`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Add Stage 2 of admin catalog management: bike (year/trim variant) CRUD and publication management, so administrators can create and edit the year/trim records that belong to a BikeModel, control whether each is published to the public catalog, and set core details (variant name, year, MSRP, specs). Image assignment is a separate follow-on feature and is out of scope here."

## Clarifications

### Session 2026-09-20

- Q: Can an administrator edit a variant's core fields (year, variant name, MSRP, specs) while it's currently published, or must they unpublish it first? → A: Allow direct edits while published; changes are visible to the public immediately on save.
- Q: When an administrator deletes a bike variant, should the record be permanently removed, or kept as an inactive/archived record for audit history? → A: Hard delete - the variant row is permanently removed once dependent-image checks pass.
- Q: Should the specification form only show spec definitions relevant to the variant's BikeModel category, or every spec definition regardless of category? → A: Accept/validate against the full set of existing spec definitions and groups, regardless of category; no new category-to-definition mapping is introduced.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and edit a bike variant (Priority: P1)

An authorized administrator selects an existing BikeModel and adds a new bike variant to it (year, trim/variant name, MSRP, specification values), or edits an existing variant's details.

**Why this priority**: Without variant records, there is nothing for an administrator to publish, compare, or attach images to later. This is the foundation of the entire Stage 2 slice.

**Independent Test**: Using an active administrator session, create a variant under an existing BikeModel with valid fields, confirm it appears in the variant list unpublished, edit its fields, and confirm the changes persist.

**Acceptance Scenarios**:

1. **Given** an active administrator viewing a BikeModel, **When** they create a new variant with a valid year, variant name, and optional MSRP, **Then** the variant is saved as unpublished and appears in that model's variant list.
2. **Given** an existing variant, **When** an active administrator edits its year, variant name, MSRP, or specification values, **Then** the updated values are persisted and visible on next load.
3. **Given** a variant create or edit request with a missing/invalid year or empty variant name, **When** the administrator submits, **Then** the request is rejected with a clear validation error and no data is persisted or changed.
4. **Given** two variants under the same BikeModel, **When** an administrator attempts to save duplicate identifying details (same year and variant name) for a third variant, **Then** the system rejects the duplicate and explains why.

---

### User Story 2 - Control publication state (Priority: P1)

An authorized administrator publishes a variant so it becomes visible on the public catalog and comparison pages, or unpublishes a variant to hide it without deleting its data.

**Why this priority**: Administrators need a safe way to stage new or incomplete variants privately and only expose them to the public site when ready.

**Independent Test**: Create an unpublished variant, confirm it is absent from the public catalog, publish it, confirm it appears publicly, then unpublish it and confirm it disappears again while the record still exists in admin.

**Acceptance Scenarios**:

1. **Given** an unpublished variant, **When** an administrator publishes it, **Then** the variant becomes visible through the public catalog and comparison views.
2. **Given** a published variant, **When** an administrator unpublishes it, **Then** the variant is immediately hidden from the public catalog and comparison views but remains editable in admin.
3. **Given** a variant missing required core details, **When** an administrator attempts to publish it, **Then** publication is rejected until the missing details are supplied.
4. **Given** a published variant, **When** an administrator edits its core fields and saves, **Then** the changes are persisted without requiring unpublish/republish and are immediately visible on the public catalog.

---

### User Story 3 - Remove a bike variant (Priority: P2)

An authorized administrator deletes a bike variant that was created in error or is no longer needed, provided it is not otherwise referenced by data that must be preserved.

**Why this priority**: Cleanup capability matters but is lower priority than being able to create, edit, and publish variants correctly.

**Independent Test**: Create a variant with no dependent images, delete it, and confirm it no longer appears in any list or in the database. Separately, attempt to delete a variant that has dependent images (once that feature exists) and confirm deletion is blocked with a clear reason.

**Acceptance Scenarios**:

1. **Given** a variant with no dependent images, **When** an administrator deletes it, **Then** the variant row is permanently removed and no longer appears in admin or public views.
2. **Given** a variant with one or more dependent images, **When** an administrator attempts to delete it, **Then** the deletion is rejected and the administrator is told the variant has dependent images.

---

### Edge Cases

- What happens when an administrator tries to create a variant under a BikeModel that was deleted or does not exist? The request is rejected with a clear "model not found" error.
- What happens when an administrator submits specification values that don't match the current specification metadata (unknown keys or wrong value types)? The system rejects the unrecognized or malformed values and reports which ones failed.
- What happens when a variant is published while its BikeModel or referenced brand/category becomes invalid? Publication requires the parent BikeModel to still exist; orphaned publication is not possible since BikeModel deletion is already blocked while dependent bikes exist.
- What happens when two administrators edit the same variant at nearly the same time? The later save wins; no optimistic-lock conflict UI is required for this stage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let an active administrator create a bike variant under a specific, existing BikeModel with a year, variant name, optional MSRP, and specification values.
- **FR-002**: The system MUST let an active administrator view, edit, and delete existing bike variants.
- **FR-003**: The system MUST enforce that variant year and variant name are present and that the combination of BikeModel, year, and variant name is unique.
- **FR-004**: The system MUST let an active administrator toggle a variant's publication state between published and unpublished.
- **FR-005**: The system MUST prevent publishing a variant that lacks required core details (year and variant name at minimum).
- **FR-005a**: The system MUST allow an administrator to edit a published variant's core fields and specification values directly, without requiring it to be unpublished first, and MUST reflect saved changes on the public catalog immediately.
- **FR-006**: The system MUST exclude unpublished variants from every public catalog, detail, and comparison view while keeping them visible and editable in the administration experience.
- **FR-007**: The system MUST prevent deleting a variant that has dependent records that must be preserved (for example, assigned images once that feature exists), and MUST explain why deletion was blocked. When no such dependent records exist, deletion MUST be permanent (hard delete); no archived/inactive variant state is retained.
- **FR-008**: The system MUST reject bike variant mutations from unauthenticated or non-administrator requests.
- **FR-009**: The system MUST validate submitted specification values against the full set of existing specification metadata (all groups/definitions, not filtered by the variant's BikeModel category) and reject unrecognized keys or mismatched value types.
- **FR-010**: The system MUST use the shared catalog service for all bike variant mutations and MUST prevent browser clients from accessing PostgreSQL directly.
- **FR-011**: The system MUST keep audit fields (created/updated timestamps) accurate for every bike variant record.

### Key Entities

- **Bike (variant)**: A year/trim record belonging to one BikeModel. Attributes: variant name, model year, optional MSRP, specification values, publication state, created/updated timestamps. Already exists in the data model; this feature adds administrator-facing mutation and publication control.
- **BikeModel**: Existing parent entity (brand, category, product-line name) that a variant belongs to. Unchanged by this feature except that its dependent-bike check now has real administrator-created data behind it.
- **Specification metadata (spec groups/definitions)**: Existing lookup data used to validate and label the specification values submitted for a variant. Read-only in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can create a fully valid new bike variant and see it reflected in the administration variant list in under 10 seconds of perceived wait time.
- **SC-002**: 100% of unpublished variants are absent from public catalog, detail, and comparison responses.
- **SC-003**: 100% of variant create/edit submissions with invalid or duplicate identifying data are rejected with an explanatory error and result in no partial data changes.
- **SC-004**: 100% of delete attempts against variants with dependent images (once images exist) are blocked with a clear reason, and zero orphaned image references are created.
- **SC-005**: Administrators can publish a previously unpublished, fully-detailed variant and see it appear on the public catalog within one page refresh.

## Assumptions

- This feature covers only the `Bike` (year/trim variant) entity's CRUD and publication lifecycle; image upload/assignment (`BikeImage`) is explicitly deferred to a follow-on feature, matching the Stage 2 → Stage 3 sequencing already recorded in `specs/005-admin-catalog-management/implementation-status.md`.
- Specification-group and specification-definition CRUD (metadata management) remains deferred to a later stage; this feature only validates variant specification values against existing metadata.
- The existing API-owned Facebook PKCE sign-in, HttpOnly cookie session, and `ActiveAdministrator` authorization policy from Stage 1 are reused unchanged; no new authentication mechanism is introduced.
- No optimistic concurrency/conflict-resolution UI is required for simultaneous edits in this stage.
- Slug generation/uniqueness for published variants follows the existing convention already used by public catalog routes; this feature does not change slug format.
