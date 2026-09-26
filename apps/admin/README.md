# Motorcycle Admin

Private React single-page administration frontend for the motorcycle catalog. It intentionally has no SEO or server-rendering requirement.

## Local Development

The Vite development server runs on `https://localhost:3001` using the trusted ASP.NET Core HTTPS development certificate (see `vite.config.ts`). A `predev`/`prepreview` script exports that certificate (with its private key) via `dotnet dev-certs https --export-path apps/admin/certs/aspnetcore-dev-cert.pem --format Pem --no-password`, so the browser trusts `localhost:3001` the same way it already trusts the API at `https://localhost:7240` — no manual "trust this certificate" step needed. If `dotnet dev-certs` isn't available, Vite falls back to `@vitejs/plugin-basic-ssl`'s untrusted self-signed certificate.

```powershell
pnpm.cmd --dir apps/admin dev
```

Open `https://localhost:3001`. If you still see a certificate warning, run `dotnet dev-certs https --trust` once to trust the certificate on this machine, then restart the dev server.

The API remains on `https://localhost:7240` and owns the Facebook callback, OAuth secrets, PKCE state/verifier, and HttpOnly administrator session.

Create `apps/admin/.env.local` from `.env.example` only when the API URL differs from its local default. Keep Meta credentials in API user secrets or managed configuration, never in the browser app.

Configure the API's `AdminAuth:FacebookClientId` and `AdminAuth:FacebookClientSecret` user secrets before testing sign-in; see [../api/Motorcycle.Api/README.md](../api/Motorcycle.Api/README.md).

The Meta callback URL must exactly match:

```text
https://localhost:7240/api/admin/auth/facebook/callback
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

The bootstrap command is operator-only and idempotent for an existing active administrator. Role and BikeModel data then flow through the shared API; the browser never connects directly to PostgreSQL or Blob Storage. The SPA calls protected `/api/admin/*` and anonymous lookup endpoints directly with its centralized typed client; browser requests include the API-managed admin session cookie.

## Stage 1 Scope

Implemented locally: API-owned Facebook PKCE sign-in, encrypted HttpOnly sessions, administrator-role lifecycle, BikeModel CRUD, Bike variant CRUD/publication, and Azure Blob-backed image operations. Specification metadata CRUD remains deferred. The API uses the provisioned Azure PostgreSQL and Blob Storage resources through local user secrets; production App Service deployment remains deferred until feature completion.

## Continuing Work

Use [../../specs/005-admin-catalog-management/implementation-status.md](../../specs/005-admin-catalog-management/implementation-status.md) and [../../specs/007-bike-image-management/tasks.md](../../specs/007-bike-image-management/tasks.md) as handoff documents. The remaining work is focused image acceptance testing, specification metadata management, and final release validation.
