# Motorcycle Admin

Private Stage 1 administration frontend for the motorcycle catalog.

## Local Development

The local development server uses Next.js HTTPS. Because the local API also uses a development certificate, the Windows dev script disables Node TLS verification for this local-only process; production deployments must not use that setting.

```powershell
pnpm.cmd --dir apps/admin dev
```

Open `https://localhost:3001`. The browser may ask you to trust the generated local certificate.

Create `apps/admin/.env.local` from `.env.example` with the Meta App ID/secret, the HTTPS callback URL, the admin session secret, and the RS256 private-key file path. Never commit `.env.local`, RSA keys, or certificate files.

The Meta callback URL must exactly match:

```text
https://localhost:3001/api/auth/callback/facebook
```

If local sign-in reports that the identity is not an active administrator, copy the development-only Facebook user ID shown in the error and run this once against the configured development database:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin bootstrap --facebook-user-id <id> --display-name <name>
```

Stage 1 requests only the `public_profile` Facebook permission. Email is an optional profile value and is not required for sign-in.

## API and Bootstrap

Start PostgreSQL and the API with Visual Studio's `https` profile on `https://localhost:7240`, then apply migrations:

```powershell
dotnet ef database update --project apps/api/Motorcycle.Infrastructure/Motorcycle.Infrastructure.csproj --startup-project apps/api/Motorcycle.Api/Motorcycle.Api.csproj
```

Create the first administrator only after the migration and API implementation are ready:

```powershell
dotnet run --project apps/api/Motorcycle.Api --launch-profile https -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

The bootstrap command is operator-only and idempotent for an existing active administrator. Role and BikeModel data then flow through the shared API; the browser never connects directly to PostgreSQL or Blob Storage. The browser uses the admin app's same-origin `/api/admin/*` proxy for protected operations and `/api/catalog/*` for public catalog lookups such as brands and categories.

## Stage 1 Scope

Implemented locally: Facebook PKCE sign-in, encrypted HttpOnly sessions, RS256 first-party API requests, administrator-role lifecycle, BikeModel CRUD, Bike variant CRUD/publication, and Azure Blob-backed image operations. Specification metadata CRUD remains deferred. The API uses the provisioned Azure PostgreSQL and Blob Storage resources through local user secrets; production App Service deployment remains deferred until feature completion.

## Continuing Work

Use [../../specs/005-admin-catalog-management/implementation-status.md](../../specs/005-admin-catalog-management/implementation-status.md) and [../../specs/007-bike-image-management/tasks.md](../../specs/007-bike-image-management/tasks.md) as handoff documents. The remaining work is focused image acceptance testing, specification metadata management, and final release validation.
