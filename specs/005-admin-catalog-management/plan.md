# Implementation Plan: Admin Catalog Management

## Technical Context

| Area | Decision |
|---|---|
| Admin frontend | Add `apps/admin` as a Next.js 16 App Router, TypeScript, and Tailwind CSS workspace, following the public app's theme and centralized typed-client conventions. |
| Backend | Extend the existing ASP.NET Core API through Domain, Application, Infrastructure, and Api layers; controllers delegate to Application services. |
| Authentication | The admin app completes Facebook Authorization Code + PKCE, keeps an application-managed HttpOnly session, and mints a 5-10 minute RS256 first-party JWT for server-side API calls. Facebook access tokens never reach the API. |
| Authorization | The API validates the first-party JWT's signature, issuer, audience, subject, and expiry, then requires an active `AdminRole` record keyed by the Facebook user ID in `sub` for every `/api/admin` endpoint. Stage 1 roles share the administrator permission set. |
| Stage 1 data | Add the `AdminRole` table and manage existing `BikeModel`, `Brand`, `Category`, and `Bike` relationships. Add no bike, image, or specification metadata mutation surfaces. |
| Persistence | Use the existing PostgreSQL EF Core model and snake_case migration conventions. Prevent BikeModel deletion when a related Bike exists before issuing the delete. |
| API boundary | Add protected `/api/admin/admin-roles` and `/api/admin/bike-models` endpoints. Existing public catalog endpoints remain anonymous and read-only. |
| Validation | Application services enforce required fields, relationship existence, duplicate role identity, unique `(brandId, name)`, and stable authorization/conflict errors. |
| Testing | Add focused API tests for authentication/authorization, role lifecycle, BikeModel validation and delete conflict, plus admin frontend workflow and responsive checks. |
| Deployment | Keep admin configuration and OAuth/session signing secrets outside source; deployment remains independently configurable from the public app. |

## Constitution Check

### Initial Gates

- **Monorepo full-stack architecture:** PASS. The design adds `apps/admin`, extends the shared API, and keeps all affected contracts and validation in one feature.
- **Clean Architecture:** PASS. Domain owns `AdminRole`; Application owns DTOs, service contracts, validation, and authorization abstractions; Infrastructure owns EF persistence; Api owns authentication composition and controllers.
- **API-first typed contracts:** PASS. Every new endpoint has Application DTOs, an `apps/admin/lib/api.ts` function, mirrored TypeScript types, and documentation in `contracts/admin-api.md`.
- **Schema as code:** PASS. `AdminRole` is introduced through an EF Core migration; no ad hoc SQL or direct database access is added to either frontend.
- **Public/admin boundary:** PASS. Public reads remain anonymous and read-only; all Stage 1 mutations live under protected `/api/admin` routes.
- **Responsive UI:** PASS. The admin shell is mobile-first, uses the existing Tailwind tokens, and supports the required 320px, 768px, and 1024px+ breakpoints.

### Gate Violations

None. The previous allowlist design is intentionally replaced because it conflicts with the approved separate admin-role table requirement.

## Architecture and Implementation Approach

1. **Authentication boundary:** The admin app owns the Facebook callback, PKCE verifier/state, and encrypted HttpOnly session. A server-side admin API adapter mints a 5-10 minute RS256 JWT with `iss`, `aud`, `sub` (Facebook user ID), `exp`, and `jti` claims, then attaches it to typed API requests. The browser never sends a Facebook access token to the API.
2. **Authorization boundary:** The API validates only the first-party JWT using the configured public key, issuer, audience, signature, and expiry. An authorization handler loads the active `AdminRole` by the JWT subject; missing or inactive records produce `401`/`403` according to whether the request is unauthenticated or authenticated without an active role.
3. **Role lifecycle:** Add `AdminRole` with unique Facebook user ID, snapshots, the single Stage 1 `Administrator` role value, active flag, and UTC timestamps. Provide list/provision/status-update operations. Deactivation is a state change, never a delete. A documented operator-only bootstrap command creates the first active administrator before normal role management.
4. **BikeModel lifecycle:** Add Application request/response DTOs and a service/repository pair. Load brand/category references for list and form options. Validate names and references in the service, and check dependent bike count in the same unit of work before deletion; return a stable `bike_model_referenced` conflict.
5. **Frontend workflow:** Scaffold the admin workspace from the public app's package/tooling conventions. Build the auth gate and shell first, then role management, then BikeModel list/form/delete flows. All network access goes through the centralized typed client and exposes loading, empty, validation, authorization, conflict, and retry states.
6. **Documentation and verification:** Update shared API/architecture/database docs when implementation begins, and use the quickstart scenarios plus automated tests to verify the protected boundary and referential-integrity behavior.

## Design Artifacts

- [Research decisions](research.md)
- [Data model and validation](data-model.md)
- [Admin API contract](contracts/admin-api.md)
- [Validation quickstart](quickstart.md)

See [../../plan-motorcycle-web-app.md](../../plan-motorcycle-web-app.md) for the full cross-application roadmap.

## Implementation Status

- Implemented locally: admin workspace, Facebook PKCE callback, encrypted HttpOnly session, RS256 first-party JWT, `AdminRole` persistence and bootstrap, protected role endpoints, BikeModel CRUD, and referenced-model delete protection.
- Verified: API build, admin lint, admin TypeScript check, admin production build, EF migration application, and direct protected-endpoint authorization with the bootstrapped administrator.
- Remaining before release: automated API/frontend/security tests, shared problem-details handling, responsive acceptance checks, production secret management, and deployment configuration.
- Next session entry point: read [implementation-status.md](implementation-status.md), then continue with the unchecked tasks in `tasks.md`; do not restart scaffolding or re-bootstrap the existing administrator.
