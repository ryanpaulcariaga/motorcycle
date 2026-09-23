# Admin Catalog Implementation Status

**Feature**: Admin Catalog Management (Stage 1)
**Last Updated**: 2026-09-16
**Status**: Working local slice; validation and release hardening remain

## Start Here Next Session

1. Read this file, then [plan.md](plan.md), [tasks.md](tasks.md), and [quickstart.md](quickstart.md).
2. Preserve the existing local database and active AdminRole record. Do not delete the `admin_roles` table and do not rerun bootstrap unless the record is intentionally missing.
3. Start with the first applicable unchecked task in [tasks.md](tasks.md). The next planned implementation gap is shared problem-details handling (`T012`), followed by API/frontend/security tests.
4. Run the focused validation commands before changing adjacent slices.

## Implemented Boundary

- `apps/admin` is a Vite React SPA using TypeScript and Tailwind CSS.
- Local admin development runs on `https://localhost:3001` with a locally generated certificate; the API remains on `https://localhost:7240`.
- Facebook Login uses Authorization Code + PKCE and requests only `public_profile`; the `email` permission is intentionally not requested because Meta rejected it for this development app.
- The API stores the encrypted HttpOnly session after completing Facebook PKCE and authorizes active `AdminRole` records using the cookie's `sub` claim.
- The shared API owns role and BikeModel data. The browser calls the API directly with credentialed CORS requests and never connects directly to PostgreSQL or Blob Storage. The local API HTTPS profile is `https://localhost:7240`.
- `AdminRole` migration and operator bootstrap are implemented. The local first administrator has already been bootstrapped; do not rerun the command as part of normal startup.
- Administrator role list/provision/activate/deactivate UI and protected BikeModel CRUD UI/API are implemented.
- BikeModel deletion returns `409 bike_model_referenced` when dependent bikes exist.

## Local Configuration

Ignored API user secrets contain the development-only `AdminAuth:FacebookClientId` and `AdminAuth:FacebookClientSecret` values; the development configuration contains the non-secret callback and admin SPA URLs. The browser app may contain only the public API URL:

- `apps/admin/.env.local`

Never copy Meta secrets into Markdown, tracked configuration, or chat.

The Meta callback must match exactly:

```text
https://localhost:7240/api/admin/auth/facebook/callback
```

## Verified Commands

Run from the repository root:

```powershell
# API
& 'C:\Program Files\dotnet\dotnet.exe' build apps\api\Motorcycle.Api.slnx
& 'C:\Program Files\dotnet\dotnet.exe' test apps\api\Motorcycle.Api.slnx

# Admin frontend
Push-Location apps\admin
& .\node_modules\.bin\eslint.cmd .
& .\node_modules\.bin\tsc.cmd --noEmit
& .\node_modules\.bin\vite.cmd build
Pop-Location

# Database migration
& 'C:\Program Files\dotnet\dotnet.exe' ef database update --project apps\api\Motorcycle.Infrastructure\Motorcycle.Infrastructure.csproj --startup-project apps\api\Motorcycle.Api\Motorcycle.Api.csproj
```

The API solution currently has no test projects, so `dotnet test` validates the solution build but discovers no tests.

## Run Locally

1. Start PostgreSQL.
2. Start the API with Visual Studio's `https` profile, or run `dotnet run --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj --launch-profile https`; both use `https://localhost:7240`.
3. Start the admin app with `pnpm.cmd --dir apps/admin dev`.
4. Open `https://localhost:3001` and trust the local development certificate when prompted.
5. Sign in with the Meta administrator account already represented by the active `AdminRole` record.

The bootstrap command is only for first setup after migration:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

## Remaining Stage 1 Tasks

Unchecked tasks are intentionally not treated as complete:

- `T012`: shared problem-details mappings for standard API errors.
- `T015-T016`: API authorization and PKCE/session automated tests.
- `T021-T023`: role service, controller, and UI tests.
- `T031-T033`: BikeModel service, controller, and UI tests.
- `T041-T045`: responsive/state testing and shared feedback/form-state polish.
- `T049`: security review tests.
- `T050`: complete quickstart acceptance run and final validation record.

## Next Admin Stage

Stage 2 (bike CRUD/publication management) and Stage 3 (Azure Blob image management) are implemented; see `specs/006-bike-catalog-management/` and `specs/007-bike-image-management/`. The recommended order is:

1. Finish Stage 1 test/error/responsive hardening.
2. ~~Add bike CRUD and publication management with a new data model and API contract.~~ Done — `/api/admin/bikes` and the admin variant UI.
3. ~~Add image assignment/upload through API-owned storage operations using the provisioned Azure Blob Storage development resource.~~ Done — protected upload, list, primary, reorder, delete, and admin UI are implemented.
4. Add focused image service/controller tests and validate an authenticated upload against the provisioned Azure Blob container.
5. Add specification metadata management and validation.

Each follow-on stage needs its own contract, migration review, frontend types/client functions, and focused acceptance tests. Do not add direct browser access to PostgreSQL or Blob Storage. Production App Service deployment is intentionally deferred until the remaining feature stages are complete.
