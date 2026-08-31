# AI-Assisted Development Guidelines

When working on this monorepo with an AI assistant (e.g., GitHub Copilot):

## Scope & Structure

- This is a **monorepo**: single repo with `apps/web/` (Next.js frontend) and `apps/api/` (ASP.NET Core backend).
- Use **pnpm workspaces** for Node dependencies.
- **Feature-driven**: each feature has a spec in `specs/NNN-feature-name/`.

## Development Workflow

1. **Always start with the spec**: Read `specs/NNN-feature-name/spec.md` to understand requirements.
2. **Full-stack in one session**: Implement backend + frontend + tests together (that's why this is a monorepo).
3. **Update docs**: Modify `docs/architecture.md`, `docs/api.md`, or `docs/database.md` if adding new concepts.
4. **Reference the plan**: Use `specs/NNN-feature-name/plan.md` for implementation steps.
5. **Track tasks**: Update `specs/NNN-feature-name/tasks.md` with progress.

## Key Files & Patterns

- **Backend Clean Architecture**: 
  - `apps/api/Motorcycle.Domain/` — entities, enums
  - `apps/api/Motorcycle.Application/` — use cases, DTOs, interfaces
  - `apps/api/Motorcycle.Infrastructure/` — EF Core, repositories
  - `apps/api/Motorcycle.Api/` — controllers, DI setup

- **Frontend Page Routes**:
  - `apps/web/app/` — Next.js App Router pages
  - `apps/web/components/` — reusable React components
  - `apps/web/lib/` — utilities, API client, types

- **Specs Template**:
  - `spec.md` — What and why (requirements)
  - `plan.md` — How (design, architecture decisions)
  - `tasks.md` — Checklist of implementation steps

## Important Constraints

- **No secrets in code**: DB connection strings, API keys → Azure Key Vault (referenced via managed identity)
- **API-first**: Frontend calls backend via typed HTTP client; keep API contracts stable
- **Database migrations**: Use EF Core migrations only (in `apps/api/Motorcycle.Infrastructure/Migrations/`)
- **Images**: Served from Azure Blob Storage (public read-only container)

## Useful Commands

```bash
# Install & manage dependencies
pnpm install
pnpm add <package> -w  # Add to root workspace
pnpm add <package> -W  # Add to root workspace (alternative)

# Frontend development
cd apps/web
pnpm dev          # Run dev server
pnpm build        # Build for production
pnpm lint         # Run ESLint

# Backend development
cd apps/api
dotnet run --project Motorcycle.Api
dotnet build
dotnet test
dotnet ef migrations add <MigrationName> --project Motorcycle.Infrastructure
dotnet ef database update

# Deployment (manual for now)
# See .github/workflows/ for CI/CD pipeline setup
```

## Communication with AI

When asking for a feature implementation:

**Good**: "Implement the bikes search feature. See specs/001-motorcycle-comparison/plan.md for the design."

**Less effective**: "Add a search API endpoint." (AI won't know the full context)

Provide the spec or a link to it—that's the single source of truth.
