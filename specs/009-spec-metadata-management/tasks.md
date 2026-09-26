---

description: "Task list template for feature implementation"
---

# Tasks: Specification Metadata Management

**Input**: Design documents from `/specs/009-spec-metadata-management/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/admin-spec-metadata-api.md](contracts/admin-spec-metadata-api.md)

**Tests**: Focused API tests for the rename-cascade, global code uniqueness, delete-blocking, and dataType-change hard block are included as Polish-phase tasks, per this project's existing convention (Stage 1/2/3 admin slices also deferred exhaustive test suites to a hardening pass).

**Organization**: Tasks are grouped by user story (US1 = spec groups CRUD/reorder, US2 = spec definitions CRUD/reorder/move/rename-cascade) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

- Backend: `apps/api/Motorcycle.{Domain,Application,Infrastructure,Api}/`
- Admin frontend: `apps/admin/`

---

## Phase 1: Setup (Schema)

**Purpose**: Land the schema changes every story depends on

- [X] T001 Add EF Core migration: move `spec_definitions` unique index from `(group_id, code)` to `code` alone, and change `SpecGroup`→`SpecDefinition` FK `OnDelete` from `Cascade` to `Restrict`, per [research.md](research.md)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared DTOs, validators, and factory accessor every story needs

- [X] T002 [P] Add `SpecGroupAdminDto`, `CreateSpecGroupRequest`, `UpdateSpecGroupRequest` records in `apps/api/Motorcycle.Application/DTOs/SpecGroupAdminDto.cs`
- [X] T003 [P] Add `SpecDefinitionAdminDto`, `CreateSpecDefinitionRequest`, `UpdateSpecDefinitionRequest` records in `apps/api/Motorcycle.Application/DTOs/SpecDefinitionAdminDto.cs`
- [X] T004 [P] Add `SpecMetadataValidators` (code format regex, `dataType`/`filterType` consistency) in `apps/api/Motorcycle.Application/Common/SpecMetadataValidators.cs`
- [X] T005 [P] Add `SupportedFilterTypes` accessor to `ISpecFilterStrategyFactory`/`SpecFilterStrategyFactory` so `filterType` validation stays in sync with registered strategies
- [X] T006 [P] Add matching TypeScript types in `apps/admin/lib/types.ts`

---

## Phase 3: User Story 1 - Spec Groups CRUD & Reorder (Priority: P1)

**Goal**: An administrator can list, create, edit, reorder, and delete spec groups, blocked from deleting a non-empty group.

- [X] T007 [US1] Add `ISpecGroupAdminRepository`/`SpecGroupAdminRepository` (list-with-definitions, add, update, reorder, dependent-definition count, remove) in `apps/api/Motorcycle.Infrastructure/Repositories/SpecGroupAdminRepository.cs`
- [X] T008 [US1] Add `ISpecGroupAdminService`/`SpecGroupAdminService` (validation, `SpecGroupReferencedException`) in `apps/api/Motorcycle.Application/Services/SpecGroupAdminService.cs`
- [X] T009 [US1] Add `AdminSpecGroupsController` (`GET/POST/PUT/DELETE /api/admin/spec-groups`, `PUT /api/admin/spec-groups/order`) in `apps/api/Motorcycle.Api/Controllers/AdminSpecGroupsController.cs`
- [X] T010 [US1] Register new services/repositories in `apps/api/Motorcycle.Api/Program.cs`
- [X] T011 [US1] Add `apps/admin/lib/api.ts` client functions for spec-group CRUD/reorder
- [X] T012 [US1] Build `SpecGroupManagement.tsx` admin UI (list, form, drag/position reorder, delete-with-conflict messaging) in `apps/admin/components/specs/`

**Checkpoint**: Spec groups are fully manageable from the admin UI.

---

## Phase 4: User Story 2 - Spec Definitions CRUD, Reorder, Move, Rename-Cascade (Priority: P1)

**Goal**: An administrator can list, create, edit (including safe code rename and group move), reorder, and delete spec definitions, with bike data protected throughout.

- [X] T013 [US2] Add `ISpecDefinitionAdminRepository`/`SpecDefinitionAdminRepository` (list, add, update, reorder-within-group, dependent-bike count by code, remove, and the transactional rename-cascade raw SQL) in `apps/api/Motorcycle.Infrastructure/Repositories/SpecDefinitionAdminRepository.cs`
- [X] T014 [US2] Add `ISpecDefinitionAdminService`/`SpecDefinitionAdminService` (global code-uniqueness check, dataType-change hard-block check against existing bike values, `SpecDefinitionReferencedException`) in `apps/api/Motorcycle.Application/Services/SpecDefinitionAdminService.cs`
- [X] T015 [US2] Add `AdminSpecDefinitionsController` (`GET/POST/PUT/DELETE /api/admin/spec-definitions`, `PUT /api/admin/spec-groups/{groupId}/spec-definitions/order`) in `apps/api/Motorcycle.Api/Controllers/AdminSpecDefinitionsController.cs`
- [X] T016 [US2] Add `apps/admin/lib/api.ts` client functions for spec-definition CRUD/reorder/move
- [X] T017 [US2] Build `SpecDefinitionManagement.tsx` admin UI (per-group definitions list, form with group/filter-type fields, reorder, rename confirmation dialog, delete-with-conflict messaging) in `apps/admin/components/specs/`
- [X] T018 [US2] Wire a new `/admin/specs` route/nav entry in `apps/admin` linking groups + definitions management together

**Checkpoint**: Full spec metadata CRUD, including safe renames, is usable end-to-end from the admin UI.

---

## Phase 5: Polish

- [X] T019 [P] Update `docs/api.md`, `docs/database.md`, `docs/architecture.md` with the new endpoints, schema change, and rename-cascade behavior
- [X] T020 [P] Update `plan-motorcycle-web-app.md` "Remaining Admin Work" status
- [ ] T021 Add focused API tests: global code-uniqueness rejection, rename-cascade correctness, group/definition delete-blocked conflicts, dataType-change hard block, reorder persistence (deferred to the same hardening pass as prior admin stages)
