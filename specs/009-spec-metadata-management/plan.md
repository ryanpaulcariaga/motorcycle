# Implementation Plan: Specification Metadata Management

**Branch**: `009-spec-metadata-management` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-spec-metadata-management/spec.md`

## Summary

Add an admin CRUD surface for `spec_groups` and `spec_definitions`, completing the "Remaining Admin Work" item long-tracked in `plan-motorcycle-web-app.md`. The core risk this feature manages is that `spec_definitions.code` is the literal JSON key used across every `bikes.specs` row: renaming or deleting a code must never silently orphan bike data. This plan (a) tightens `code` uniqueness from per-group to global, (b) adds a transactional rename-cascade that renames the matching key across every affected bike row in the same operation as the definition update, (c) blocks deletion of a group with definitions or a definition with in-use bike values (mirroring the existing `BikeModel`/`Bike` referenced-conflict pattern), and (d) adds group/definition assignment and ordering to the admin UI.

## Technical Context

| Area | Decision |
|---|---|
| Admin frontend | Extend `apps/admin` with a new spec-metadata management view: a group list/form (with reorder) and, per group, a definitions list/form (with reorder and group-move), reusing the existing Vite React/TypeScript/Tailwind conventions and centralized typed client (`apps/admin/lib/api.ts`). |
| Backend | Extend the existing ASP.NET Core API: `Motorcycle.Application` gets `ISpecGroupAdminService`/`ISpecDefinitionAdminService` + DTOs, `Motorcycle.Infrastructure` gets repository methods (including the raw-SQL rename-cascade), `Motorcycle.Api` gets `AdminSpecGroupsController`/`AdminSpecDefinitionsController`. |
| Authentication/Authorization | Reuse existing `ActiveAdministrator` policy unchanged on every new endpoint. No new auth mechanism. |
| Schema changes | (1) `spec_definitions` unique index moves from `(group_id, code)` to `code` alone. (2) `SpecGroup`→`SpecDefinition` FK `OnDelete` changes from `Cascade` to `Restrict`. Both via one new EF Core migration; no bike-data migration needed (see research.md). |
| Rename-cascade | A single DB transaction combining the EF Core `SpecDefinition.Code` update and one raw parameterized `UPDATE bikes SET specs = (specs - @old) || jsonb_build_object(@new, specs -> @old) WHERE specs ? @old` statement executed via `Database.ExecuteSqlInterpolatedAsync`. |
| Validation | Application services enforce: code format (`^[a-z][a-z0-9_]*$`, ≤100 chars), global case-insensitive code uniqueness (definitions) / existing uniqueness (groups), required fields, `dataType` enum, `filterType` consistency validated dynamically against registered `ISpecFilterStrategy` implementations (not hardcoded), and referenced-on-delete checks. |
| API boundary | New protected `/api/admin/spec-groups` and `/api/admin/spec-definitions` endpoints, plus two bulk-reorder endpoints. Existing public `GET /api/spec-groups` and all bike admin endpoints are unchanged. |
| Testing | Focused API tests for: global code-uniqueness rejection, the rename-cascade (definition + at least one bike with a value under the old code), group/definition delete-blocked conflicts, filterType/isFilterable consistency, and reorder persistence. Admin frontend workflow tests deferred to the same hardening pass as prior stages, per existing project convention. |
| Deployment | No new configuration or secrets; reuses the existing admin/API deployment boundary. |

## Constitution Check

### Initial Gates

- **Monorepo full-stack architecture:** PASS. Backend and `apps/admin` frontend are delivered together in this spec/plan/tasks cycle; no new project is added.
- **Clean Architecture:** PASS. `SpecGroup`/`SpecDefinition` domain entities gain no external dependencies; `Motorcycle.Application` owns the new service interfaces/DTOs/validation; `Motorcycle.Infrastructure` implements repository methods (including the raw SQL, isolated behind the repository interface); `Motorcycle.Api` only adds controllers that delegate to services.
- **API-first typed contracts:** PASS. New endpoints get Application DTOs, `apps/admin/lib/api.ts` functions, mirrored TypeScript types, and documentation in `contracts/admin-spec-metadata-api.md` (and `docs/api.md` once implemented).
- **Schema as code:** PASS. The unique-index and FK-delete-behavior changes are introduced through one EF Core migration with any raw SQL embedded via `migrationBuilder.Sql(...)`, per this project's existing convention; no ad hoc SQL scripts outside migrations.
- **Public/admin boundary:** PASS. `GET /api/spec-groups` remains anonymous, read-only, and unchanged; all mutations live under protected `/api/admin/*` routes.
- **Responsive UI:** PASS. The new admin views follow the same mobile-first Tailwind breakpoints already used by BikeModel/Bike admin UIs.

### Gate Violations

None identified. All three open design questions (delete-blocking defaults, data-type-change safety, `code` max length) were reviewed and confirmed by the user on 2026-09-27 (see spec.md Clarifications and Assumptions); implementation may proceed to `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/009-spec-metadata-management/
├── spec.md                              # Feature spec (this cycle's primary review artifact)
├── research.md                          # Phase 0 output
├── data-model.md                        # Phase 1 output
├── contracts/
│   └── admin-spec-metadata-api.md       # Phase 1 output
└── tasks.md                             # Phase 2 output — implemented; only the deferred test task (T021) remains open
```

### Source Code (repository root)

```text
apps/api/
├── Motorcycle.Domain/
│   └── SpecGroup.cs, SpecDefinition.cs         # existing, unchanged (no new fields)
├── Motorcycle.Application/
│   ├── DTOs/SpecGroupAdminDto.cs               # new: admin request/response DTOs
│   ├── DTOs/SpecDefinitionAdminDto.cs          # new
│   ├── Interfaces/ISpecGroupAdminRepository.cs # new
│   ├── Interfaces/ISpecDefinitionAdminRepository.cs # new
│   ├── Common/SpecMetadataValidators.cs        # new: code format/uniqueness/filterType validation helpers
│   └── Services/SpecGroupAdminService.cs, SpecDefinitionAdminService.cs # new
├── Motorcycle.Infrastructure/
│   ├── Repositories/SpecGroupAdminRepository.cs, SpecDefinitionAdminRepository.cs # new
│   └── Migrations/                             # new: unique-index + FK-restrict migration
└── Motorcycle.Api/
    └── Controllers/AdminSpecGroupsController.cs, AdminSpecDefinitionsController.cs # new

apps/admin/
├── lib/api.ts, types.ts                        # extend with spec-group/spec-definition admin client functions/types
└── components/specs/                           # new: group list/form/reorder, definition list/form/reorder/move
    app/admin/specs/                            # new: route(s) for spec metadata management
```

**Structure Decision**: Extend the existing single-repo, three-app layout (`apps/api`, `apps/admin`, `apps/web`). No new project or app is introduced; this feature adds an admin-scoped vertical slice following the same pattern as the Stage 1/2/3 admin slices (`005`, `006`, `007`). `apps/web` is unaffected — public `GET /api/spec-groups` behavior and shape are unchanged.

## Complexity Tracking

No constitution violations. The only non-trivial mechanism (raw SQL rename-cascade) is justified in research.md and is isolated to the Infrastructure repository layer, consistent with how `AzureBlobImageStorage` isolates Infrastructure-specific mechanics behind an Application-defined interface.

## Open Items Before `/speckit-tasks`

All resolved and confirmed by the user on 2026-09-27:

1. **Delete-blocking defaults** — confirmed: mirror the existing `BikeModel`/`Bike` referenced-conflict pattern (`spec_group_referenced`, `spec_definition_referenced`).
2. **Data-type-change safety** — confirmed: hard block. A `dataType` change is rejected outright with a detailed message (affected-bike count) when any bike holds an incompatible value; no conversion is attempted (spec.md FR-017).
3. **`code` max length** — confirmed: 100 characters (recommended value), comfortably above the longest existing seeded code (`cylinder_arrangement`, 21 chars) while staying well under the column's 255-character raw capacity.

Ready for `/speckit-tasks`.

See [../../plan-motorcycle-web-app.md](../../plan-motorcycle-web-app.md) for the full cross-application roadmap.
