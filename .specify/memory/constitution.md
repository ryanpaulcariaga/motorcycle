<!-- Sync Impact Report
Version: 1.0.0 (initial)
Principles: 7 core principles covering architecture, design patterns, and development practices
Sections: Technology Stack, Development Workflow, Governance
Changes: Initial constitution created from plan-motorcycleWebApp.md declarations
Status: All principles ratified 2026-09-01; no TODOs
-->

# Motorcycle Web App Constitution

## Core Principles

### I. Monorepo Full-Stack Architecture

The project is structured as a single monorepo (`motorcycle-app`) with separate concerns isolated in subdirectories: `apps/web/` (Next.js frontend), `apps/api/` (ASP.NET Core backend), `specs/` (feature specifications), and `docs/` (shared architecture/API/database documentation).

**Non-negotiable rules:**
- All features are implemented full-stack in a single specification/implementation cycle: backend API + frontend UI + tests together.
- Feature work always begins with a spec in `specs/NNN-feature-name/` containing `spec.md` (requirements), `plan.md` (design decisions), and `tasks.md` (actionable steps).
- Dependencies between apps are enforced via the typed HTTP client (`apps/web/lib/api.ts`) and backend DTOs; API contracts MUST remain stable.
- pnpm workspaces manage Node dependencies; root `package.json` defines workspace targets (`apps/*`).

**Rationale:** Monorepo structure accelerates full-stack iteration, keeps cross-layer changes synchronized, and simplifies feature documentation. Feature-driven specs ensure alignment before implementation and enable AI assistance with clear, complete context.

### II. Backend Clean Architecture with Inward Dependencies

The backend (`apps/api/`) is organized into four layers with strict dependency direction: `Domain` (entities, enums, no external dependencies) ← `Application` (use cases, services, interfaces, DTOs) ← `Infrastructure` (EF Core, repositories, external clients) ← `Api` (controllers, DI composition).

**Non-negotiable rules:**
- Domain entities MUST contain no external dependencies (no `using` statements for anything outside the project namespace).
- Application layer MUST define repository and strategy interfaces; Infrastructure implements them.
- Infrastructure layer MUST NOT be referenced directly from controllers; dependency injection via Application interfaces ONLY.
- Circular dependencies are forbidden; all edges point inward toward Domain.

**Rationale:** Clean Architecture ensures the business logic remains decoupled from frameworks and databases, making the codebase testable, maintainable, and resilient to technology changes.

### III. API-First Design with Typed Contracts

The frontend communicates exclusively with the backend via a typed HTTP client. All API responses are defined by backend DTOs (`Motorcycle.Application/DTOs/`), mirrored in the frontend TypeScript types (`apps/web/lib/types.ts`), and kept in sync.

**Non-negotiable rules:**
- Every API endpoint MUST define a corresponding DTO in `Motorcycle.Application/DTOs/`.
- Frontend TypeScript types MUST be derived from backend DTOs; if DTOs change, types MUST be updated in the same PR.
- All API requests flow through `apps/web/lib/api.ts` (centralized typed client); no direct `fetch()` calls in components.
- API contracts MUST be documented in `docs/api.md` with endpoint paths, methods, request/response DTOs, and pagination/caching policies.

**Rationale:** Typed contracts prevent runtime errors, improve IDE autocomplete support, and enforce a stable API surface. Centralized clients simplify error handling, logging, and future authentication.

### IV. Database Schema as Code (EF Core Migrations Only)

All database schema, indexes, and migrations are defined and versioned via EF Core migrations in `Motorcycle.Infrastructure/Migrations/`. Indexes (including expression indexes for JSONB specs) and any raw SQL are embedded in migration files via `migrationBuilder.Sql()`.

**Non-negotiable rules:**
- Schema definitions MUST exist as C# entity classes in `Motorcycle.Domain/` and `DbContext` configuration in `Infrastructure/Migrations/`.
- New schema changes MUST be generated via `dotnet ef migrations add <MigrationName>` and reviewed before merge.
- Expression indexes (e.g., on JSONB fields) and raw SQL MUST be added inside migration `Up()` methods, never in separate SQL files.
- Migrations MUST be idempotent; re-running `dotnet ef database update` on an already-migrated database MUST be a no-op.
- Seed data (brands, categories, spec_definitions) MUST be in `Infrastructure/Seeding/` as idempotent SQL scripts or EF Core seed methods.

**Rationale:** Schema-as-code keeps the database definition version-controlled, searchable, and AI-readable alongside application code. Embedded indexes avoid splitting schema information across multiple tools/formats.

### V. Strategy Pattern for Extensible Filtering & Comparison

Spec filtering and bike comparison logic is implemented via the Strategy pattern. `ISpecFilterStrategy` defines the contract; concrete implementations (`NumberRangeFilterStrategy`, `ExactMatchFilterStrategy`, `MultiSelectFilterStrategy`, `BooleanFilterStrategy`) handle filtering per `spec_definitions.data_type`.

**Non-negotiable rules:**
- New data types MUST NOT require changes to existing filter implementations; implement a new strategy instead.
- `SpecFilterStrategyFactory` (or equivalent DI keyed resolution) MUST resolve the correct strategy per spec type at request time.
- Both `GET /api/bikes` filtering and comparison alignment (`GET /api/bikes/compare`) MUST use the same strategy pipeline.
- Strategy implementations MUST include unit tests validating range/exact-match/multiselect/boolean edge cases.

**Rationale:** Strategy pattern decouples filtering logic from bike queries, making new spec types and filter operators additive changes. This supports the future roadmap (e.g., AI-generated pros/cons, new spec types) without touching existing code.

### VI. Feature-Driven Development with Specs-First Workflow

Every feature begins with a specification document (not code). The workflow is: spec → plan → tasks → implementation.

**Non-negotiable rules:**
- Before implementation, feature requirements MUST be captured in `specs/NNN-feature-name/spec.md` (What and Why).
- Implementation design MUST be documented in `specs/NNN-feature-name/plan.md` (How, architecture decisions, tech choices).
- Actionable tasks MUST be listed in `specs/NNN-feature-name/tasks.md` with dependencies ordered for incremental completion.
- AI assistance MUST be provided the spec link in requests to enable full-stack context.

**Rationale:** Specs-first prevents scope creep, aligns stakeholders before coding, and provides AI tools with the complete context needed to assist effectively on backend, frontend, and test layers together.

### VII. Mobile-First Responsive UI with Tailwind CSS

Frontend UI is designed mobile-first using Tailwind CSS utility classes. Base styles target mobile; `sm:`/`md:`/`lg:` breakpoints layer styling for tablet/desktop. The color palette is: header (black bg, white text), page background (gold/orange), content areas (white), sidebar (dark brown), buttons (default brown, `:active` black).

**Non-negotiable rules:**
- All pages MUST render acceptably at mobile (320px), tablet (768px), and desktop (1024px+) widths; breakpoints MUST be tested.
- Sidebar navigation MUST collapse into a hamburger/drawer below the `md` breakpoint.
- Tailwind theme tokens MUST be configured in `next.config.ts` for consistent colors; no inline hex values in components.
- Images MUST be served via `next/image` with a remote pattern for Azure Blob Storage URLs; lazy loading MUST be enabled.

**Rationale:** Mobile-first ensures the app is usable on the majority of user devices first; progressive enhancement for desktop comes naturally. Tailwind utilities reduce CSS bundle size and speed up iteration.

## Technology Stack

**Required Stack:**
- **Frontend:** Next.js (React, App Router, SSR/SEO), TypeScript, Tailwind CSS (mobile-first, custom theme), `next/image` for image optimization.
- **Backend:** ASP.NET Core Web API (.NET 8+), C#, EF Core (Npgsql provider), Clean Architecture (Domain/Application/Infrastructure/Api layers).
- **Database:** PostgreSQL (Azure Database for PostgreSQL – Flexible Server), JSONB for spec storage, GIN and expression indexes for filtering performance.
- **Infrastructure:** Azure (App Service, Key Vault, Storage Account with public read-only blob container for images, managed identity for auth).
- **CI/CD:** GitHub Actions workflows in `.github/workflows/` with path-based triggers (`apps/web/` and `apps/api/` separately).

**No Exceptions:** Technology changes (e.g., swap React for Vue, swap ASP.NET Core for Node.js) require a constitution amendment and explicit approval.

## Development Workflow

1. **Specification Phase:** Feature requirements are written in `specs/NNN-feature-name/spec.md` (What and Why). AI assistance is invited to clarify ambiguities via the spec.
2. **Planning Phase:** Architecture and design decisions are documented in `specs/NNN-feature-name/plan.md`. Cross-layer concerns (backend DTOs, frontend state management, database schema) are sketched before implementation.
3. **Task Generation:** Actionable, dependency-ordered tasks are listed in `specs/NNN-feature-name/tasks.md`. Full-stack work (backend + frontend + tests) is grouped in single PRs when feasible.
4. **Implementation:** Each task is implemented, tested locally against the live API, and verified end-to-end. PRs reference the spec.
5. **Code Review:** Reviews MUST verify compliance with architecture (Clean Architecture layers, API-first contracts, schema-as-code) and mobile responsiveness.
6. **Documentation Updates:** `docs/architecture.md`, `docs/api.md`, `docs/database.md` are updated in the same PR as the implementation.

**No Branch Deployment Yet:** Deployment to Azure is manual for now. CI/CD pipelines build and test on push; deployment workflows are prepared but not yet triggered automatically. Deployment slots and staging environments are deferred.

## Governance

**Constitution Authority:** This constitution supersedes all ad-hoc practices and conventions. Decisions not explicitly addressed here defer to the spirit of these principles: keep layers clean, APIs typed, schemas versioned, and features spec-first.

**Amendment Process:**
- Amendments (MAJOR or MINOR version bumps) require explicit documentation of the change, rationale, and any migration steps.
- Clarifications and wording fixes (PATCH versions) do not require formal approval but SHOULD be noted in the Sync Impact Report.
- All amendments are recorded in this document's version/date footer.

**Versioning:** Semantic Versioning is used:
- **MAJOR:** Backward-incompatible principle removals or redefinitions (e.g., switching away from Clean Architecture).
- **MINOR:** New principles or material expansions to existing guidance (e.g., adding a new required library or architectural layer).
- **PATCH:** Clarifications, wording, typo fixes, non-semantic refinements (e.g., correcting a breakpoint value).

**Compliance Review:** At the start of each phase (per `plan-motorcycleWebApp.md` phases), architecture decisions MUST be reviewed against this constitution. Non-compliance MUST be flagged and resolved before proceeding.

**Guidance Files:** Runtime development guidance is kept in `CLAUDE.md` (AI assistance guidelines) and `docs/` (architecture, API, database docs). This constitution defines governance; `CLAUDE.md` and `docs/` define practices and how-tos.

---

**Version:** 1.0.0 | **Ratified:** 2026-09-01 | **Last Amended:** 2026-09-01
