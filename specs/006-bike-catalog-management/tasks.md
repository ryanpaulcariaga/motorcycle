---

description: "Task list template for feature implementation"
---

# Tasks: Bike Catalog Management

**Input**: Design documents from `/specs/006-bike-catalog-management/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/admin-bikes-api.md](contracts/admin-bikes-api.md), [quickstart.md](quickstart.md)

**Tests**: Not explicitly requested in the spec; automated API tests are included as non-blocking Polish-phase tasks per the plan's testing intent.

**Organization**: Tasks are grouped by user story (US1 = Create/edit variant, US2 = Publication state, US3 = Delete variant) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

- Backend: `apps/api/Motorcycle.{Domain,Application,Infrastructure,Api}/`
- Admin frontend: `apps/admin/`

---

## Phase 1: Setup

**Purpose**: Add the shared schema/type surface every story builds on

- [X] T001 Add EF Core migration adding a unique index on `(model_id, year, variant_name)` for the `bikes` table in `apps/api/Motorcycle.Infrastructure/Migrations` (generate via `dotnet ef migrations add AddBikeVariantUniqueIndex --project apps/api/Motorcycle.Infrastructure --startup-project apps/api/Motorcycle.Api`; no other schema change)
- [X] T002 [P] Add `BikeAdminListItemDto`, `BikeAdminDetailDto`, `CreateBikeRequest`, `UpdateBikeRequest` records in `apps/api/Motorcycle.Application/DTOs/BikeAdminDto.cs` per [contracts/admin-bikes-api.md](contracts/admin-bikes-api.md)
- [X] T003 [P] Add matching `BikeAdminListItem`, `BikeAdminDetail`, `CreateBikeRequest`, `UpdateBikeRequest` TypeScript types in `apps/admin/lib/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared repository/service/controller/client plumbing that every user story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define `IBikeAdminRepository` (GetAll by optional `modelId`, GetById, BikeModelExists, VariantExists(modelId, year, variantName, excludingId), CountDependentImages, Add, Remove, SaveChanges) in `apps/api/Motorcycle.Application/Interfaces/IBikeAdminRepository.cs`
- [X] T005 Implement `BikeAdminRepository` against `MotorcycleDbContext` in `apps/api/Motorcycle.Infrastructure/Repositories/BikeAdminRepository.cs` (depends on T004)
- [X] T006 [P] Implement `BikeValidators` with required-field checks and a spec-value type checker keyed by `SpecDefinition.DataType` (`number`/`text`/`boolean`/`enum`) in `apps/api/Motorcycle.Application/Common/BikeValidators.cs`
- [X] T007 Define `IBikeAdminService` (GetAll, GetById, Create, Update, Publish, Unpublish, Delete) in `apps/api/Motorcycle.Application/Interfaces/IBikeAdminService.cs`
- [X] T008 Register `IBikeAdminRepository` → `BikeAdminRepository` and `IBikeAdminService` → `BikeAdminService` in `apps/api/Motorcycle.Api/Program.cs` (depends on T005, T007)
- [X] T009 Scaffold `AdminBikesController` with `[Route("api/admin/bikes")]` and `[Authorize(Policy = "ActiveAdministrator")]` in `apps/api/Motorcycle.Api/Controllers/AdminBikesController.cs` (depends on T007)
- [X] T010 [P] Add empty `listAdminBikes`/`getAdminBike`/`createAdminBike`/`updateAdminBike`/`publishAdminBike`/`unpublishAdminBike`/`deleteAdminBike` function signatures to `apps/admin/lib/api.ts` (depends on T003)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and edit a bike variant (Priority: P1) 🎯 MVP

**Goal**: An administrator can create a new variant under a BikeModel and edit an existing variant's core fields and spec values.

**Independent Test**: Create a variant with valid fields, confirm it appears unpublished in the variant list, edit its fields, and confirm the changes persist; confirm invalid/duplicate submissions are rejected.

### Implementation for User Story 1

- [X] T011 [US1] Implement `GetAllAsync`, `GetByIdAsync`, `CreateAsync`, `UpdateAsync` in `apps/api/Motorcycle.Application/Services/BikeAdminService.cs`, validating BikeModel existence, required year/variant name, `(modelId, year, variantName)` uniqueness, and spec value keys/types via `BikeValidators` (depends on T005, T006, T007)
- [X] T012 [US1] Implement `GET /api/admin/bikes`, `GET /api/admin/bikes/{id}`, `POST /api/admin/bikes`, `PUT /api/admin/bikes/{id}` in `apps/api/Motorcycle.Api/Controllers/AdminBikesController.cs`, mapping validation/not-found/duplicate exceptions to `400`/`404`/`409` per [contracts/admin-bikes-api.md](contracts/admin-bikes-api.md) (depends on T011)
- [X] T013 [P] [US1] Implement `listAdminBikes`, `getAdminBike`, `createAdminBike`, `updateAdminBike` in `apps/admin/lib/api.ts` (depends on T010)
- [X] T014 [P] [US1] Build the variant list+form UI in `apps/admin/components/bikes/BikeManagement.tsx` (implemented as a single combined component, matching the existing `BikeModelManagement.tsx` list+form pattern, rather than separate `BikeList`/`BikeForm` files)
- [X] T015 [P] [US1] Render spec inputs from the existing spec groups/definitions lookup within `apps/admin/components/bikes/BikeManagement.tsx` (`getSpecGroups()` added to `apps/admin/lib/api.ts`; folded into the combined component rather than a separate `BikeForm.tsx`)
- [X] T016 [US1] Add the admin route `apps/admin/app/admin/bike-models/[id]/bikes/page.tsx`, wiring `BikeManagement` to the client functions (implemented as one route with inline create/edit, rather than separate `new`/`[bikeId]/edit` routes; a "Bikes" link was added to `BikeModelManagement.tsx`'s row actions)
- [X] T017 [US1] Surface field-level validation, duplicate-variant, and spec type-mismatch errors in `BikeManagement.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Control publication state (Priority: P1)

**Goal**: An administrator can publish/unpublish a variant, and edits to a published variant apply immediately without an unpublish step.

**Independent Test**: Publish an unpublished variant and confirm it appears on the public catalog/comparison views; edit it while published and confirm the change is visible immediately; unpublish it and confirm it disappears from public views while remaining in admin.

### Implementation for User Story 2

- [X] T018 [US2] Implement `PublishAsync`/`UnpublishAsync` in `apps/api/Motorcycle.Application/Services/BikeAdminService.cs`, rejecting publish when year/variant name are missing (depends on T011)
- [X] T019 [US2] Implement `PATCH /api/admin/bikes/{id}/publish` and `PATCH /api/admin/bikes/{id}/unpublish` in `apps/api/Motorcycle.Api/Controllers/AdminBikesController.cs`, mapping the not-publishable case to `400 bike_not_publishable` (depends on T018)
- [X] T020 [P] [US2] Implement `publishAdminBike`/`unpublishAdminBike` in `apps/admin/lib/api.ts` (depends on T010)
- [X] T021 [US2] Add a publish/unpublish toggle to `apps/admin/components/bikes/BikeManagement.tsx` (depends on T014, T020)
- [X] T022 [US2] Verified `apps/api/Motorcycle.Infrastructure/Repositories/BikeRepository.cs`'s `GetPublishedWithStaticFiltersAsync` already filters to `IsPublished == true` for `/api/bikes*`, so unpublished Stage 2 variants stay out of public responses without any change

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Remove a bike variant (Priority: P2)

**Goal**: An administrator can permanently delete a variant that has no dependent images; deletion is blocked with a clear reason when dependent images exist.

**Independent Test**: Delete a variant with no dependent images and confirm it is gone from admin and public views; attempt to delete a variant with dependent images (once images exist) and confirm the deletion is blocked with an explanatory message.

### Implementation for User Story 3

- [X] T023 [US3] Implement `DeleteAsync` in `apps/api/Motorcycle.Application/Services/BikeAdminService.cs`, counting dependent `BikeImage` rows and throwing a `BikeReferencedException` when the count is greater than zero (depends on T011)
- [X] T024 [US3] Implement `DELETE /api/admin/bikes/{id}` in `apps/api/Motorcycle.Api/Controllers/AdminBikesController.cs`, mapping `BikeReferencedException` to `409 bike_referenced` with `dependentCount` (depends on T023)
- [X] T025 [P] [US3] Implement `deleteAdminBike` in `apps/admin/lib/api.ts` (depends on T010)
- [X] T026 [US3] Add a delete action with confirmation and blocked-reason messaging to `apps/admin/components/bikes/BikeManagement.tsx` (depends on T014, T025)

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, regression tests, and final validation across all stories

- [X] T027 [P] Update `docs/api.md` with the `/api/admin/bikes` endpoint contract
- [X] T028 [P] Update `docs/architecture.md` to note that Stage 2 (bike CRUD/publication) is implemented and image assignment remains deferred
- [X] T029 [P] Create an xUnit test project `apps/api/Motorcycle.Api.Tests` referencing `Motorcycle.Api`, `Motorcycle.Application`, `Motorcycle.Infrastructure`, and `Motorcycle.Domain`, and register it in `apps/api/Motorcycle.Api.slnx`
- [X] T030 Add `BikeAdminService` tests (using hand-written fake repositories in `apps/api/Motorcycle.Api.Tests/Fakes/`) covering create/update validation, uniqueness conflict, publish-readiness rejection, and delete-blocked-by-image behavior in `apps/api/Motorcycle.Api.Tests/BikeAdminServiceTests.cs` (depends on T029, T011, T018, T023) — 14 tests, all passing
- [X] T031 Add `AdminBikesController` authorization tests in `apps/api/Motorcycle.Api.Tests/AdminBikesControllerAuthorizationTests.cs`, asserting the `ActiveAdministrator` policy and route via reflection (a lighter-weight check than a full HTTP integration test, since no test-auth harness exists yet for Stage 1 either) (depends on T029, T012)
- [X] T032 Ran automated validation in place of a full manual quickstart pass: `dotnet build`/`dotnet test` on the API solution (all green) and `eslint`/`tsc --noEmit`/`next build` on the admin app (all green); manual browser click-through per [quickstart.md](quickstart.md) is still recommended before release
- [X] T033 Updated `specs/005-admin-catalog-management/implementation-status.md`'s "Next Admin Stage" note to record that bike CRUD/publication (Stage 2) is implemented and image assignment (Stage 3, requiring Azure Blob Storage provisioning) is next

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 has no dependency on US2/US3
  - US2 depends on US1's `BikeAdminService`/`AdminBikesController` skeleton existing (T011/T012) but is otherwise independently testable once a variant exists
  - US3 depends on US1's `BikeAdminService`/`AdminBikesController` skeleton existing (T011) but is otherwise independently testable
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Service methods before controller endpoints before frontend client functions before UI components before UI wiring/validation

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different files/languages)
- T006 can run in parallel with T004/T005 (independent file)
- T010 can run in parallel with T004-T009 (frontend vs. backend)
- Within US1: T013, T014, T015 can run in parallel once T010-T012 are done
- Within US2: T020 can run in parallel with T018/T019
- Within US3: T025 can run in parallel with T023/T024
- T027, T028, T029 in Polish can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "Implement listAdminBikes, getAdminBike, createAdminBike, updateAdminBike in apps/admin/lib/api.ts"
Task: "Build the variant list component in apps/admin/components/bikes/BikeList.tsx"
Task: "Build the variant create/edit form component in apps/admin/components/bikes/BikeForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (create/edit variants)
4. **STOP and VALIDATE**: Create, edit, and reject invalid/duplicate variants per [quickstart.md](quickstart.md)
5. Deploy/demo if ready — variants exist but nothing is publicly visible yet (all default to unpublished)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (variants manageable, none public yet)
3. Add User Story 2 → Test independently → Deploy/Demo (variants can go live on the public site)
4. Add User Story 3 → Test independently → Deploy/Demo (cleanup capability)
5. Polish → documentation, tests, final quickstart pass

## Notes

- [P] tasks = different files, no dependencies
- Image upload/assignment (`BikeImage` mutation) and specification-metadata CRUD remain out of scope; do not add endpoints or UI for them in this feature
- Verify tests fail before implementing (if adopting TDD for T030/T031)
- Stop at any checkpoint to validate a story independently
