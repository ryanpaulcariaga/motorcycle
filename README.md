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
- Node.js 18+ and pnpm
- .NET 8 SDK
- PostgreSQL 14+

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. See [docs/architecture.md](docs/architecture.md) for system design.

3. See [apps/web/README.md](apps/web/README.md) and [apps/api/README.md](apps/api/README.md) for app-specific setup.

## Feature Development

Features are spec-driven. See [specs/](specs/) for active features.

When implementing a feature:
1. Review the feature spec in `specs/NNN-feature-name/spec.md`
2. Follow the plan in `specs/NNN-feature-name/plan.md`
3. Track progress in `specs/NNN-feature-name/tasks.md`
4. Modify both backend (`apps/api/`) and frontend (`apps/web/`) in the same session
5. Update relevant docs as you go

See [CLAUDE.md](CLAUDE.md) for AI-assisted development guidelines.
