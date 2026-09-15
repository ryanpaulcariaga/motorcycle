# Feature Specification: Admin Catalog Management

**Feature Branch**: `005-admin-catalog-management`

**Created**: 2026-09-16

**Status**: Stage 1 implemented locally; automated acceptance testing pending

**Input**: User description: "Provide a private administration experience for maintaining the motorcycle catalog. Stage 1 includes Facebook sign-in, administrator role management, and BikeModel management; bike records, images, and specification metadata are deferred."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish an authorized administrator session (Priority: P1)

An invited catalog administrator signs in with Facebook and reaches the private administration experience only when their Facebook identity has an active administrator role. The administration experience uses an application-managed session or short-lived first-party credential for catalog requests; Facebook access tokens are never sent directly to the catalog service.

**Why this priority**: The catalog must remain private and mutations must be attributable to authorized administrators before any management workflow is available.

**Independent Test**: Test sign-in with an active role, an inactive role, an unassigned identity, a rejected sign-in, and an expired session without using BikeModel management.

**Acceptance Scenarios**:

1. **Given** a Facebook identity with an active administrator role, **When** the user completes sign-in, **Then** the user reaches the administration shell with an application-managed authenticated session.
2. **Given** a Facebook identity with no role or an inactive role, **When** the user completes sign-in, **Then** the user is denied access and no catalog mutation is possible.
3. **Given** an expired or invalid administration session, **When** the user requests a protected administration action, **Then** the action is rejected and the user is prompted to sign in again.
4. **Given** a Facebook sign-in failure or cancellation, **When** the callback is handled, **Then** the user sees a clear failure state and no authenticated administration session is created.

### User Story 2 - Provision and maintain administrator roles (Priority: P1)

An authorized administrator can find administrator role records, provision a new administrator from a Facebook user ID, and activate or deactivate existing records. Role records remain available for audit and are never deleted.

**Why this priority**: The first administrator must be able to establish the access needed for the rest of Stage 1, and access must be manageable without direct database changes.

**Independent Test**: Using an active administrator session, list role records, provision a valid record, reject duplicate identities, deactivate it, reactivate it, and verify that deactivated users cannot perform protected actions.

**Acceptance Scenarios**:

1. **Given** an active administrator, **When** they open role management, **Then** they can see each role record's Facebook user ID, email snapshot, display-name snapshot, role, active status, and created/updated timestamps.
2. **Given** an active administrator and an unassigned Facebook user ID, **When** they provision that identity with a supported role, **Then** a new active role record is created and the identity can sign in as an administrator.
3. **Given** an existing role record, **When** an active administrator deactivates it, **Then** the record remains listed as inactive and that identity can no longer access protected administration actions.
4. **Given** an inactive role record, **When** an active administrator reactivates it, **Then** the identity can sign in and use the permissions associated with its role.
5. **Given** a Facebook user ID already represented by a role record, **When** an administrator attempts to provision it again, **Then** the request is rejected with a clear duplicate-identity message.
6. **Given** an inactive administrator, **When** they request role-management data or mutations, **Then** the request is rejected.

### User Story 3 - Manage BikeModels (Priority: P1)

An authorized administrator can view the catalog's BikeModels and create, edit, or delete a BikeModel using its brand, category, and model-line name.

**Why this priority**: BikeModel records are the foundational catalog data needed before individual bikes can be maintained in a later stage.

**Independent Test**: With an active administrator session and existing brands/categories, list BikeModels, add one, edit its values, delete an unreferenced one, and verify the resulting list after each action.

**Acceptance Scenarios**:

1. **Given** an active administrator and available catalog data, **When** they open BikeModel management, **Then** the current BikeModels are listed with brand, category, and model-line name.
2. **Given** valid required values, **When** an administrator submits a new BikeModel, **Then** it is saved and appears in the list.
3. **Given** an existing BikeModel, **When** an administrator edits valid values, **Then** the updated values are saved and displayed.
4. **Given** an existing BikeModel with no related bikes, **When** an administrator confirms deletion, **Then** the BikeModel is removed from the list.
5. **Given** invalid or missing required values, **When** an administrator submits a create or edit form, **Then** the form identifies the invalid fields and does not save changes.

### User Story 4 - Understand administration states and failures (Priority: P2)

An administrator can use the private shell on mobile and desktop and can distinguish loading, empty, validation, authorization, conflict, and general mutation states.

**Why this priority**: Clear feedback prevents accidental duplicate work and makes catalog maintenance dependable across supported screen sizes.

**Independent Test**: Exercise each listed state with a responsive viewport and verify that content remains readable, actions remain reachable, and errors explain the next useful action.

**Acceptance Scenarios**:

1. **Given** a request in progress, **When** the administrator views the relevant page, **Then** a loading state is shown without allowing duplicate submissions.
2. **Given** no records exist for a list, **When** the administrator opens that list, **Then** an empty state explains what can be added or done next.
3. **Given** a BikeModel referenced by one or more bikes, **When** an administrator attempts to delete it, **Then** the operation is rejected as a conflict and the UI explains that related bikes must be addressed first.
4. **Given** a protected request fails because the session is unauthorized, **When** the response is received, **Then** the UI explains that sign-in is required rather than reporting a generic catalog failure.

### Edge Cases

- A Facebook identity may have changed email address or display name since its role record was created; the stored snapshots remain visible and can be refreshed by an authorized role-management action without changing the stable Facebook user ID.
- A role-management or BikeModel mutation may be submitted twice; the system must not create duplicate role records or duplicate BikeModels from a repeated request.
- A brand or category needed by a BikeModel form may be unavailable; the form must prevent saving and identify the missing selection.
- A BikeModel deletion may race with creation of a related bike; the final operation must preserve the no-delete-when-referenced rule and report a conflict.
- A session may expire while a form is being edited; entered values should not be silently discarded before the user is told to authenticate again.
- Network or service failures must preserve existing data and provide a retryable, user-understandable error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a private administration experience separate from the public catalog experience.
- **FR-002**: The system MUST authenticate administrators through Facebook Authorization Code with PKCE.
- **FR-003**: The system MUST maintain the administration session using an application-managed session or short-lived first-party credential and MUST NOT send Facebook access tokens directly to the catalog service.
- **FR-004**: The system MUST authorize protected administration actions only for authenticated users with an active administrator role.
- **FR-005**: The system MUST use the shared catalog service for administration data and MUST prevent browser clients from accessing PostgreSQL or Azure Blob Storage directly.
- **FR-006**: The system MUST store one administrator role record per unique Facebook user ID.
- **FR-007**: Each administrator role record MUST include the Facebook user ID, email snapshot, display-name snapshot, role, active status, and created and updated timestamps.
- **FR-008**: An active administrator MUST be able to list administrator role records and provision, activate, or deactivate records.
- **FR-009**: The system MUST reject duplicate provisioning for an existing Facebook user ID with a clear conflict response.
- **FR-010**: The system MUST retain deactivated administrator role records and MUST NOT provide deletion of role records.
- **FR-011**: The system MUST make role management available before BikeModel management so the initial administrator can provision additional administrators.
- **FR-012**: An active administrator MUST be able to list BikeModels with their brand, category, and model-line name.
- **FR-013**: An active administrator MUST be able to create and edit BikeModels using a valid brand, category, and model-line name.
- **FR-014**: The system MUST validate required BikeModel values before saving and MUST return field-level feedback for invalid submissions.
- **FR-015**: An active administrator MUST be able to delete a BikeModel only when no bike references it.
- **FR-016**: The system MUST reject deletion of a BikeModel referenced by any bike and MUST return a conflict result that the administration experience presents clearly.
- **FR-017**: The administration experience MUST provide responsive navigation and usable list/form workflows at mobile and desktop sizes.
- **FR-018**: The administration experience MUST provide loading, empty, validation, authorization, conflict, and general service-failure states for role and BikeModel workflows.
- **FR-019**: The system MUST keep public catalog access anonymous and read-only; this feature MUST NOT add public catalog editing.

### Key Entities

- **Administrator Role**: A durable authorization record keyed by a unique Facebook user ID, with identity snapshots, role, active status, and lifecycle timestamps.
- **BikeModel**: A catalog model-line record associated with one brand and one category, and referenced by zero or more individual bikes.
- **Brand**: An existing catalog manufacturer reference selectable by a BikeModel.
- **Category**: An existing catalog classification reference selectable by a BikeModel.
- **Bike**: An existing catalog record whose reference to a BikeModel prevents deletion of that BikeModel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of protected role and BikeModel mutation attempts by unauthenticated, unassigned, or inactive users are rejected.
- **SC-002**: In acceptance testing, an authorized administrator can complete sign-in and reach the administration shell in under 2 minutes when the identity provider is available.
- **SC-003**: In acceptance testing, an authorized administrator can provision an administrator role and complete a valid BikeModel create or edit workflow in under 3 minutes per task.
- **SC-004**: In acceptance testing, 100% of BikeModel deletion attempts with an existing bike reference are blocked and show a clear conflict explanation.
- **SC-005**: At least 90% of representative administrators can complete role provisioning and BikeModel maintenance without assistance on their first attempt.
- **SC-006**: The administration experience remains usable at 320px mobile width and at desktop widths of 1024px or greater, with no required action hidden or overlapping.
- **SC-007**: Repeated submission of the same role-provisioning request does not create more than one role record for that Facebook user ID.

## Assumptions

- The existing catalog already provides brands, categories, BikeModels, and bikes as data concepts available to the shared service.
- Stage 1 supports a finite set of administrator roles defined by the product; role-specific permission differences beyond active administrator access are deferred unless required during planning.
- A trusted bootstrap process or initial deployment configuration establishes the first active administrator before normal role management begins; no public self-service registration is provided.
- Email and display name are snapshots for administration visibility and audit context, not the stable identity key.
- Standard user-friendly error handling and retry behavior are sufficient for transient service failures.

## Out of Scope

- Public self-service registration or public catalog editing.
- Direct browser access to database or Blob Storage credentials.
- Bike CRUD, bike publication management, image upload/assignment, and specification-group or specification-definition CRUD in Stage 1.
- User-review, advertising, survey, analytics, or dealer-management administration.
- Public self-service management of administrator identities or roles.
