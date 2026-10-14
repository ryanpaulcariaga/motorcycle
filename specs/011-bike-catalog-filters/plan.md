# Implementation Plan: Admin Bike Catalog Filters and Ordering

**Branch**: `011-bike-catalog-filters` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-bike-catalog-filters/spec.md`

## Summary

Add optional brand and category filters and ordering to the Bikes tab's bike-model list. Group the filters together with a compact clear action, and use sortable table headers instead of separate sort dropdowns. Filter and sort the already-loaded model data in the admin UI, applying both selections together when present. Encode state in the Bikes page URL and preserve it through Variants navigation and return. Default to brand ascending and toggle direction by clicking the active header again. Keep controls visible when there are no matches; do not change the API or persisted catalog data.

## Technical Context

**Language/Version**: TypeScript, React 19
**Primary Dependencies**: Vite, Tailwind CSS
**Storage**: Existing bike model, brand, and category data loaded through the admin API client; transient list state in Bikes URL query parameters
**Testing**: Admin TypeScript production build (`pnpm --filter admin build`); verify filter combinations, sort fields/directions, and empty states in the Bikes tab
**Target Platform**: Browser-based private admin SPA
**Project Type**: Frontend web application
**Performance Goals**: Filter and ordering updates happen immediately against the loaded catalog without an additional network request; URL state updates in place without navigation
**Constraints**: Keep existing catalog operations and API contract unchanged; support mobile and desktop layouts
**Scale/Scope**: One admin page and its model list; no backend, database, or public frontend changes

## Constitution Check

- **Monorepo / feature workflow**: Pass. Feature is scoped in this spec and design; tasks will be dependency ordered.
- **API-first / typed contracts**: Pass. Existing API data and contracts are sufficient; filtering is client-side presentation state.
- **Clean Architecture / database as code**: Pass. No backend or schema changes.
- **Mobile-first responsive UI**: Pass. Filter controls will use responsive layout and remain usable at narrow viewport widths.
- **Documentation**: Pass. No API, architecture, or database contract changes; feature artifacts document the UI behavior.

## Project Structure

### Documentation (this feature)

```text
specs/011-bike-catalog-filters/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/admin/
└── components/
    └── bike-models/
        └── BikeModelManagement.tsx
```

**Structure Decision**: Keep list state in BikeModelManagement, share query parsing/serialization in `apps/admin/lib/bikeModelListState.ts`, and pass the encoded state through the Variants and Bikes links in the existing management components.

## Complexity Tracking

No constitution violations.
