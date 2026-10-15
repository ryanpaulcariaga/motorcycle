# Implementation Plan: Bike Model Reassignment

**Branch**: `012-bike-model-reassignment` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-bike-model-reassignment/spec.md`

## Summary

Add a dedicated reassignment action to every bike variant row in `apps/admin`. The modal submits only a target BikeModel ID to a protected API operation; the Application service validates the target and existing `(ModelId, Year, VariantName)` uniqueness rule before changing only `ModelId` and `UpdatedAt`. No schema changes or specification edits are involved.

## Technical Context

**Language/Version**: TypeScript, React 19; C# / .NET 10

**Primary Dependencies**: Vite, React, Tailwind CSS, ASP.NET Core, Entity Framework Core

**Storage**: PostgreSQL through the existing EF Core `Bike` and `BikeModel` entities

**Testing**: `dotnet test apps\\api\\Motorcycle.Api.slnx`; `pnpm --filter admin build`; targeted ESLint

**Target Platform**: Private admin SPA and shared ASP.NET Core API

**Project Type**: Full-stack monorepo web application

**Performance Goals**: Reassignment should complete as one authenticated operation and return promptly for a single bike.

**Constraints**: Keep all mutation in the shared protected API; do not change any bike fields beyond `ModelId` and `UpdatedAt`; preserve existing variant uniqueness; no schema change.

**Scale/Scope**: One bike reassignment per request; available from the Bikes Variants list for published and unpublished bikes.

## Constitution Check

- **Monorepo full-stack architecture**: PASS. Implement the admin UI, shared API contract, and tests together.
- **Clean Architecture**: PASS. Keep reassignment validation in `BikeAdminService`; the controller delegates through the Application interface; persistence uses the existing repository.
- **API-first typed contracts**: PASS. Define a request DTO, a typed admin client call, and document the protected endpoint.
- **Schema as code**: PASS. Existing BikeModel relation and uniqueness constraint suffice; no schema change is needed.
- **Public/admin boundary**: PASS. Reassignment uses a protected `/api/admin/bikes` route; public endpoints remain unchanged.
- **Feature-driven workflow**: PASS. Spec, plan, tasks, and supporting design artifacts are maintained under this feature.
- **Responsive UI**: PASS. Reuse the existing modal and mobile-first admin styling.

No gate violations.

## Project Structure

### Documentation (this feature)

```text
specs/012-bike-model-reassignment/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/admin-bike-model-reassignment.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
apps/admin/
├── components/bikes/BikeManagement.tsx
└── lib/
    ├── api.ts
    └── types.ts

apps/api/
├── Motorcycle.Application/
│   ├── DTOs/BikeAdminDto.cs
│   ├── Interfaces/IBikeAdminService.cs
│   └── Services/BikeAdminService.cs
├── Motorcycle.Api/Controllers/AdminBikesController.cs
└── Motorcycle.Api.Tests/
    ├── BikeAdminServiceTests.cs
    └── Fakes/FakeBikeAdminRepository.cs

docs/api.md
specs/006-bike-catalog-management/contracts/admin-bikes-api.md
```

**Structure Decision**: Extend the existing shared bike administration vertical slice and admin SPA. No separate client data path, new project, or database migration is introduced.

## Complexity Tracking

No constitution violations.
