# Motorcycle App

A monorepo for the Motorcycle Specs & Comparison application.

## Structure

```
motorcycle-app/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # ASP.NET Core backend
├── specs/                # Feature specifications (SpecKit)
│   ├── 001-motorcycle-comparison/
│   └── 002-user-reviews/
├── docs/                 # Shared documentation
├── .github/workflows/    # CI/CD pipelines
└── package.json          # pnpm workspaces config
```

## Tech Stack

- **Frontend**: Next.js 15+ (App Router) + TypeScript + Tailwind CSS
- **Backend**: ASP.NET Core 8+ (Clean Architecture)
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
   This installs dependencies for both `apps/web/` and `apps/api/` (managed by pnpm workspaces).

2. **Ensure PostgreSQL is running locally** (or update connection string in `apps/api/appsettings.Development.json`).

### Running Locally

#### Option A: Run Both Apps in Separate Terminals (Recommended for Development)

**Terminal 1 — Backend API** (runs on `http://localhost:5050`):
```bash
cd apps/api
dotnet restore
dotnet ef database update  # Apply migrations to local PostgreSQL
dotnet run --project Motorcycle.Api
```

**Terminal 2 — Frontend Web** (runs on `http://localhost:3000`):
```bash
cd apps/web
pnpm dev
```

Open your browser to `http://localhost:3000`. The frontend automatically proxies API requests to `http://localhost:5050` (see `apps/web/lib/api.ts`).

#### Option B: Backend Setup Only (if you need just the API)
```bash
cd apps/api
dotnet restore
dotnet ef database update
dotnet run --project Motorcycle.Api
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

When implementing a feature:
1. Review the feature spec in `specs/NNN-feature-name/spec.md`
2. Follow the plan in `specs/NNN-feature-name/plan.md`
3. Track progress in `specs/NNN-feature-name/tasks.md`
4. Modify both backend (`apps/api/`) and frontend (`apps/web/`) in the same session
5. Update relevant docs as you go

See [CLAUDE.md](CLAUDE.md) for AI-assisted development guidelines.
