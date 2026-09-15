# Implementation Plan: Admin Catalog Management

## Technical Context

| Area | Decision |
|---|---|
| Admin frontend | New `apps/admin` pnpm workspace using Next.js App Router, TypeScript, and Tailwind CSS, following the public app's organization without sharing public-page UI by default |
| Backend | Existing `apps/api` ASP.NET Core API; application services and DTOs remain in the Clean Architecture layers |
| Identity | Microsoft Entra ID protects the admin site and API mutation endpoints; an administrator role or group claim authorizes catalog changes |
| Data and images | Existing PostgreSQL catalog schema and Azure Blob Storage; the API validates and persists data and performs storage operations with Key Vault-backed configuration |
| API boundary | Protected `/api/admin` endpoints for writes; existing public endpoints remain anonymous and read-only |
| Deployment | Independent Azure App Service and path-scoped GitHub Actions workflow for `apps/admin` |

## Constitution Check

- **Monorepo architecture:** PASS. The admin UI is a third workspace and consumes the existing API rather than adding a parallel backend.
- **Clean Architecture:** PASS. Mutation contracts and services belong in Application, persistence and Blob Storage implementations belong in Infrastructure, and controllers remain API composition/presentation.
- **API-first typed contracts:** PASS. The admin client consumes DTO-backed endpoints through its central client; public and admin contracts remain separately scoped.
- **Schema as code:** PASS. Catalog changes use the existing EF Core model and any schema additions require EF Core migrations.
- **Responsive Tailwind UI:** PASS. The admin app uses the project frontend stack and must support the defined responsive breakpoints.

## Implementation Steps

1. Create `apps/admin` as a pnpm workspace using Next.js App Router, TypeScript, and Tailwind CSS. Reuse proven structural patterns from `apps/web` without coupling its public-page components to the administration UI.
2. Configure Microsoft Entra ID authentication for the admin app and JWT bearer validation in `apps/api`. Require an administrator role or group claim on the `/api/admin` boundary while preserving anonymous public catalog endpoints.
3. Define application DTOs and services for catalog mutations. Validate motorcycle specification values against metadata before persistence.
4. Add protected API operations for motorcycles, brands, categories, spec groups, and spec definitions, including ordering and publication state.
5. Implement server-side image upload and motorcycle image assignment through the API. Keep Azure Blob credentials in Key Vault-backed API configuration only.
6. Build typed admin API clients and pages for motorcycle search/editing, image management, lookup management, and specification metadata management.
7. Add focused API and UI tests for authorization, validation, publication behavior, primary-image enforcement, and metadata ordering.
8. Extend Azure and GitHub Actions configuration with a separately deployed `admin` App Service and path-scoped workflow triggers.

## Design Artifacts

- [Research decisions](research.md)
- [Data model and validation](data-model.md)
- [Admin API contract](contracts/admin-api.md)
- [Validation quickstart](quickstart.md)

See [../../plan-motorcycleWebApp.md](../../plan-motorcycleWebApp.md) for the full cross-application roadmap.
