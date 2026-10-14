# Tasks: Admin Bike Catalog Filters and Ordering

**Input**: Design documents from `/specs/011-bike-catalog-filters/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test runner exists for the admin UI. Validate with the production build and the manual scenarios in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: No project initialization is needed; this feature uses the existing admin app and API data.

No setup tasks.

---

## Phase 2: Foundational

**Purpose**: No shared prerequisite work is needed; the Bikes tab already loads model, brand, and category data.

No foundational tasks.

---

## Phase 3: User Story 1 - Filter and order bike models (Priority: P1) 🎯 MVP

**Goal**: Let administrators narrow the Bikes list by brand, category, or both, order the visible models by brand, category, or model line, and retain a clear no-match state without changing existing catalog actions.

**Independent Test**: On the Bikes tab, select a brand, a category, and both together; verify every visible row matches the active selections. Order by each field in both directions, verify the row order, and confirm filters retain the ordering. Clear filters and verify the full list returns. Choose a zero-match combination and verify the empty-result message appears while controls remain usable.

### Implementation for User Story 1

- [X] T001 [US1] Add optional brand and category filters, combined matching, and a distinct no-match state to `apps/admin/components/bike-models/BikeModelManagement.tsx`.
- [X] T002 [US1] Verify create, edit, variant navigation, delete, refresh, and error behaviors remain available with active filters in `apps/admin/components/bike-models/BikeModelManagement.tsx`.
- [X] T004 [US1] Add brand/category/model-line ordering, ascending/descending direction, brand-ascending defaults, and deterministic tie-breakers to `apps/admin/components/bike-models/BikeModelManagement.tsx`.
- [X] T006 [US1] Group brand/category filters and move ordering to accessible, sortable table headers with compact clear-filter behavior in `apps/admin/components/bike-models/BikeModelManagement.tsx`.
- [X] T008 [US1] Persist filter and ordering state in the Bikes URL and carry it through Variants navigation using `apps/admin/lib/bikeModelListState.ts`, `apps/admin/components/bike-models/BikeModelManagement.tsx`, and `apps/admin/components/bikes/BikeManagement.tsx`.
- [X] T010 [US1] Build the Variants link query directly from current component filter and sort state in `apps/admin/components/bike-models/BikeModelManagement.tsx`, so single-filter navigation does not depend on URL-sync timing.
- [X] T012 [US1] Serialize the Variants link from current component filter and sort state so brand-only and category-only selections are preserved independently in `apps/admin/components/bike-models/BikeModelManagement.tsx` and `apps/admin/lib/bikeModelListState.ts`.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validate the finished user story.

- [X] T003 Run the admin production build with `pnpm --filter admin build`.
- [X] T005 Run the admin production build with `pnpm --filter admin build` after adding ordering.
- [X] T007 Run the admin production build with `pnpm --filter admin build` after the filter and sort control layout update.
- [X] T009 Run the admin production build with `pnpm --filter admin build` after adding URL state persistence.
- [X] T011 Run the admin production build with `pnpm --filter admin build` after fixing single-filter state carry-through.
- [X] T013 Run the admin production build with `pnpm --filter admin build` after verifying single-filter state carry-through.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required.
- **Foundational (Phase 2)**: No work required.
- **User Story 1 (Phase 3)**: Independent; can start immediately.
- **Polish (Phase 4)**: Depends on T001, T002, T004, T006, T008, and T012.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.

### Parallel Opportunities

- No implementation tasks are parallelizable because the feature and behavior preservation checks both concern the same component.
- The production build and manual validation in T003 are validation activities after implementation, not separate story work.

## Parallel Example: User Story 1

No safe parallel implementation tasks; complete T001, T004, T006, T008, and T012 before checking the preserved interactions in T002.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Implement filtering and ordering in User Story 1.
2. Verify existing actions remain available.
3. Run the production build and complete the filtering, ordering, and navigation restoration scenarios in quickstart.md.

## Notes

- [Story] labels map tasks to the user story in `specs/011-bike-catalog-filters/spec.md`.
- The feature uses existing loaded data and does not require API or database changes.
- Filter and ordering state is encoded in the Bikes page URL and carried through variant navigation.
