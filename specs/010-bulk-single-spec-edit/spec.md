# Feature Specification: Bulk Single-Spec Edit

**Feature Branch**: `010-bulk-single-spec-edit`
**Created**: 2026-10-15
**Status**: Implemented locally (acceptance tests pending)

## Summary

An administrator picks one specification and sets its value across many motorcycles on one screen, instead of opening each bike's variant form. Brand, category, and MSRP range filters are optional.

## User Scenarios

### User Story 1 - Set one spec across many motorcycles (Priority: P1)

As an administrator, I select a specification and optional brand/category/price filters, see the matching motorcycles each with an input for that specification, edit several values, and save them together.

**Acceptance Scenarios**:

1. **Given** only a specification is selected, **When** I load, **Then** every bike (published or not) is listed with its current value for that spec.
2. **Given** a specification and optional filters are selected, **When** I load, **Then** every matching bike (published or not) is listed with its current value for that spec.
3. **Given** I changed some rows, **When** I save, **Then** only changed rows are sent and all update in one operation.
4. **Given** I clear an input and save, **Then** that spec is removed from the bike.
5. **Given** any submitted value has the wrong type for the spec, **When** I save, **Then** nothing is saved and an error is shown.
6. **Given** unsaved edits, **When** I reload with new filters, **Then** I am asked to confirm discarding them.

## Requirements

- **FR-001**: Only one specification is edited per save.
- **FR-002**: Brand, category, and min/max MSRP filters are optional; only the specification is required.
- **FR-003**: Values are validated against the spec definition's `dataType`; the batch is all-or-nothing.
- **FR-004**: Endpoints are protected by the `ActiveAdministrator` policy under `/api/admin/bikes`; the admin SPA uses only the shared API.
- **FR-005**: Saved bikes have `UpdatedAt` refreshed; no schema change.

## Out of Scope

Editing multiple specs at once, core fields (year, variant, MSRP), and publication state.
