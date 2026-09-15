# Admin Catalog Management

## Overview

Provide a private administrative Next.js application for maintaining the motorcycle catalog through the existing ASP.NET Core API. This feature is staged; Stage 1 delivers the admin shell and BikeModel management, while bike records, images, and specification metadata are deferred.

## Requirements

- **Separate frontend:** Add `apps/admin/` as a Next.js, TypeScript, and Tailwind CSS workspace with a structure and visual style copied from `apps/web/`.
- **Shared API:** Both public and admin frontends use `apps/api/`. The admin site must use typed API contracts and must not access PostgreSQL or Azure Blob Storage directly.
- **Stage 1 authentication:** Use Facebook OAuth2 for admin sign-in. The API must reject unauthenticated admin mutations and authorize only the configured admin identity or allowlist.
- **Stage 1 BikeModel management:** Load, add, edit, and delete `bike_models` records, including brand, category, and model-line name.
- **Stage 1 delete protection:** A BikeModel referenced by any `bikes.model_id` cannot be deleted. The API returns a conflict response and the UI displays a clear error.
- **Usability:** Provide a responsive admin shell, BikeModel list/form workflows, loading/empty states, validation feedback, and mutation errors.

## Out of Scope

- Public self-service registration or public catalog editing
- Direct browser access to database or Blob Storage credentials
- Bike CRUD, bike publication management, image upload/assignment, and spec-group/spec-definition CRUD in Stage 1
- User-review, advertising, survey, analytics, or dealer-management administration
- Public self-service management of administrator identities or roles
