# Motorcycle App

A monorepo for the Motorcycle Specs & Comparison application.

## Structure

```
motorcycle-app/
├── apps/
│   ├── web/              # Public Next.js frontend
│   ├── admin/            # Private Vite React administration SPA
│   └── api/              # Shared ASP.NET Core backend
├── specs/                # Feature specifications (SpecKit)
│   ├── 001-motorcycle-comparison/
│   ├── 002-user-reviews/
│   ├── 003-advertising/
│   ├── 004-dealer-links/
│   ├── 005-admin-catalog-management/
│   ├── 006-bike-catalog-management/
│   ├── 007-bike-image-management/
│   ├── 008-public-user-authentication/
│   └── 009-spec-metadata-management/
├── docs/                 # Shared documentation
├── .github/workflows/    # CI/CD pipelines
├── .npmrc                # pnpm install config (see Windows Environment Setup)
├── pnpm-workspace.yaml   # pnpm workspaces config + allowBuilds
└── package.json          # workspace root manifest
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: ASP.NET Core 10 (Clean Architecture)
- **Database**: PostgreSQL (EF Core + Npgsql)
- **Hosting**: Azure (App Service, Database, Blob Storage, Key Vault)
- **Package Manager**: pnpm (workspaces)

## Getting Started

### Prerequisites
- **Node.js** 18+ and **pnpm** (frontend dependency manager)
- **.NET 10 SDK** (backend)
- **PostgreSQL** 14+ (database)

### Initial Setup

1. **Install Node dependencies:**
   ```bash
   pnpm install
   ```
   This installs dependencies for `apps/web/` and `apps/admin/` (managed by pnpm workspaces). Restore the API separately with `dotnet restore`.

2. **Configure the API database and storage secrets**. Local development can use the provisioned Azure PostgreSQL and Blob Storage through `dotnet user-secrets` on `apps/api/Motorcycle.Api` (`UserSecretsId: motorcycle-api-local`), or a local PostgreSQL instance.

### Windows Environment Setup

A fresh Windows + PowerShell machine needs three one-time fixes before `pnpm`/`npm` work normally. All three are already applied in this repo/workspace as of 2026-09-27; repeat them only on a new machine or user profile:

1. **PowerShell execution policy** blocks the `npm.ps1`/`pnpm.ps1` shims by default (`... cannot be loaded because running scripts is disabled on this system`). Fix for the current user only (no admin rights needed):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
   ```
2. **`pnpm` isn't preinstalled.** Install it as a real global npm package (approving its install scripts) rather than relying on `corepack` (not bundled in newer Node.js releases) or repeatedly re-fetching it via `npx`:
   ```powershell
   npm install -g --allow-scripts=pnpm pnpm
   ```
3. **npm's global bin folder isn't on PATH by default** on some Windows setups, so a just-installed global package like `pnpm` still won't resolve. Add it once, persistently, for the current user:
   ```powershell
   $npmGlobal = "$env:AppData\npm"
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $npmGlobal, "User")
   ```
   **Restart VS Code (or open a brand-new terminal window outside the editor) after this step** — an already-running VS Code window keeps using the environment it started with and won't see the updated PATH until it's relaunched.

Two repo-level settings also work around Windows-specific pnpm limitations and are already committed:
- [`.npmrc`](.npmrc): `package-import-method=copy` — pnpm's default install links packages into `node_modules` via filesystem symlinks, which fails with `ERR_PNPM_PACKAGE_MANAGER_SYMLINK_FAILED` unless Developer Mode or admin elevation is enabled. Copying files instead avoids that privilege requirement entirely.
- [`pnpm-workspace.yaml`](pnpm-workspace.yaml): `allowBuilds` pre-approves the `esbuild`/`unrs-resolver` native postinstall scripts pnpm would otherwise block with `ERR_PNPM_IGNORED_BUILDS` on a fresh install.

### Running Locally

#### Option A: Run Both Apps in Separate Terminals (Recommended for Development)

**Terminal 1 — Backend API** (Visual Studio HTTPS profile runs on `https://localhost:7240`):
```bash
cd apps/api
dotnet restore
dotnet ef database update  # Apply migrations to local PostgreSQL
dotnet run --project Motorcycle.Api --launch-profile https
```

**Terminal 2 — Frontend Web** (runs on `https://localhost:3000`):
```bash
cd apps/web
pnpm dev
```

Open your browser to `https://localhost:3000` and trust the locally generated development certificate when prompted. The frontend sends API requests to `https://localhost:7240` (see `apps/web/lib/api.ts`). Trust the local ASP.NET Core certificate if prompted.

#### Option B: Backend Setup Only (if you need just the API)
```bash
cd apps/api
dotnet restore
dotnet ef database update
dotnet run --project Motorcycle.Api --launch-profile https
```

#### Option C: Frontend Setup Only (if you need just the web app)
```bash
cd apps/web
pnpm dev
```

### Database Migrations

If you modify the schema (`apps/api/Motorcycle.Domain/`, `apps/api/Motorcycle.Application/DTOs/`, or entity configurations), generate and apply a migration:

```bash
cd apps/api
dotnet ef migrations add <DescriptiveMigrationName> --project Motorcycle.Infrastructure
dotnet ef database update
```

For more details on architecture, see [docs/architecture.md](docs/architecture.md).
For app-specific configuration, see [apps/web/README.md](apps/web/README.md).

## Feature Development

Features are spec-driven. See [specs/](specs/) for active features.

### Admin Catalog Management

The `apps/admin/` Vite React SPA has implemented administrator authentication, BikeModel CRUD, Bike variant CRUD/publication, and Azure Blob-backed image management through the shared `apps/api/` backend. Local development uses `https://localhost:3001`; the API-owned Facebook callback is `https://localhost:7240/api/admin/auth/facebook/callback`. Specification metadata CRUD and focused image acceptance tests remain. Production deployment is intentionally deferred until feature development is complete. See [specs/007-bike-image-management/spec.md](specs/007-bike-image-management/spec.md) and [apps/admin/README.md](apps/admin/README.md).

### Future Roadmap

Planned post-MVP capabilities include user reviews, AI-assisted comparison insights, analytics, dealer links, and a privacy-conscious advertising platform. Advertising is intended to support clearly labeled sponsored placements and relevant motorcycle-related campaigns without changing organic search or comparison results. See [specs/003-advertising/spec.md](specs/003-advertising/spec.md) and [specs/004-dealer-links/spec.md](specs/004-dealer-links/spec.md) for the initial future scopes.

When implementing a feature:
1. Review the feature spec in `specs/NNN-feature-name/spec.md`
2. Follow the plan in `specs/NNN-feature-name/plan.md`
3. Track progress in `specs/NNN-feature-name/tasks.md`
4. Modify the shared backend (`apps/api/`) and every affected frontend (`apps/web/` and/or `apps/admin/`) in the same session
5. Update relevant docs as you go

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI-assisted development guidelines used by VS Code Copilot and Copilot CLI.

## Continuing Admin Development

For the current implementation boundary, verified local commands, remaining tasks, and the next admin stage entry point, start with [specs/005-admin-catalog-management/implementation-status.md](specs/005-admin-catalog-management/implementation-status.md). Do not begin a new admin feature until the remaining Stage 1 validation tasks in `specs/005-admin-catalog-management/tasks.md` are reviewed.
