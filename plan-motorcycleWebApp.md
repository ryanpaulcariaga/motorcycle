## Plan: Motorcycle Specs & Comparison Web App (MVP)

**Progress status (updated 2026-09-01, paused to conserve credits)**
- ✅ Phase 0 — Monorepo Initialization — DONE
- ✅ Phase 1 — Database Design — DONE (schema, migrations, GIN index, seed data all applied to local Postgres)
- ✅ Phase 2 — Backend API — DONE (repositories, Strategy-pattern spec filters, services, controllers; smoke-tested against live DB)
- ✅ Phase 3 — Frontend — DONE (Tailwind theme, layout components, typed API client, `/`, `/bikes`, `/bikes/[slug]`, `/compare`; smoke-tested end-to-end against live API)
- ⏳ Phase 4 — Azure Infrastructure & Deployment — NOT STARTED (next step when resuming)
- ⏳ Phase 5 — Future Backlog — NOT STARTED (intentionally deferred, schema stubs only)

**Resume here:** Phase 4, step 19 (provision Azure resources). Local dev stack (Postgres + `dotnet run` API on :5050 + `pnpm run dev` web on :3000) is fully working — no rework needed on Phases 0-3 unless requirements change.

Monorepo full-stack app: Next.js (React, SSR/SEO, Tailwind CSS) frontend + ASP.NET Core Web API backend (Clean Architecture, EF Core, Strategy pattern for spec filtering) + PostgreSQL (JSONB specs, schema versioned via EF Core Migrations) + Azure Blob Storage for images, all hosted on Azure App Service. MVP = browse/search/filter/compare bikes with grouped specs; no auth, no votes/comments, no admin UI yet (manual SQL seeding). Future-proofing baked into schema for: AI pros/cons, annual surveys, analytics (views/searches), and upvote/downvote + comments.

**Decisions**
- Repo structure: **monorepo** — single `motorcycle-app` repo with `apps/web` (Next.js frontend) and `apps/api` (ASP.NET Core backend); `specs/` for cross-app feature definitions; `docs/` for shared architecture/database/API docs; `.github/workflows` for CI/CD pipelines targeting both apps.
- Auth: none in MVP (fully anonymous). Add identity provider later when votes/comments/surveys are built.
- Data entry for MVP: manual SQL seed scripts for bikes, spec groups/specs, and image URLs — no admin UI yet.
- Hosting: Azure App Service (Linux, one plan, two Web Apps: `api` and `web`). Azure Database for PostgreSQL – Flexible Server. Azure Storage Account (Blob) for images, served via **public read-only blob container** (simpler than SAS token rotation; images are non-sensitive marketing content) — Azure CDN/Front Door deferred until traffic warrants it.
- Secrets (DB connection string, storage account key) go in **Azure Key Vault**, referenced by App Service via Key Vault references / managed identity.
- **Backend architecture: Clean Architecture** — `Domain` (entities, enums, no dependencies), `Application` (use cases/services, interfaces, strategy contracts), `Infrastructure` (EF Core `DbContext`/repositories, Npgsql provider, blob storage client), `Api` (controllers/presentation, DI composition root). Dependencies point inward only.
- **Data access: EF Core** (Npgsql provider), chosen over Dapper so the schema stays defined as C# entity/`DbContext` configuration checked into the repo — fully visible/searchable (by you and by AI assistance) alongside the API and UI code, rather than living only as external `.sql` files. Repository pattern in `Infrastructure` wraps the `DbContext`; `specs` column mapped as `jsonb` via Npgsql's JSON support (`Dictionary<string, object>`/`JsonDocument` with a value comparer).
- **Strategy design pattern**: applied to spec filtering & comparison logic — `ISpecFilterStrategy` with implementations per `data_type` (`NumberRangeFilterStrategy`, `ExactMatchFilterStrategy`, `MultiSelectFilterStrategy`, `BooleanFilterStrategy`), resolved via a factory/DI keyed on `spec_definitions.data_type` so new data types can be added without touching existing filter code.
- **Database schema as code: EF Core Migrations only** (DbUp dropped) — migrations are generated/hand-edited C# files (`Infrastructure/Migrations/`) plus the corresponding SQL is visible via `dotnet ef migrations script`; any schema that EF Core doesn't model directly (GIN/expression indexes, future views/stored procedures) is added via `migrationBuilder.Sql(...)` inside the same migration files, so everything — tables, indexes, and any raw SQL — stays in one version-controlled, AI-readable history instead of a separate tool/format.
- Spec settings model: 2-level hierarchy — `spec_groups` (e.g., Engine, Body) → `spec_definitions` (e.g., cc, horsepower), each with a `sort_order`. Bikes table stores only a flat JSONB map of `spec_code -> value`; no group reference on the bike row. Rendering joins bike JSON keys against `spec_definitions`/`spec_groups` order at request time, so admin can reorder/add/remove specs later without touching bike rows.
- Dynamic filtering: PostgreSQL JSONB with GIN index on the `specs` column plus targeted **expression indexes** (e.g., `((specs->>'horsepower')::numeric)`) for specs flagged `is_filterable` in `spec_definitions`, to keep range queries fast at 200–1000+ bikes/year scale.
- Comparison UX: unlimited bikes can be added; side-by-side card layout for a small number, auto-switches to a scrollable table layout past a threshold (e.g., >4–5 bikes), always grouped/ordered per `spec_groups`/`spec_definitions`.
- **CSS: Tailwind CSS** (chosen over Bootstrap) — utility-first, purges unused classes at build time for a much smaller final CSS bundle, integrates natively with Next.js, and makes a fully custom color palette straightforward without fighting component overrides.
- **Responsive approach: mobile-first** — base Tailwind styles target mobile, with `sm:`/`md:`/`lg:` breakpoints layering up for tablet/desktop; layout collapses sidebar into a mobile nav (e.g., hamburger/drawer) below `md`.
- **Color palette** (Tailwind theme tokens): header — black background, white text; main page background — gold/orange; central content area (bike list, detail, compare tables) — white background; sidebar (secondary nav) — dark brown; buttons — default brown, switching to black on `:active`/pressed state (other approved button colors: gold/orange, black, dark grey for varied emphasis e.g. primary/secondary/destructive actions).
- Future items (design for, do not build now): AI-generated pros/cons for compared bikes; annual user surveys (preferred bike / owned bike + feedback); most-viewed bikes & most-searched specs/categories analytics; per-bike upvote/downvote + comments. Add lightweight schema stubs now where low-cost, but no endpoints/UI.

**Steps**

### Phase 0 — Monorepo Initialization ✅ DONE
0. Set up `motorcycle-app` monorepo structure:
   - Create directories: `apps/web/`, `apps/api/`, `specs/`, `docs/`, `.github/workflows/`
   - Initialize root `package.json` with pnpm workspaces (targets `apps/*`)
   - Create `.gitignore` (Node, .NET, Python, OS files)
   - Create `README.md` (monorepo overview)
   - Create `CLAUDE.md` (AI development guidelines for full-stack feature work)
   - Create placeholder specs: `specs/001-motorcycle-comparison/` with `spec.md`, `plan.md`, `tasks.md`
   - Create placeholder docs: `docs/architecture.md`, `docs/api.md`, `docs/database.md`
   - Create GitHub Actions workflow templates: `.github/workflows/deploy-web.yml`, `deploy-api.yml`
   - Initialize git repo and commit scaffold

### Phase 1 — Database Design (PostgreSQL, Azure Flexible Server) ✅ DONE
1. Design core schema:
   - `brands` (id, name, logo_blob_url, created_at)
   - `categories` (id, name) — e.g., Sport, Cruiser, Scooter, ADV (simple lookup table)
   - `bikes` (id, brand_id FK, category_id FK, model_name, year, msrp_price, slug, specs JSONB, is_published, created_at, updated_at)
   - `bike_images` (id, bike_id FK, blob_url, sort_order, is_primary) — ~10 rows/bike
   - `spec_groups` (id, code, name, sort_order, icon_name nullable)
   - `spec_definitions` (id, group_id FK, code, label, data_type enum[number/text/boolean/enum], unit nullable, sort_order, is_filterable, filter_type enum[range/exact/multiselect] nullable)
2. Add indexes: GIN index on `bikes.specs`; expression indexes per `is_filterable` spec (generate via migration script driven by `spec_definitions` seed data); btree indexes on `brand_id`, `category_id`, `year`, `msrp_price`.
3. Add forward-looking (schema-only, unused for now) stub tables: `bike_views` (bike_id, viewed_at, session_hash), `spec_search_log` (spec_code, filter_value, searched_at), `bike_votes` (bike_id, session_or_user_id, vote_type, created_at), `bike_comments` (bike_id, author_name, body, created_at, is_approved), `survey_responses` (year, respondent_ref, payload JSONB). Keep these unused/no endpoints in MVP — just reserve the shape so future features don't require breaking migrations.
4. Structure schema as **EF Core Migrations** in `Motorcycle.Infrastructure/Migrations`: entity classes + `DbContext` `OnModelCreating` configuration define the tables (generated via `dotnet ef migrations add`); the GIN/expression indexes from step 2 are added inside the same migration files via `migrationBuilder.Sql(...)` raw SQL, keeping schema, indexes, and any future views/stored procedures in one version-controlled, C#-visible history.
5. Write manual SQL seed scripts (kept separate from EF migrations, e.g. `Infrastructure/Seed/*.sql` or an idempotent EF Core seeding method): brands, categories, spec_groups + spec_definitions (with correct sort_order), and a batch of sample bikes/specs/images for local dev.

### Phase 2 — Backend API (ASP.NET Core Web API, Clean Architecture) ✅ DONE — *depends on Phase 1 schema; can work in parallel with Phase 3 after API contracts drafted*
6. Scaffold `apps/api` as a **Clean Architecture** solution with projects: `Motorcycle.Domain` (entities: Bike, Brand, Category, SpecGroup, SpecDefinition, BikeImage — no external dependencies), `Motorcycle.Application` (use-case services, DTOs, repository interfaces, `ISpecFilterStrategy` contract), `Motorcycle.Infrastructure` (EF Core `DbContext`, migrations, repositories, Npgsql provider setup, Azure Blob client, concrete strategy implementations), `Motorcycle.Api` (controllers/presentation, DI composition root, middleware). Dependency direction: `Api` → `Infrastructure`/`Application` → `Domain` only.
7. Implement EF Core in `Infrastructure`: `MotorcycleDbContext` with entity configurations (`IEntityTypeConfiguration<T>` per entity), repositories wrapping the `DbContext` per `Application`-defined interfaces; `specs` column mapped as `jsonb` and deserialized to a `Dictionary<string, object>`/`JsonDocument` via Npgsql's JSON type mapping + a value comparer for change tracking.
8. Implement the **Strategy pattern** for spec filtering/comparison in `Application`/`Infrastructure`: `ISpecFilterStrategy` with `NumberRangeFilterStrategy`, `ExactMatchFilterStrategy`, `MultiSelectFilterStrategy`, `BooleanFilterStrategy`; a `SpecFilterStrategyFactory` resolves the right strategy per `spec_definitions.data_type`/`filter_type` so `GET /api/bikes` filtering and the compare alignment logic share the same extensible pipeline.
9. Build endpoints:
   - `GET /api/bikes` — list with pagination, sort, static filters (brand, category, year, price range) + dynamic filters (spec code + operator/value pairs resolved via the Strategy pattern against `spec_definitions.is_filterable`).
   - `GET /api/bikes/{slug}` — detail: bike info + images ordered by `sort_order` + specs matrix aligned to `spec_groups`/`spec_definitions` order (missing specs render as null/blank).
   - `GET /api/bikes/compare?ids=1,2,3,...` — same alignment logic as detail but across N bikes, returns group→spec→{bikeId: value} matrix.
   - `GET /api/spec-groups` — full groups+specs settings (drives frontend filter panel & compare labels/units).
   - `GET /api/brands`, `GET /api/categories` — lookups for filter UI.
10. Add response caching (e.g., output caching or in-memory cache) for `spec-groups`/`brands`/`categories` since they change rarely.
11. Configure CORS for the Next.js origin, Swagger for dev, structured logging (Serilog) to App Service log stream.
12. Add health check endpoint for App Service monitoring.

### Phase 3 — Frontend (Next.js + Tailwind CSS) ✅ DONE — *can start in parallel with Phase 2 once API contracts drafted (step 9)*
13. Scaffold `apps/web`: Next.js App Router, TypeScript, Tailwind CSS (mobile-first config), a data-fetching layer (typed API client) matching backend DTOs.
14. Configure Tailwind theme tokens for the color palette: `header` black bg/white text, `page` background gold/orange, `content`/card areas white background, `sidebar` dark brown, `button-default` brown with `:active`/pressed state turning black (plus gold/orange, black, dark grey as alternate button variants for different emphasis levels).
15. Build shared layout components mobile-first: `Header` (black bg, white text, top nav, collapses to mobile menu), `Sidebar` (dark brown, secondary nav links, becomes a drawer/hamburger panel below `md` breakpoint), `PageShell` (gold/orange page background wrapping a white-background central content area), `Button` (variant-driven brown/gold/black/dark-grey styles with active-state feedback).
16. Pages:
   - `/bikes` — list/search page: static filter sidebar (brand/category/year/price) + dynamic spec filter panel (range sliders for numeric, multiselect for enum) built from `/api/spec-groups`; server-rendered for SEO with client-side filter interactivity; responsive grid (1 col mobile → multi-col desktop).
   - `/bikes/[slug]` — detail page: image gallery (~10 photos, lightbox), spec table grouped/ordered per settings; stacks vertically on mobile, side-by-side sections on desktop.
   - `/compare` — bike picker (search/add), side-by-side cards for few bikes, auto-switch to scrollable comparison table past threshold; selection state in URL query params (shareable links) backed by client state (Zustand or Context); on mobile the comparison table scrolls horizontally with sticky spec labels column.
   - `/` home — featured/latest bikes, entry points to search & compare.
17. Image handling: `next/image` with a remote pattern pointing at the Azure Blob public container hostname.
18. Basic SEO metadata (per-bike titles/OG tags using bike name + primary image).

### Phase 4 — Azure Infrastructure & Deployment ⏳ NOT STARTED (resume here) — *can start in parallel with Phases 2–3, finalized once app configs are known*
19. Provision: Resource Group → Azure Database for PostgreSQL Flexible Server → Azure Storage Account (Blob container, public read access for images) → Azure Key Vault (DB connection string, storage keys) → App Service Plan (Linux) with two Web Apps (`api`, `web`), each with managed identity + Key Vault references.
20. CI/CD: GitHub Actions workflows in `.github/workflows/` — build/test both `apps/web` and `apps/api` on each push; deploy to corresponding App Services only if changes detected in that app's folder; API pipeline also runs `dotnet ef database update` against the target environment as a deploy step (deployment slots can be deferred to later).
21. Configure `web` App Service for Next.js standalone output/Node runtime (source: `apps/web/`); configure `api` App Service for the ASP.NET Core runtime (source: `apps/api/`); wire environment variables/app settings for API base URL, DB connection, storage account URL.
22. Point DNS/custom domain (if any) and confirm HTTPS.

### Phase 5 — Future Backlog (not built now, tracked for later) ⏳ NOT STARTED (intentionally deferred)
23. AI-generated pros/cons for compared bikes (likely an async job hitting an LLM, cached per bike-set).
24. Annual survey feature (preferred bike / owned bike + feedback) using `survey_responses` stub table.
25. Analytics: most-viewed bikes, most-searched specs/categories, backed by `bike_views`/`spec_search_log` stub tables + a lightweight aggregation job/dashboard.
26. Upvote/downvote + comments per bike using `bike_votes`/`bike_comments` stub tables — will require introducing auth/session identity first.
27. Maintenance/admin site for managing bikes, images, spec groups/specs and their order (replaces manual SQL seeding).

**Relevant files**
- **Root**: `package.json` (pnpm workspaces), `.gitignore`, `README.md`, `CLAUDE.md` (AI guidelines)
- **`apps/api/`** — ASP.NET Core Web API, Clean Architecture solution: `Motorcycle.Domain/`, `Motorcycle.Application/`, `Motorcycle.Infrastructure/` (contains `Migrations/`, `DbContext`, `Seed/`), `Motorcycle.Api/`; plus `Motorcycle.Api.sln` at the root of `apps/api/`
- **`apps/web/`** — Next.js repo with Tailwind CSS configured (theme tokens for the header/page/sidebar/content/button color palette)
- **`specs/`** — cross-application feature specifications (e.g., `specs/001-motorcycle-comparison/` with `spec.md`, `plan.md`, `tasks.md`; each spec-driven feature gets a numbered folder)
- **`docs/`** — shared architecture, API, and database documentation; updated as implementation progresses
- **`.github/workflows/`** — CI/CD pipelines for both apps (path-triggered on commits to `apps/web/` and `apps/api/`)

**Verification**
1. `dotnet ef database update` applies all migrations cleanly against a fresh local/dev PostgreSQL instance, and re-running it is a no-op (idempotent); `dotnet ef migrations script` reviewed to confirm the raw-SQL index statements are included correctly.
2. Seed scripts produce a queryable set of bikes with correct spec alignment (manually verify a sample bike's spec table matches `spec_groups`/`spec_definitions` order).
3. `GET /api/bikes` supports combined static + dynamic spec filters (exercising each `ISpecFilterStrategy` implementation) and returns correct pagination.
4. `GET /api/bikes/compare?ids=...` returns a correctly grouped/ordered matrix for 2, 5, and 10+ bikes (to validate the UI's side-by-side → scrollable-table switch threshold).
5. Frontend `/bikes`, `/bikes/[slug]`, and `/compare` pages render against the live API in a local dev environment; image gallery loads from the Azure Blob container; verify layout/colors at mobile, tablet, and desktop breakpoints.
6. Deployed App Services reachable over HTTPS; API connects to Azure Database for PostgreSQL and Blob Storage using Key Vault-sourced secrets (no secrets in App Service plain settings or source control).

**Further Considerations**
1. Category-specific spec sets (e.g., scooters vs. sportbikes needing different spec lists) aren't explicitly modeled — current design relies purely on per-bike JSONB flexibility (bikes just omit specs that don't apply). If you later want the *settings UI* to scope certain spec groups to certain categories, that's an additive change to `spec_definitions` (add optional `category_id` scoping) — flag if this matters for the admin site later.
2. Public blob container for images means anyone with a bike's blob URL can view it (fine for public marketing photos) — confirm no bike images should ever be private/unpublished-only; if unpublished bikes need hidden images, we'd need SAS tokens or a private container for those specific blobs.
3. Exact hex values for the black/gold-orange/dark-brown palette aren't specified yet — recommend finalizing a small design-token swatch (e.g., via Tailwind config) before Phase 3 UI work starts, so contrast/accessibility (WCAG AA text contrast on gold/orange backgrounds) can be checked early.
