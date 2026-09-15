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

- `apps/admin` is a Next.js 16 workspace using TypeScript and Tailwind CSS.
- Local admin development runs over `https://localhost:3001` using Next.js experimental HTTPS.
- The Windows admin dev script sets `NODE_TLS_REJECT_UNAUTHORIZED=0` only for local development so server-side calls can reach the API's self-signed HTTPS profile on `https://localhost:7240`; production must keep TLS verification enabled.
- Facebook Login uses Authorization Code + PKCE and requests only `public_profile`; the `email` permission is intentionally not requested because Meta rejected it for this development app.
- The admin server stores an encrypted HttpOnly session and mints a 5-10 minute RS256 first-party JWT with `iss`, `aud`, `sub`, `exp`, and `jti` claims.
- The API preserves the JWT `sub` claim, validates the RSA signature/issuer/audience/lifetime, and authorizes active `AdminRole` records.
- The shared API owns role and BikeModel data. The browser uses the admin same-origin proxy and never connects directly to PostgreSQL or Blob Storage. The local API HTTPS profile is `https://localhost:7240`.
- `AdminRole` migration and operator bootstrap are implemented. The local first administrator has already been bootstrapped; do not rerun the command as part of normal startup.
- Administrator role list/provision/activate/deactivate UI and protected BikeModel CRUD UI/API are implemented.
- BikeModel deletion returns `409 bike_model_referenced` when dependent bikes exist.

## Local Configuration

Ignored local files contain the development-only Meta credentials, session secret, RSA private key, and generated HTTPS certificates:

- `apps/admin/.env.local`
- `apps/admin/keys/first-party-private.pem`
- `apps/admin/keys/first-party-public.pem`
- `apps/admin/certificates/`
- `apps/admin/certs/`

The API development configuration contains only the non-secret issuer/audience and RSA public key. Never copy private keys or Meta secrets into Markdown, tracked configuration, or chat.

The Meta callback must match exactly:

```text
https://localhost:3001/api/auth/callback/facebook
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
& .\node_modules\.bin\next.cmd build
Pop-Location

# Database migration
& 'C:\Program Files\dotnet\dotnet.exe' ef database update --project apps\api\Motorcycle.Infrastructure\Motorcycle.Infrastructure.csproj --startup-project apps\api\Motorcycle.Api\Motorcycle.Api.csproj
```

The API solution currently has no test projects, so `dotnet test` validates the solution build but discovers no tests.

## Run Locally

1. Start PostgreSQL.
2. Start the API with Visual Studio's `https` profile, or run `dotnet run --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj --launch-profile https`; both use `https://localhost:7240`.
3. Start the admin app with `pnpm.cmd --dir apps/admin dev`.
4. Open `https://localhost:3001` and accept the local certificate warning if prompted.
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

Do not start the next data stage until the remaining Stage 1 validation tasks are reviewed. The recommended order is:

1. Finish Stage 1 test/error/responsive hardening.
2. Add bike CRUD and publication management with a new data model and API contract.
3. Add image assignment/upload through API-owned storage operations.
4. Add specification metadata management and validation.

Each follow-on stage needs its own contract, migration review, frontend types/client functions, and focused acceptance tests. Do not add direct browser access to PostgreSQL or Blob Storage.
