# Implementation Plan: Bike Catalog Management

**Branch**: `006-bike-catalog-management` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-bike-catalog-management/spec.md`

## Summary

Add Stage 2 of admin catalog management: protected `/api/admin/bikes` endpoints and an `apps/admin` UI for creating, editing, publishing/unpublishing, and deleting `Bike` (year/trim variant) records under an existing `BikeModel`. Publication state gates public visibility only; administrators can edit published variants directly (no unpublish/republish gate). Deletion is a hard delete blocked only when dependent `BikeImage` rows exist. Specification values are validated against the full existing `spec_groups`/`spec_definitions` metadata, not filtered by category.

## Technical Context

| Area | Decision |
|---|---|
| Admin frontend | Extend `apps/admin` with a Bike (variant) list/detail/form under each BikeModel, reusing the existing Next.js 16, TypeScript, Tailwind conventions and centralized typed client (`apps/admin/lib/api.ts`). |
| Backend | Extend the existing ASP.NET Core API: `Motorcycle.Application` gets `IBikeAdminService`/DTOs, `Motorcycle.Infrastructure` gets repository methods, `Motorcycle.Api` gets a new `AdminBikesController`. |
| Authentication/Authorization | Reuse Stage 1 unchanged: first-party RS256 JWT + `ActiveAdministrator` policy on every new endpoint. No new auth mechanism. |
| Stage 2 data | No schema changes. `Bike` and `BikeImage` entities and columns already exist (from the original catalog migration); this feature only adds a mutation/authorization surface over them. |
| Persistence | Use the existing PostgreSQL EF Core model. Enforce `(ModelId, Year, VariantName)` uniqueness and require the referenced `BikeModel` to exist, mirroring the `BikeModelService` validation pattern. |
| API boundary | Add protected `/api/admin/bikes` endpoints (list/detail/create/update/publish/unpublish/delete) scoped optionally by `modelId`. Existing public `/api/bikes` endpoints remain anonymous, read-only, and already filter to `IsPublished == true`. |
| Validation | Application service enforces required year/variant name, uniqueness, BikeModel existence, publish-readiness (year + variant name present), and spec value validation against `SpecDefinition.DataType` (reusing `ISpecFilterStrategy`'s data-type awareness where useful, or a lightweight type-check helper). |
| Deletion | Hard delete; blocked with `409 bike_referenced` when `BikeImage` rows exist for the bike (mirrors `BikeModelReferencedException`/`bike_model_referenced`). |
| Testing | Focused API tests for authorization, validation (required fields, uniqueness, spec type mismatches), publish/unpublish visibility, and delete-blocked-by-images; admin frontend workflow tests deferred to the same test-hardening pass as Stage 1. |
| Deployment | No new configuration or secrets; reuses the existing admin/API deployment boundary. |

## Constitution Check

### Initial Gates

- **Monorepo full-stack architecture:** PASS. Backend and `apps/admin` frontend are delivered together in this spec/plan/tasks cycle; no new project is added.
- **Clean Architecture:** PASS. `Bike`/`BikeImage` domain entities are unchanged; `Motorcycle.Application` owns the new service interface/DTOs/validation; `Motorcycle.Infrastructure` implements repository methods; `Motorcycle.Api` only adds a controller that delegates to the service.
- **API-first typed contracts:** PASS. New endpoints get Application DTOs, an `apps/admin/lib/api.ts` function, mirrored TypeScript types, and documentation in `contracts/admin-bikes-api.md` (and `docs/api.md` once implemented).
- **Schema as code:** PASS. No schema change is introduced; `Bike`/`BikeImage` tables and their EF configuration already exist from the initial migration.
- **Public/admin boundary:** PASS. Public `/api/bikes*` routes stay anonymous, read-only, and already exclude unpublished bikes; all new mutations live under protected `/api/admin/bikes`.
- **Responsive UI:** PASS. The admin variant list/form follows the same mobile-first Tailwind breakpoints already used by the BikeModel admin UI.

### Gate Violations

None.

### Post-Design Re-Check

All Phase 1 artifacts ([research.md](research.md), [data-model.md](data-model.md), [contracts/admin-bikes-api.md](contracts/admin-bikes-api.md), [quickstart.md](quickstart.md)) confirm the design stays within the same layer boundaries and endpoint boundary assumed above. No new violations were introduced; gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/006-bike-catalog-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── admin-bikes-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/api/
├── Motorcycle.Domain/
│   └── Bike.cs, BikeImage.cs                  # existing, unchanged
├── Motorcycle.Application/
│   ├── DTOs/BikeAdminDto.cs                    # new: admin request/response DTOs
│   ├── Interfaces/IBikeAdminRepository.cs      # new
│   ├── Common/BikeValidators.cs                # new: shared validation helpers
│   └── Services/BikeAdminService.cs            # new
├── Motorcycle.Infrastructure/
│   └── Repositories/BikeAdminRepository.cs     # new
└── Motorcycle.Api/
    └── Controllers/AdminBikesController.cs     # new

apps/admin/
├── lib/api.ts, types.ts                        # extend with Bike admin client functions/types
└── components/bikes/                           # new: variant list, form, publish toggle, delete confirm
    app/admin/bike-models/[id]/bikes/           # new: routes for a model's variant list/create/edit
```

**Structure Decision**: Extend the existing single-repo, three-app layout (`apps/api`, `apps/admin`, `apps/web`). No new project or app is introduced; this feature only adds an admin-scoped vertical slice (Domain unchanged, Application/Infrastructure/Api additions, `apps/admin` UI additions) following the same pattern as the Stage 1 `BikeModel` admin slice. `apps/web` is unaffected since public read endpoints and their published-only filtering already exist.

## Complexity Tracking

No constitution violations. Table intentionally omitted.
