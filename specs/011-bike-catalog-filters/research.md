# Research: Admin Bike Catalog Filters and Ordering

## Decision: Filter the loaded model list in the Bikes tab

- **Rationale**: The Bikes tab already loads all bike models and the brand/category lookup options needed to match them. Client-side filtering keeps the UI responsive and avoids unnecessary API or database changes.
- **Alternatives considered**: Add query parameters or a new API endpoint. Rejected because filtering this already-loaded catalog does not require server-side data changes and a new API contract would add unnecessary scope.

## Decision: Use single-select optional brand and category filters with AND combination

- **Rationale**: Each bike model belongs to one brand and one category. Single-select filters cover filtering by either dimension or narrowing by both, with a predictable intersection when combined.
- **Alternatives considered**: Multi-select filters. Rejected because the request asks for filtering by brand and/or category, and single-select controls fulfill that need with less UI complexity.

## Decision: Keep filter state transient and encode it in the Bikes URL

- **Rationale**: Query parameters make the current filtered/sorted view refreshable and shareable and allow the Variants and Bikes links to carry list state through navigation without storing personal preferences or changing catalog data.
- **Alternatives considered**: Keep selections only in component state, which loses them on navigation or refresh; use browser storage, which persists implicitly and is less shareable. URL state meets the navigation requirement with explicit transient state.

## Decision: Sort the filtered list locally through sortable table headers

- **Rationale**: The full model list is already loaded for the Bikes tab, so sorting in the same presentation layer keeps filtering and ordering immediate and avoids new API behavior. Clickable Brand, Category, and Model line headers keep sort actions close to the data and reduce toolbar controls. Brand ascending is a predictable initial order; clicking another header selects that field ascending, while clicking the active header reverses direction.
- **Alternatives considered**: Server-side ordering or persisted preferences. Rejected because ordering the loaded catalog does not require a new API contract, and persisted preferences are outside the requested behavior.

## Decision: Use locale-aware, numeric, case-insensitive comparison with deterministic tie-breakers

- **Rationale**: Locale-aware comparison places text and numeric model labels in a natural order regardless of capitalization. Remaining descriptive fields break ties consistently.
- **Alternatives considered**: Compare raw strings or retain the API's order for equal values. Rejected because these approaches can produce less natural or unstable list ordering.
