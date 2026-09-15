# Quickstart: Validate Admin Catalog Management

## Prerequisites

- PostgreSQL is available and current EF Core migrations are applied.
- A Facebook OAuth2 app/client is configured for local development and the test administrator is in the API allowlist.
- The public `apps/web` and planned `apps/admin` workspaces have dependencies installed with `pnpm install`.

## Run Locally

1. Start the API from `apps/api` with `dotnet run --project Motorcycle.Api`.
2. Start the public site from `apps/web` with `pnpm dev`.
3. Start the admin site from `apps/admin` with `pnpm dev`.
4. Sign in to the admin site with the authorized Facebook test account.

## Validate Core Flows

1. Load BikeModels and confirm the admin list matches the `bike_models` table.
2. Add and edit a BikeModel; confirm the changes are persisted through the API.
3. Delete an unreferenced BikeModel and confirm it is removed.
4. Attempt to delete a BikeModel referenced by a bike; confirm the API returns `409 Conflict` and the UI displays an actionable error.
5. Attempt an admin API mutation without authentication or with a non-allowlisted Facebook identity; both must be rejected.

Bike CRUD, image upload/assignment, and spec metadata validation are deferred to later stages.

See [admin-api.md](contracts/admin-api.md) for endpoints and [data-model.md](data-model.md) for validation and state rules.
