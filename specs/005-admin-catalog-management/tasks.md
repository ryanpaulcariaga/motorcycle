---
description: "Actionable implementation tasks for Admin Catalog Management"
---

# Tasks: Admin Catalog Management

**Input**: Design documents from `/specs/005-admin-catalog-management/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/admin-api.md`, and `quickstart.md`

**Tests**: Included because the implementation plan requires focused API and frontend tests for authentication, authorization, CRUD validation, delete protection, and responsive workflows.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an incremental slice.

**Continuation**: Read [implementation-status.md](implementation-status.md) before starting a new session. Completed tasks are marked `[X]`; continue from the first applicable unchecked task and preserve the existing local AdminRole/bootstrap data.

## Phase 1: Setup

**Purpose**: Establish the admin workspace and test/configuration surfaces required by later stories.

- [X] T001 Create the `apps/admin` Next.js 16 App Router workspace with TypeScript, Tailwind CSS, package scripts, and `apps/admin/tsconfig.json` matching `apps/web` conventions
- [X] T002 [P] Copy the public app's shared visual tokens and base layout conventions into `apps/admin/app/globals.css`, `apps/admin/app/layout.tsx`, and `apps/admin/next.config.ts`
- [X] T003 [P] Create the admin workspace typed contract files at `apps/admin/lib/types.ts` and `apps/admin/lib/api.ts` with the shared API base URL configuration
- [X] T004 [P] Add Stage 1 admin environment examples and secret names to `apps/admin/.env.example` without committing OAuth client secrets, session keys, or API credentials
- [X] T005 [P] Add the admin workspace to repository package/build/lint validation in `package.json` and the applicable workspace configuration files

---

## Phase 2: Foundational Security and API Infrastructure

**Purpose**: Build the blocking authentication, authorization, persistence, error, and API boundaries required by every user story.

**Checkpoint**: The shared API can validate a first-party admin credential, resolve an active `AdminRole`, and return stable unauthorized/forbidden/validation/conflict errors without changing public catalog routes.

- [X] T006 Add the `AdminRole` domain entity with Facebook identity snapshots, role, active status, and UTC lifecycle timestamps in `apps/api/Motorcycle.Domain/AdminRole.cs`
- [X] T007 [P] Define admin-role and first-party credential abstractions in `apps/api/Motorcycle.Application/Interfaces/` and shared error/result contracts in `apps/api/Motorcycle.Application/Common/`, including the `Administrator` role value and JWT claim requirements
- [X] T008 [P] Add `AdminRole` EF mapping, unique Facebook user ID index, required lengths, and snake_case naming in `apps/api/Motorcycle.Infrastructure/Persistence/MotorcycleDbContext.cs`
- [X] T009 Create the EF Core migration for the `admin_roles` table in `apps/api/Motorcycle.Infrastructure/Migrations/` and verify it is idempotent with the existing migration/startup flow
- [X] T010 Implement `AdminRoleRepository` and first-party identity lookup in `apps/api/Motorcycle.Infrastructure/Repositories/` with active-status filtering
- [X] T011 Implement RS256 JWT validation and active-administrator authorization composition in `apps/api/Motorcycle.Api/Program.cs` and `apps/api/Motorcycle.Api/Authorization/`, checking signature, issuer, audience, subject, expiry, and active `AdminRole`
- [ ] T012 Add protected `/api/admin` routing and shared problem-details mappings for `401`, `403`, `400`, `404`, and `409` responses in `apps/api/Motorcycle.Api/Controllers/` and `apps/api/Motorcycle.Api/Common/`
- [X] T013 [P] Add first-party JWT issuer/audience/public-key configuration placeholders and local-development validation rules to `apps/api/Motorcycle.Api/appsettings.json` and `apps/api/Motorcycle.Api/appsettings.Development.json` without storing secrets
- [X] T014 [P] Add reusable admin API error parsing and authenticated request handling to `apps/admin/lib/api.ts` for session expiry, field validation, and conflict codes

---

## Phase 3: User Story 1 - Authorized Administrator Session (Priority: P1) 🎯 MVP

**Goal**: An active administrator can complete Facebook Authorization Code + PKCE sign-in and use an application-managed session while unauthorized identities cannot reach protected administration routes.

**Independent Test**: Complete sign-in with an active role, reject an unassigned/inactive identity, exercise an expired session, and verify that no Facebook access token is sent to the API.

### Tests for User Story 1

- [ ] T015 [P] [US1] Add API authorization tests for missing, invalid-signature, wrong-issuer/audience, expired, unassigned, inactive, and active first-party JWTs in `apps/api/tests/Authorization/AdminAuthorizationTests.cs`
- [ ] T016 [P] [US1] Add authentication callback and session-boundary tests covering PKCE state/verifier handling and Facebook-token non-forwarding in `apps/admin/tests/auth/session.test.ts`

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement Facebook Authorization Code + PKCE configuration, state/verifier handling, callback exchange, and failure/cancellation paths in `apps/admin/app/api/auth/` and `apps/admin/lib/auth.ts`
- [X] T018 [US1] Implement encrypted HttpOnly admin session creation, expiry, sign-out, and server-side RS256 first-party JWT minting with `iss`, `aud`, `sub`, `exp`, and `jti` claims in `apps/admin/lib/session.ts`, `apps/admin/lib/first-party-token.ts`, and `apps/admin/app/api/auth/`
- [X] T019 [US1] Implement the admin entry/auth gate and unauthorized/error redirect behavior in `apps/admin/app/page.tsx`, `apps/admin/app/admin/layout.tsx`, and `apps/admin/app/api/auth/`
- [X] T020 [US1] Implement the responsive authenticated admin shell, navigation, sign-in/sign-out actions, and session-gated role/catalog routes in `apps/admin/app/admin/layout.tsx`, `apps/admin/app/admin/page.tsx`, and `apps/admin/app/admin/roles/page.tsx`
**Checkpoint**: An existing active administrator can sign in and load the private shell; unassigned and inactive identities are rejected; public routes remain anonymous. First-administrator bootstrap is completed in US2 after the role service exists.

---

## Phase 4: User Story 2 - Administrator Role Management (Priority: P1)

**Goal**: An active administrator can list, provision, activate, and deactivate role records, with no role deletion and duplicate identity protection.

**Independent Test**: From an active admin session, list roles, provision a new identity, reject duplicate provisioning, deactivate it, verify access is denied, and reactivate it.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add Application/service tests for role validation, duplicate Facebook identity conflicts, activation/deactivation, immutable identity, and no-delete behavior in `apps/api/tests/Application/AdminRoleServiceTests.cs`
- [ ] T022 [P] [US2] Add API contract/integration tests for `GET/POST/PATCH /api/admin/admin-roles` and `admin_role_exists` responses in `apps/api/tests/Controllers/AdminRolesControllerTests.cs`
- [ ] T023 [P] [US2] Add admin role-list and role-form workflow tests for loading, empty, validation, duplicate, and mutation states in `apps/admin/tests/roles/role-management.test.ts`

### Implementation for User Story 2

- [X] T024 [P] [US2] Add administrator role DTOs and request validation in `apps/api/Motorcycle.Application/DTOs/AdminRoleDto.cs` and `apps/api/Motorcycle.Application/Common/AdminRoleValidators.cs`
- [X] T025 [US2] Implement `AdminRoleService` and its Application contract for list, provision, update, activate, and deactivate operations in `apps/api/Motorcycle.Application/Services/AdminRoleService.cs` and `apps/api/Motorcycle.Application/Interfaces/IAdminRoleService.cs`
- [X] T026 [US2] Implement the operator-only idempotent first-administrator bootstrap command in `apps/api/Motorcycle.Api/Bootstrap/AdminBootstrapCommand.cs` and `apps/api/Motorcycle.Api/Program.cs`, reuse `AdminRoleService`, refuse unexpected overwrite, and document the post-migration invocation in `apps/api/README.md`
- [X] T027 [US2] Implement protected role endpoints and stable duplicate/validation responses in `apps/api/Motorcycle.Api/Controllers/AdminRolesController.cs`
- [X] T028 [US2] Register the role repository/service and authorization dependencies in `apps/api/Motorcycle.Api/Program.cs`
- [X] T029 [P] [US2] Add admin role TypeScript types and typed client functions for list, provision, and status updates in `apps/admin/lib/types.ts` and `apps/admin/lib/api.ts`
- [X] T030 [US2] Build the role-management page, list, provision form, activation/deactivation controls, and audit-friendly field display in `apps/admin/app/admin/roles/page.tsx` and `apps/admin/components/roles/`

**Checkpoint**: The bootstrap command can create the first active administrator after migration, and that administrator can provision and control additional administrators before any BikeModel mutation workflow is enabled.

---

## Phase 5: User Story 3 - BikeModel Management (Priority: P1)

**Goal**: An active administrator can list, create, edit, and safely delete BikeModels using existing brand and category references.

**Independent Test**: List BikeModels, create and edit a valid record, reject invalid/duplicate values, delete an unreferenced record, and receive a clear conflict when a bike references the target model.

### Tests for User Story 3

- [ ] T031 [P] [US3] Add BikeModel service tests for required values, brand/category existence, unique `(brandId, name)`, update-not-found, and dependent-bike deletion checks in `apps/api/tests/Application/BikeModelServiceTests.cs`
- [ ] T032 [P] [US3] Add API contract/integration tests for all `/api/admin/bike-models` operations and `bike_model_referenced` conflict responses in `apps/api/tests/Controllers/AdminBikeModelsControllerTests.cs`
- [ ] T033 [P] [US3] Add admin BikeModel list/form workflow tests for create, edit, delete confirmation, validation, empty, loading, and conflict states in `apps/admin/tests/bike-models/bike-model-management.test.ts`

### Implementation for User Story 3

- [X] T034 [P] [US3] Add BikeModel response/request DTOs and field validation in `apps/api/Motorcycle.Application/DTOs/BikeModelDto.cs` and `apps/api/Motorcycle.Application/Common/BikeModelValidators.cs`
- [X] T035 [US3] Implement BikeModel repository operations with brand/category projections and dependent-bike count checks in `apps/api/Motorcycle.Application/Interfaces/IBikeModelRepository.cs` and `apps/api/Motorcycle.Infrastructure/Repositories/BikeModelRepository.cs`
- [X] T036 [US3] Implement BikeModel application service create/update/delete orchestration and stable conflict mapping in `apps/api/Motorcycle.Application/Services/BikeModelService.cs` and `apps/api/Motorcycle.Application/Interfaces/IBikeModelService.cs`
- [X] T037 [US3] Implement protected BikeModel endpoints and map duplicate, validation, not-found, and `bike_model_referenced` results in `apps/api/Motorcycle.Api/Controllers/AdminBikeModelsController.cs`
- [X] T038 [US3] Register BikeModel repositories/services and verify public catalog controllers remain unchanged in `apps/api/Motorcycle.Api/Program.cs` and `apps/api/Motorcycle.Api/Controllers/`
- [X] T039 [P] [US3] Add BikeModel, Brand, and Category TypeScript types plus typed list/create/update/delete client functions in `apps/admin/lib/types.ts` and `apps/admin/lib/api.ts`
- [X] T040 [US3] Build BikeModel list, create/edit form, brand/category selectors, delete confirmation, and API error presentation in `apps/admin/app/admin/bike-models/page.tsx` and `apps/admin/components/bike-models/`

**Checkpoint**: Authorized administrators can maintain unreferenced BikeModels, while referenced models remain protected and public catalog behavior is unchanged.

---

## Phase 6: User Story 4 - Administration States and Responsive Feedback (Priority: P2)

**Goal**: The private admin experience communicates loading, empty, validation, authorization, conflict, retry, and session-expiry states clearly on mobile and desktop.

**Independent Test**: Exercise each state at 320px, 768px, and 1024px+ widths and verify no required action is hidden, overlapped, or duplicated.

### Tests for User Story 4

- [ ] T041 [P] [US4] Add responsive browser checks for admin shell navigation, role list/form, BikeModel list/form, and error banners at required viewport widths in `apps/admin/tests/responsive/admin-responsive.spec.ts`
- [ ] T042 [P] [US4] Add UI state tests for loading locks, empty states, retryable service errors, unauthorized redirects, and conflict messages in `apps/admin/tests/states/admin-states.test.ts`

### Implementation for User Story 4

- [ ] T043 [P] [US4] Add shared loading, empty, field-error, conflict, authorization, and retry components in `apps/admin/components/feedback/`
- [ ] T044 [US4] Apply mobile-first responsive layout and accessible focus/disabled states across `apps/admin/components/`, `apps/admin/app/globals.css`, and admin route pages
- [ ] T045 [US4] Preserve in-progress form values across service errors and show re-authentication guidance on session expiry in `apps/admin/lib/forms/` and affected role/BikeModel components

**Checkpoint**: All Stage 1 workflows provide consistent feedback and remain usable across supported viewport sizes.

---

## Phase 7: Polish and Cross-Cutting Concerns

**Purpose**: Bring documentation, security, regression validation, and end-to-end readiness together without adding deferred Stage 2 functionality.

- [X] T046 [P] Update `docs/api.md` with the protected role and BikeModel endpoints, DTOs, status/error contracts, and public-route guarantees
- [X] T047 [P] Update `docs/architecture.md` with the admin frontend, first-party session boundary, authorization flow, and shared API ownership
- [X] T048 [P] Update `docs/database.md` with the `admin_roles` schema, unique identity constraint, timestamps, and BikeModel deletion-protection behavior
- [ ] T049 [P] Add security review checks for OAuth state/PKCE validation, HttpOnly/Secure/SameSite session cookies, token expiry, secret handling, and absence of Facebook-token forwarding in `apps/admin/tests/security/`
- [ ] T050 Run the API build/test, admin lint/build, and all scenarios in `specs/005-admin-catalog-management/quickstart.md`; record any environment blockers in `specs/005-admin-catalog-management/quickstart.md`
- [X] T051 Confirm no Bike CRUD, publication, image, Blob Storage, or specification metadata mutation endpoints were added to `apps/api/Motorcycle.Api/Controllers/` or `specs/005-admin-catalog-management/contracts/admin-api.md`

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies; T001 must precede T002-T005 where workspace files are required.
- **Phase 2 Foundational**: Depends on Setup; blocks every user story because all workflows require protected API infrastructure.
- **Phase 3 US1**: Depends on Phase 2; establishes the authenticated admin shell and is the MVP security slice. It assumes an active administrator can be bootstrapped in US2 before end-to-end sign-in validation.
- **Phase 4 US2**: Depends on US1's session and authorization boundary; T026 follows T025 so the bootstrap command reuses the implemented `AdminRoleService`. It is required before BikeModel management so administrators can provision access.
- **Phase 5 US3**: Depends on US1 and US2; role management must exist before catalog mutations.
- **Phase 6 US4**: Depends on US1-US3 because it standardizes states across completed workflows.
- **Phase 7 Polish**: Depends on all desired Stage 1 stories and their focused tests.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only; independently testable as authentication and authorization using a test/bootstrap fixture. The operator bootstrap command is intentionally delivered in US2 after `AdminRoleService` exists.
- **US2 (P1)**: Depends on US1 for the session and authorization boundary; independently testable as role lifecycle management, including first-administrator bootstrap.
- **US3 (P1)**: Depends on US1 for protection and US2 for the required role-provisioning-before-CRUD sequence; independently testable as BikeModel management once those prerequisites exist.
- **US4 (P2)**: Depends on US1-US3; independently testable as the cross-workflow feedback and responsive behavior slice.

### Within Each User Story

- Write the story tests before implementation where the test framework is available; verify they fail for missing behavior.
- Implement models/contracts before services, services before controllers, and API contracts before UI consumers.
- Complete the checkpoint independent test before starting the next dependent story.

## Parallel Opportunities

- T002-T005 can run in parallel after T001.
- T007-T009, T013, and T014 can run in parallel within foundational work when their shared configuration files are coordinated.
- T015-T016 can run in parallel; T017-T020 can be split between auth/session and shell work after the test contracts are agreed.
- T022-T024 can run in parallel; T025 and T029 can proceed in parallel before T026/T030 integration.
- T031-T033 can run in parallel; T034, T039, and UI scaffolding can proceed in parallel before service/controller integration.
- T041-T042 can run in parallel; T043-T045 can be split across shared feedback and responsive/form-state work.
- T046-T049 can run in parallel after API contracts stabilize.

## Parallel Example: User Story 2

```text
Task A: T022 role service tests in apps/api/tests/Application/AdminRoleServiceTests.cs
Task B: T023 role controller contract tests in apps/api/tests/Controllers/AdminRolesControllerTests.cs
Task C: T024 role UI workflow tests in apps/admin/tests/roles/role-management.test.ts
Task D: T025 admin role DTOs and validators in apps/api/Motorcycle.Application/
Task E: T029 admin role TypeScript types/client functions in apps/admin/lib/
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 Setup and Phase 2 Foundational security/API work.
2. Complete US1 to deliver Facebook PKCE sign-in, protected first-party API access, and the authenticated shell.
3. Complete US2 as part of the practical Stage 1 MVP because the initial administrator needs role management before BikeModel CRUD can be safely exposed.
4. Stop and validate US1 + US2 independently using their checkpoints and the authentication/role quickstart scenarios.

### Incremental Delivery

1. Setup + Foundational: protected API and persistence foundation.
2. US1: private authenticated shell.
3. US2: administrator provisioning and lifecycle.
4. US3: BikeModel CRUD and delete protection.
5. US4: consistent feedback and responsive behavior.
6. Polish: documentation, security checks, full quickstart validation, and deferred-scope verification.

## Notes

- Every task uses the required `- [ ] T###` checklist format; `[P]` marks only parallelizable work and `[US#]` appears only in user-story phases.
- No Stage 2 bike, image, Blob Storage, or specification metadata CRUD tasks are included.
- `AdminRole` is the only new persistence entity; BikeModel and its existing relationships are reused.
- The next admin stage must begin only after the remaining Stage 1 validation tasks are reviewed. Candidate follow-on scope is bike CRUD/publication management, followed by image assignment and specification metadata, each with a separate contract and migration review.
