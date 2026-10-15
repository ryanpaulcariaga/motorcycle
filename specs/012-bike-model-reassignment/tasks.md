# Tasks: Bike Model Reassignment

**Input**: Design documents from `/specs/012-bike-model-reassignment/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, and `contracts/admin-bike-model-reassignment.md`

## Phase 1: Setup

No new project or dependency setup is required.

## Phase 2: Foundational

No shared infrastructure or schema changes are required. The existing authenticated admin API, Bike repository, BikeModel lookup, and modal component are reused.

## Phase 3: User Story 1 - Reassign a bike variant (Priority: P1) 🎯 MVP

**Goal**: Allow an administrator to reassign a bike variant to a different existing BikeModel without editing any other bike property.

**Independent Test**: Reassign a variant in the admin list and verify only its model association changes; verify cancellation, nonexistent target, and duplicate-target attempts do not change the bike.

### Implementation

- [X] T001 [US1] Add a model-reassignment request DTO and `ReassignModelAsync` service contract in `apps/api/Motorcycle.Application/DTOs/BikeAdminDto.cs` and `apps/api/Motorcycle.Application/Interfaces/IBikeAdminService.cs`.
- [X] T002 [US1] Implement model existence, duplicate variant validation, no-op handling, and the update of only `ModelId` and `UpdatedAt` in `apps/api/Motorcycle.Application/Services/BikeAdminService.cs`.
- [X] T003 [US1] Add the protected `PATCH /api/admin/bikes/{id}/model` route with 400, 404, and 409 responses in `apps/api/Motorcycle.Api/Controllers/AdminBikesController.cs`.
- [X] T004 [US1] Extend fake BikeModel lookup behavior and cover successful reassignment, unchanged non-model fields, unknown model, missing bike, and duplicate rejection in `apps/api/Motorcycle.Api.Tests/Fakes/FakeLookupRepositories.cs` and `apps/api/Motorcycle.Api.Tests/BikeAdminServiceTests.cs`.
- [X] T005 [P] [US1] Add the typed reassignment request and API-client call in `apps/admin/lib/types.ts` and `apps/admin/lib/api.ts`.
- [X] T006 [US1] Add a Reassign model row action and selector-only modal with confirmation, cancellation, busy state, error handling, and list refresh in `apps/admin/components/bikes/BikeManagement.tsx`.
- [X] T007 [P] [US1] Document the route, request, response, and error behavior in `docs/api.md` and `specs/006-bike-catalog-management/contracts/admin-bikes-api.md`.

**Checkpoint**: The reassign action works for published and unpublished bikes; other variant data and related images remain unchanged.

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T008 Run focused admin lint/build and API tests; resolve failures caused by this feature.
- [X] T009 Verify the implementation against `specs/012-bike-model-reassignment/quickstart.md` and mark completed tasks in this file.

## Dependencies & Execution Order

### Phase Dependencies

- Setup and Foundational have no implementation work for this feature.
- User Story 1 is the complete MVP.
- Polish follows User Story 1.

### User Story Dependencies

- User Story 1 has no dependency on another user story.

### Within the User Story

- T001 defines the request and service contract before the service/controller integration.
- T002 depends on T001.
- T003 depends on T001 and T002.
- T004 depends on T001 and T002.
- T005 may proceed in parallel with backend work because it follows the documented contract.
- T006 depends on T005 and calls the operation from the row action.
- T007 may proceed in parallel with implementation once the contract is agreed.
- T008 and T009 depend on all implementation and documentation tasks.

## Parallel Opportunities

- T005 and T007 can be worked on in parallel with backend tasks T001-T004.
- After the request shape is agreed, frontend and backend implementation can proceed independently against the contract.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Implement the dedicated API operation and focused service tests.
2. Add the typed admin client and the selector-only reassignment modal.
3. Update API documentation.
4. Run API tests, admin build/lint, and quickstart scenarios.
