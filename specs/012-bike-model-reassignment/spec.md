# Feature Specification: Bike Model Reassignment

**Feature Branch**: `012-bike-model-reassignment`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "In admin 'Bikes Variants', aside from edit, unpublish, and delete, add an option that I can click and will display a modal that allow the admin to reassign a bike to different bike model. Bike model reassignment only no other specs or property to edit."

## User Scenarios & Testing

### User Story 1 - Reassign a bike variant (Priority: P1)

As an administrator managing bike variants, I can open a reassignment modal from a variant's actions, choose a different existing BikeModel, and save the change without editing the variant's other properties.

**Why this priority**: Administrators need to correct a variant assigned to the wrong BikeModel without risking accidental edits to its specifications or other details.

**Independent Test**: From the Bikes Variants list, reassign a variant to another BikeModel and confirm its model assignment changes while its year, variant name, MSRP, specifications, publication state, and images remain unchanged.

**Acceptance Scenarios**:

1. **Given** an administrator views a bike variant, **When** they choose Reassign model, **Then** a modal opens showing the current BikeModel and a selector of existing BikeModels.
2. **Given** the modal is open, **When** the administrator selects another BikeModel and confirms, **Then** the bike is assigned to that model and the list reflects the new model.
3. **Given** the modal is open, **When** the administrator closes or cancels it, **Then** the bike remains assigned to its original model.
4. **Given** reassignment would create a duplicate variant for the target BikeModel (same year and variant name), **When** the administrator confirms, **Then** the change is rejected with a clear error and no bike data is changed.

### Edge Cases

- A deleted or nonexistent target BikeModel is rejected and the existing bike assignment remains unchanged.
- Selecting the current BikeModel does not alter the bike.
- An API failure leaves the modal open and presents an actionable error.
- The reassignment action is available for both published and unpublished variants.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a Reassign model action for each bike variant in the Bikes Variants administration list.
- **FR-002**: The action MUST open a modal that allows an administrator to select a different existing BikeModel.
- **FR-003**: The reassignment operation MUST change only the bike's BikeModel association and its update timestamp; all other bike properties MUST remain unchanged.
- **FR-004**: The system MUST prevent reassignment when the target BikeModel, year, and variant name would duplicate another bike variant, and MUST report the conflict without changing data.
- **FR-005**: The system MUST reject unauthenticated or non-administrator reassignment requests.
- **FR-006**: The modal MUST support cancellation without persisting changes and MUST show failures without implying success.

### Key Entities

- **Bike variant**: A year-and-variant record with model assignment, specifications, MSRP, publication state, and related images.
- **BikeModel**: The model to which a bike variant belongs.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An administrator can complete a reassignment from the Bikes Variants list in three or fewer actions after opening the action menu.
- **SC-002**: After a successful reassignment, the target BikeModel is shown in the list and all non-model bike details are unchanged.
- **SC-003**: Invalid, duplicate, or cancelled reassignment attempts leave the bike's persisted data unchanged and provide clear feedback.

## Assumptions

- Administrators can reassign either published or unpublished variants.
- Existing uniqueness rules for model, year, and variant name apply to the target model.
- Reassignment leaves the bike's other fields and existing images intact.
