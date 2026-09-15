# Admin Catalog Management

## Overview

Provide a private administrative Next.js application for maintaining the motorcycle catalog through the existing ASP.NET Core API. This feature is staged; Stage 1 delivers the admin shell and BikeModel management, while bike records, images, and specification metadata are deferred.

## Clarifications

### Session 2026-09-16

- Q: Should the admin site use a server-side Facebook OAuth2 session and have the API trust a short-lived application-issued token, or should the browser send Facebook access tokens directly to the API? → A: Use Authorization Code + PKCE for Facebook sign-in, then use an application-managed session or short-lived first-party token for API calls; the API must not accept Facebook access tokens directly.
- Q: How should the API decide which Facebook-authenticated users are allowed to administer the catalog? → A: Use a separate admin-role table, with minimal role-management UI/API included in Stage 1.
- Q: How should the first administrator record be created in the admin-role table before the future role-management UI exists? → A: Add the role-management UI before implementing BikeModel CRUD.
- Q: What should each admin-role record store and allow an administrator to change? → A: Store Facebook user ID, email snapshot, display name snapshot, role, active status, and timestamps; support activation/deactivation instead of deletion.

## Requirements

- **Separate frontend:** Add `apps/admin/` as a Next.js, TypeScript, and Tailwind CSS workspace with a structure and visual style copied from `apps/web/`.
- **Shared API:** Both public and admin frontends use `apps/api/`. The admin site must use typed API contracts and must not access PostgreSQL or Azure Blob Storage directly.
- **Stage 1 authentication and authorization:** Use Facebook OAuth2 Authorization Code + PKCE for admin sign-in. The admin application manages the authenticated session and calls the API with an application-managed session or short-lived first-party token. The API authorizes mutations through a separate admin-role table and rejects unauthenticated or unassigned users. Stage 1 includes minimal role-management UI/API before BikeModel CRUD so an authorized administrator can provision additional administrators.
- **Stage 1 admin roles:** Store the Facebook user ID as the unique stable identity, plus email and display-name snapshots, role, active status, and created/updated timestamps. Administrators can activate or deactivate role records, but role records are not deleted.
- **Stage 1 BikeModel management:** Load, add, edit, and delete `bike_models` records, including brand, category, and model-line name.
- **Stage 1 delete protection:** A BikeModel referenced by any `bikes.model_id` cannot be deleted. The API returns a conflict response and the UI displays a clear error.
- **Stage 1 role management:** An authorized administrator can list, provision, activate, and deactivate admin-role records before managing BikeModels.
- **Usability:** Provide a responsive admin shell, BikeModel list/form workflows, loading/empty states, validation feedback, and mutation errors.

## Out of Scope

- Public self-service registration or public catalog editing
- Direct browser access to database or Blob Storage credentials
- Bike CRUD, bike publication management, image upload/assignment, and spec-group/spec-definition CRUD in Stage 1
- User-review, advertising, survey, analytics, or dealer-management administration
- Public self-service management of administrator identities or roles
