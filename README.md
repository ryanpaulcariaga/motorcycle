# Motorcycle App

A monorepo for the Motorcycle Specs & Comparison application.

## Structure

```
motorcycle-app/
├── apps/
│   ├── web/              # Public Next.js frontend
│   ├── admin/            # Private Next.js administration frontend
│   └── api/              # Shared ASP.NET Core backend
├── specs/                # Feature specifications (SpecKit)
│   ├── 001-motorcycle-comparison/
│   ├── 002-user-reviews/
│   ├── 003-advertising/
│   ├── 004-dealer-links/
│   └── 005-admin-catalog-management/
├── docs/                 # Shared documentation
├── .github/workflows/    # CI/CD pipelines
└── package.json          # pnpm workspaces config
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
- **.NET 8 SDK** (backend)
- **PostgreSQL** 14+ (database)

### Initial Setup

1. **Install Node dependencies:**
   ```bash
   pnpm install
   ```
   This installs dependencies for `apps/web/` and `apps/admin/` (managed by pnpm workspaces). Restore the API separately with `dotnet restore`.

2. **Ensure PostgreSQL is running locally** (or update connection string in `apps/api/appsettings.Development.json`).

### Running Locally

#### Option A: Run Both Apps in Separate Terminals (Recommended for Development)

**Terminal 1 — Backend API** (Visual Studio HTTPS profile runs on `https://localhost:7240`):
```bash
cd apps/api
dotnet restore
dotnet ef database update  # Apply migrations to local PostgreSQL
dotnet run --project Motorcycle.Api --launch-profile https
```

**Terminal 2 — Frontend Web** (runs on `http://localhost:3000`):
```bash
cd apps/web
pnpm dev
```

Open your browser to `http://localhost:3000`. The frontend sends API requests to `https://localhost:7240` (see `apps/web/lib/api.ts`). Trust the local ASP.NET Core certificate if prompted.

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

The `apps/admin/` Next.js site has a working Stage 1 local slice: Facebook Authorization Code + PKCE sign-in, an encrypted HttpOnly session, RS256 first-party API credentials, administrator-role management, and protected BikeModel CRUD through the shared `apps/api/` backend. Local development uses `https://localhost:3001`; the Facebook callback is `https://localhost:3001/api/auth/callback/facebook`. Bike CRUD, Azure image storage/assignment, and specification metadata CRUD remain deferred. See [specs/005-admin-catalog-management/spec.md](specs/005-admin-catalog-management/spec.md) and [apps/admin/README.md](apps/admin/README.md).

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
