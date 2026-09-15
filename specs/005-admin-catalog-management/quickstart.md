# Quickstart: Validate Admin Catalog Management

## Prerequisites

- PostgreSQL is available and current EF Core migrations are applied.
- The API has its local database and Blob Storage configuration.
- A Microsoft Entra ID test user is assigned the configured administrator role or group.
- The public `apps/web` and planned `apps/admin` workspaces have dependencies installed with `pnpm install`.

## Run Locally

1. Start the API from `apps/api` with `dotnet run --project Motorcycle.Api`.
2. Start the public site from `apps/web` with `pnpm dev`.
3. Start the admin site from `apps/admin` with `pnpm dev`.
4. Sign in to the admin site with the authorized test user.

## Validate Core Flows

1. Create a motorcycle with valid brand, category, and specification values; confirm it appears in the admin list but not public results until published.
2. Upload and assign several images; change their order and primary image; confirm the public detail view shows the selected primary image after publication.
3. Change a specification definition and confirm invalid value types are rejected with actionable feedback.
4. Add, edit, and reorder metadata; confirm public filtering and comparison labels use the updated metadata.
5. Attempt an admin API mutation without a token and with a non-administrator token; both must be rejected.

See [admin-api.md](contracts/admin-api.md) for endpoints and [data-model.md](data-model.md) for validation and state rules.
