# Implementation Plan: Admin Catalog Management

## Technical Context

| Area | Decision |
|---|---|
| Admin frontend | New `apps/admin` pnpm workspace using Next.js App Router, TypeScript, and Tailwind CSS, following the public app's organization without sharing public-page UI by default |
| Backend | Existing `apps/api` ASP.NET Core API; application services and DTOs remain in the Clean Architecture layers |
| Identity | Facebook OAuth2 signs administrators into the Stage 1 admin site; the API validates the authenticated identity and configured admin allowlist |
| Stage 1 data | Existing PostgreSQL `bike_models` table; BikeModel CRUD is implemented through the shared API |
| Deferred data | `bikes`, Azure Blob Storage images, and spec metadata remain later admin stages |
| API boundary | Protected `/api/admin` endpoints for BikeModel writes; existing public endpoints remain anonymous and read-only |
| Deployment | Independent Azure App Service and path-scoped GitHub Actions workflow for `apps/admin` |

## Constitution Check

- **Monorepo architecture:** PASS. The admin UI is a third workspace and consumes the existing API rather than adding a parallel backend.
- **Clean Architecture:** PASS. Mutation contracts and services belong in Application, persistence and Blob Storage implementations belong in Infrastructure, and controllers remain API composition/presentation.
- **API-first typed contracts:** PASS. The admin client consumes DTO-backed endpoints through its central client; public and admin contracts remain separately scoped.
- **Schema as code:** PASS. Catalog changes use the existing EF Core model and any schema additions require EF Core migrations.
- **Responsive Tailwind UI:** PASS. The admin app copies the public web theme and supports the defined responsive breakpoints.

## Implementation Steps

1. Create `apps/admin` and copy the public web UI theme, layout tokens, and typed-client conventions.
2. Configure Facebook OAuth2 for the admin app and protected `/api/admin` API requests.
3. Define BikeModel DTOs, validation, repository operations, and application services.
4. Add protected BikeModel list, create, update, and delete endpoints.
5. Reject BikeModel deletion when related bikes reference its `model_id`, using a stable conflict response.
6. Build the authenticated BikeModel list and add/edit/delete UI with responsive states and error messages.
7. Add focused Stage 1 API and UI tests for OAuth2 protection, CRUD validation, and delete protection.
8. Keep bike CRUD, image storage, and spec metadata as separate follow-on implementation stages.

## Design Artifacts

- [Research decisions](research.md)
- [Data model and validation](data-model.md)
- [Admin API contract](contracts/admin-api.md)
- [Validation quickstart](quickstart.md)

See [../../plan-motorcycle-web-app.md](../../plan-motorcycle-web-app.md) for the full cross-application roadmap.
