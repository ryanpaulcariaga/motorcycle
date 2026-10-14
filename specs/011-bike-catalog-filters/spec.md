# Feature Specification: Admin Bike Catalog Filters and Ordering

**Feature Branch**: `011-bike-catalog-filters`
**Created**: 2026-10-15
**Status**: Implemented locally (manual acceptance pending)
**Input**: User requests filtering and ordering the Bikes tab, a less crowded filter/sort experience, and retaining these settings when navigating to a bike's variants and back.

## User Scenarios & Testing

### User Story 1 - Filter bike models by brand and category (Priority: P1)

As an administrator, I want to filter and order the Bikes list by brand, category, or model line so that I can find and organize the model lines I need to manage.

**Why this priority**: The Bikes tab can contain models across multiple brands and categories; filtering makes catalog administration faster.

**Independent Test**: With bike models assigned to different brands and categories, select either filter or both and verify the displayed rows match the selection. Click each sortable table header and verify the visible rows appear in the selected order; click the active header again to reverse direction.

**Acceptance Scenarios**:

1. **Given** bike models from multiple brands and categories, **When** I select a brand, **Then** only models belonging to that brand are shown.
2. **Given** bike models from multiple categories, **When** I select a category, **Then** only models belonging to that category are shown.
3. **Given** both a brand and category are selected, **When** the filters are applied, **Then** only models matching both selections are shown.
4. **Given** one or both filters are active, **When** I clear the filters, **Then** all bike models are shown again.
5. **Given** active filters with no matching models, **When** the list updates, **Then** a clear empty-state message is shown without hiding the filter controls.
6. **Given** bike models with different brands, categories, and names, **When** I click the Brand, Category, or Model line header, **Then** the visible list is ordered by that field.
7. **Given** an active ordering field, **When** I click the same header again, **Then** the visible list reverses its ordering.
8. **Given** a filter selection and ordering settings, **When** I change the filters, **Then** the matching models remain in the selected order.
9. **Given** active filters or a non-default sort, **When** I open a model's Variants page and return to Bikes, **Then** the same filters and ordering are restored.
10. **Given** a Bikes URL with valid filter and sort parameters, **When** I open or refresh that URL, **Then** the controls and visible list reflect those parameters.

### Edge Cases

- When the catalog is empty, filters do not prevent the existing empty-catalog state from being shown.
- When either filter is set to its unfiltered option, the other selected filter continues to apply.
- Refreshing the catalog updates the shown results while retaining the selected filters as long as their options remain available.
- When multiple models have the same selected sort value, remaining descriptive fields provide a consistent tie-break order.

## Requirements

### Functional Requirements

- **FR-001**: The Bikes tab MUST provide optional brand and category filters.
- **FR-002**: Each filter MUST include an unfiltered option that is selected by default.
- **FR-003**: Administrators MUST be able to use either filter independently or combine both filters.
- **FR-004**: When both filters are selected, the list MUST show only bike models matching both the selected brand and category.
- **FR-005**: Changing or clearing filters MUST update the visible list without changing catalog data.
- **FR-006**: If filters produce no matches, the Bikes tab MUST clearly indicate that no bike models match the selected filters.
- **FR-007**: Existing create, edit, variant navigation, delete, refresh, and error behaviors MUST remain available and unchanged.
- **FR-008**: The Bikes tab MUST allow ordering by brand, category, or model line.
- **FR-009**: The Bikes tab MUST allow ascending and descending order through sortable table headers, defaulting to brand ascending.
- **FR-010**: Ordering MUST apply to the currently visible set of models and MUST update immediately when ordering or filters change.
- **FR-011**: When multiple models share a sort value, the list MUST use remaining descriptive fields as deterministic tie-breakers.
- **FR-012**: Brand and category filters MUST be grouped together, with a compact Clear filters action that is available only when at least one filter is active.
- **FR-013**: The Bikes page URL MUST represent the current brand filter, category filter, sort field, and sort direction.
- **FR-014**: The Variants link and return-to-Bikes link MUST preserve the Bikes page filter and sort state.
- **FR-015**: Opening or refreshing a Bikes URL with valid filter and sort parameters MUST initialize the controls and list from those values; absent or invalid values MUST use the defaults.

### Key Entities

- **Bike model**: A model line associated with one brand and one category, displayed in the Bikes tab.
- **Brand and category filters**: Optional selections used to narrow the visible bike model list.
- **Ordering controls**: A selected field (brand, category, or model line) and direction (ascending or descending) that determine visible row order.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Administrators can filter by brand alone, category alone, or both, with every displayed model matching all selected filters.
- **SC-002**: Clearing both filters restores every model in the loaded catalog.
- **SC-003**: An administrator can apply or clear either filter using the Bikes tab without a page reload or a catalog mutation.
- **SC-004**: A zero-match selection displays a distinct empty-result message while leaving both filter controls usable.
- **SC-005**: Administrators can order visible models by brand, category, or model line, in ascending or descending order, with brand ascending as the initial order.
- **SC-006**: Changing filters does not discard the selected ordering, and all matching visible models remain in the chosen order.
- **SC-007**: After navigating from a filtered/sorted Bikes list to Variants and back, the same filter and ordering selections are restored.
- **SC-008**: Copying or refreshing a Bikes URL restores its encoded filters and ordering.

## Assumptions

- Each filter selects one brand or one category at a time.
- Combining brand and category uses AND matching.
- Filtering is applied to the bike models already loaded for the Bikes tab; it does not require a new API contract or database change.
- Filter and ordering selections are stored in the Bikes page URL, not in browser storage or the catalog database.
- Ordering defaults to brand ascending when its URL parameters are absent.
