# Feature Specification: Administrator Role Management

**Feature Branch**: `013-admin-role-management`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "in the admin page under the 'Administrators' aside from Deactive add also option to edit and delete"

## User Scenarios & Testing

### User Story 1 - Edit administrator details (Priority: P1)

An authorized administrator can edit the saved email and display name for an administrator account while preserving its Facebook identity and active status.

**Why this priority**: Correcting administrator details is the primary requested management action and does not change account access.

**Independent Test**: Open an administrator's edit form, change its email or display name, save, and verify the updated details appear in the list while the account identity and status remain unchanged.

**Acceptance Scenarios**:

1. **Given** an administrator is listed, **When** an authorized user edits and saves its email or display name, **Then** the list shows the saved details.
2. **Given** an administrator edit form is open, **When** the user cancels, **Then** no details are changed.
3. **Given** an update fails, **When** the save is submitted, **Then** an error is shown and the existing list data is retained.

### User Story 2 - Delete an administrator (Priority: P1)

An authorized administrator can permanently remove an administrator role after explicitly confirming the action.

**Why this priority**: Removing obsolete administrator accounts is the second requested lifecycle action and revokes their authorization.

**Independent Test**: Confirm deletion of a listed administrator and verify that its role disappears from the list and can no longer authorize administration requests.

**Acceptance Scenarios**:

1. **Given** an administrator role is listed, **When** the user confirms deletion, **Then** the role is permanently removed and disappears from the list.
2. **Given** a delete confirmation is shown, **When** the user cancels, **Then** the role remains unchanged.
3. **Given** deletion fails, **When** the user confirms deletion, **Then** an error is shown and the role remains visible.
4. **Given** an unauthenticated or unauthorized request, **When** it attempts to delete a role, **Then** the API rejects the request.

### Edge Cases

- Editing an account must not permit changing its Facebook identity.
- Empty optional email snapshots are saved as empty/null according to the existing update behavior; the display name remains required in the admin form.
- A role that has already been removed or does not exist returns a not-found response.
- Deletion requires confirmation and reports server errors without removing the row from the screen.

## Requirements

### Functional Requirements

- **FR-001**: Administrators MUST be able to edit the email and display name snapshots of a listed administrator.
- **FR-002**: Editing an administrator MUST preserve its Facebook identity and current active status.
- **FR-003**: Administrators MUST be able to permanently delete an administrator role only after confirming the action.
- **FR-004**: The administrator list MUST reflect successful edits and deletions without requiring a page reload.
- **FR-005**: Failed edit or delete requests MUST provide a visible error and retain the current administrator list.
- **FR-006**: Administrator role updates and deletions MUST remain protected by the existing active-administrator authorization policy.
- **FR-007**: Existing activation and deactivation actions MUST continue to work.

### Key Entities

- **Administrator role**: An authorization record containing the Facebook identity, optional email and display-name snapshots, role, active status, and timestamps.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can save changed administrator details and see them reflected in the list in one edit flow.
- **SC-002**: An authorized user can confirm or cancel a deletion before any role is removed.
- **SC-003**: Every successfully deleted role is absent from subsequent administrator listings and is denied protected administrator access.
- **SC-004**: Existing provision, activate, and deactivate workflows remain available and functional.

## Assumptions

- “Edit” applies to the editable email and display-name snapshots; the Facebook identity is the immutable identity key.
- “Delete” means permanent removal of the administrator role, rather than deactivation.
- The existing API session and active-administrator authorization boundary remains the authority for management operations.
