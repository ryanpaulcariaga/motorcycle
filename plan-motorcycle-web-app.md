## Plan: Motorcycle Specs, Comparison & Administration App

> **Living document.** This file is the single source of truth for project decisions, implementation status, the feature log, and the backlog. Update it whenever work ships. Per-feature `specs/` folders and SpecKit are no longer used (the `.specify/` constitution/templates and `.github/skills/speckit-*` remain only for possible future use; earlier spec history is in git). LLM-facing references stay in `docs/` and `.github/copilot-instructions.md`.

### Contents
1. [Release Status at a Glance](#release-status-at-a-glance)
2. [Production Readiness Scorecard](#production-readiness-scorecard)
3. [Release Gates](#release-gates)
4. [Work Register](#work-register)
5. [Local Development Quick Reference](#local-development-quick-reference)
6. [Feature Log](#feature-log-implemented)
7. [Non-Functional Requirements](#non-functional-requirements-targets-to-design-and-review-against-none-are-verified-yet) and [Engineering Practices](#engineering-practices)
8. [Provisioned Azure Resources](#provisioned-azure-resources-as-of-2026-09-22), then Decisions, Phases, and Verification

Status legend: ✅ done and verified · 🔄 partly done · ❌ not started · ⏳ deferred by decision · ⚠️ done but unverified

### Release Status at a Glance

**Verdict (updated 2026-10-20): LIVE IN AZURE; NOT YET READY FOR GENERAL PUBLIC PROMOTION.** The production API, public web app, and admin SPA are deployed. HTTP smoke checks returned `200` for the public catalog (`/bikes`), admin homepage (`/`), API liveness (`/health`), and API readiness (`/health/ready`) on 2026-10-19. On 2026-10-20, the operator confirmed the deployed apps connect to the production database and storage account and Facebook sign-in works. Detailed browser acceptance and remaining configuration, security, testing, legal, and operational gates are still open.

| Phase | Status | Notes |
|---|---|---|
| 0 Monorepo | ✅ | pnpm workspace, `apps/web`, `apps/admin`, `apps/api`, `docs/`, workflows |
| 1 Database | ✅ | Schema, EF Core migrations, GIN index, seed data |
| 2 Backend API | ✅ | Clean Architecture, Strategy-pattern filters, Serilog, ProblemDetails, `/health` and `/health/ready` |
| 3 Public frontend | ✅ | `/`, `/bikes`, `/bikes/[slug]`, `/compare`, Facebook sign-in, "Often compared with", sitemap/robots, error pages |
| 4 Admin catalog | ✅ locally | See Feature Log; acceptance coverage and hardening are release gates |
| 5 Azure and deployment | ✅ live | All three apps deployed via OIDC; production endpoints and health routes returned HTTP 200 on 2026-10-19; browser-level acceptance and remaining operational gates are pending |
| 6 Future backlog | ⏳ | Reviews, advertising, dealer links, AI pros/cons, surveys, analytics, voting |

### Production Readiness Scorecard

| Area | Status | Evidence | Gap / next action | Ref |
|---|---|---|---|---|
| Product functionality | ✅ | Feature Log items 1–9 work locally | Browser acceptance of bulk spec and admin flows | G-05 |
| Azure infrastructure | ✅ | Resource group, PostgreSQL, Storage, Key Vault, plan, 3 Web Apps | None | |
| Deployment pipeline | ✅ | `ci.yml` (PRs, reused) and `deploy.yml` (push to `master`: CI, then per-app OIDC deploy to Azure); OIDC setup done and deployment succeeded 2026-10-19 (run #39211828423); production HTTP checks passed for all three apps and API health/readiness; operator confirmed database/storage connectivity and working Facebook sign-in on 2026-10-20; `scripts/setup-azure-oidc.ps1` creates the identity and federated credential (parameterized for future dev/QA) | Detailed browser acceptance of catalog content/images, sitemap/robots, and admin CRUD workflows | G-01, TODO-2, TODO-3, G-05 |
| Configuration and secrets | 🔄 | Key Vault references for DB and Storage strings; admin Facebook App ID/secret added to API App Service configuration (operator-confirmed 2026-10-19); production frontend URL variables configured; operator confirmed Facebook sign-in works (2026-10-20); Swagger off outside Development unless `Swagger__Enabled=true`; deploy secrets via OIDC (no stored credentials) | Verify Facebook secret is Key Vault-backed, Meta review/data-use requirements, and production domain/HTTPS policy | G-02 |
| Database and migrations | 🔄 | API `/health/ready` returned HTTP 200; operator confirmed production database and storage connectivity (2026-10-20); API now applies migrations on every startup, independent of the development seed setting; migration and explicit update procedures documented in README | Review production migration state and validate startup migration behavior against production | G-03 |
| Observability | 🔄 | Serilog console logs, `/health`, `/health/ready`, ProblemDetails | Application Insights, alerts, uptime probes, error tracking | G-06 |
| Automated testing | ❌ | API unit tests exist (3 files); CI defined | CI never run on GitHub; no image/spec/bulk tests; no frontend or e2e tests | G-04, TODO-7 |
| Security | ❌ | HttpOnly Secure cookies, policy-based admin auth, CORS allow-list | Rate limiting, security headers, CSRF stance, upload validation, audit log, admin IdP exit plan | G-07 |
| Responsive and accessibility | ⚠️ | Mobile-first Tailwind, header drawer | No audit; contrast of gold/orange palette unchecked | G-08 |
| SEO and sharing | 🔄 | Per-bike metadata, `sitemap.xml`, `robots.txt`, error pages | OpenGraph images, canonical URLs, JSON-LD | TODO-6 |
| Performance | ⏳ | Lookup endpoints cached 10 minutes | Output caching for `/api/bikes`, Next.js revalidation, load check at 1000+ bikes | TODO-5, G-09 |
| Privacy and legal | ❌ | None | Privacy policy, terms, cookie consent, data deletion process, Facebook app review | G-10 |
| Backup and recovery | ❌ | None | PostgreSQL backups, Blob soft delete, tested restore, rollback runbook | G-11 |
| Domains and TLS | ❌ | Default `azurewebsites.net` hosts | Custom domains, HTTPS-only, Facebook redirect URIs | G-02 |
| Cost control | ❌ | Basic B1 plan, Burstable B1ms | Budget and alerts | G-12 |

### Release Gates

- [x] **G-01** Deployment and availability verified: Azure OIDC app registration, GitHub `production` environment, secrets/variables, and runtime stacks configured; deployment succeeded (2026-10-19, run #39211828423); HTTP checks for `/bikes`, admin `/`, `/health`, and `/health/ready` returned 200 (2026-10-19); operator confirmed production database/storage connectivity and working Facebook sign-in (2026-10-20). This gate covers deployment and basic availability only; detailed UI/catalog acceptance remains in G-05.
- [ ] **G-02** Production configuration complete: Facebook app production redirect URIs, review/data-use, CORS origins, GitHub variables `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_URL`, and HTTPS/custom-domain policy. Facebook sign-in and core endpoint connectivity are operator-confirmed (2026-10-20); verify the remaining configuration and policy items before closing.
- [ ] **G-03** Migration strategy: API applies pending migrations on every startup in all environments; migrations remain out of the deployment pipeline; review production migration state and validate the operational procedure documented in README
- [ ] **G-04** CI passes on GitHub (API tests, web/admin lint and build); core API tests added for image, spec metadata, bulk spec, and compare tracking
- [ ] **G-05** Browser acceptance beyond basic sign-in/connectivity: public browse, filters, compare, images and sitemap/robots; admin BikeModel, variant, image upload/management, spec metadata, and bulk spec/grid flows
- [ ] **G-06** Monitoring in place: Application Insights or equivalent, alerts on failures, uptime probes for `/health/ready`
- [ ] **G-07** Security baseline: rate limiting on auth/upload/public endpoints, security headers on all three apps, documented CSRF stance, upload type/size validation, admin audit log, decision on the admin identity provider
- [ ] **G-10** Privacy policy and terms published; cookie consent if analytics/ads are added
- [ ] **G-11** Backups enabled and one restore tested; rollback procedure written

**Should pass before public promotion**
- [ ] **G-08** Accessibility audit (WCAG 2.2 AA) and responsive check at 360, 768, 1280 px, including admin tablet behavior
- [ ] **G-09** Load/performance check on realistic catalog size; LCP budget on mobile
- [ ] **G-12** Azure budget and cost alerts
- [ ] Success metrics defined (traffic, compare usage, catalog completeness)
- [ ] Catalog data sourcing, verification, and `is_reviewed` publishing workflow defined

**After launch**
- Phase 6 backlog; replace placeholder sidebar sections ("Top 10 by Daily Interest/Fans") once analytics exist; CDN/Front Door for images.

**How to use:** when a gate is met, tick it here with the date and link to evidence (PR, run, document). The verdict above changes to READY only when every blocker is ticked.

### Work Register

Open implementation items with their `TODO-n` tags (search this file for a tag). Gate IDs show which release gate each item unblocks.

| Tag | Item | Gate |
|---|---|---|
| TODO-1 | ✅ Set GitHub production variables `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, and `VITE_API_URL` to the live URLs below. Remaining: verify sitemap/robots use the public production host | G-02 |
| TODO-2 | ✅ API, web, and admin deployed by `.github/workflows/deploy.yml`; production endpoints returned HTTP 200 on 2026-10-19; operator confirmed database/storage connectivity and Facebook sign-in on 2026-10-20. Remaining: detailed browser-level catalog and admin workflow checks | G-01, G-05 |
| TODO-3 | ✅ OIDC pipeline setup, deployment, and HTTP smoke checks completed 2026-10-19 (run #39211828423). Migrations remain out of the pipeline; the API applies them at startup in every environment, while the legacy `Database:MigrateOnStartup` setting controls only development seeding | G-01, G-03 |
| TODO-4 | CI uses pnpm `version: 10`; the lockfile is version 9.0, which pnpm 10 reads, but confirm `pnpm install --frozen-lockfile` passes on the first CI run (local pnpm is 12.6) | G-04 |
| TODO-5 | HTTP output caching for `/api/bikes` and the Next.js caching/revalidation strategy | G-09 |
| TODO-6 | OpenGraph images, canonical URLs, JSON-LD structured data | |
| TODO-7 | Run CI on GitHub; re-run API tests locally with the API stopped (a running API locks the build output) | G-04 |

#### Production Deployment (updated 2026-10-19)

The first successful deployment ran on 2026-10-19 (run #39211828423). HTTP smoke checks on 2026-10-19 confirmed the following routes returned `200`:

| App/check | Production URL |
|---|---|
| Public web `/bikes` | <https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net/bikes> |
| Admin `/` | <https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net/> |
| API `/health` | <https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/health> |
| API `/health/ready` | <https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/health/ready> |

History of the first-deployment attempts, all on `master`:

| Run | Result | Cause and fix |
|---|---|---|
| 1 (`bfc999b`) | Failed at `azure/login` | `AZURE_CLIENT_ID`/`AZURE_TENANT_ID` were not set. Fix: environment secrets added |
| 2 (`d54d549`) | Deploy jobs skipped | Commit touched only README, plan, and `scripts/`, so change detection selected no app. Fix: `deploy.yml` now counts as a change for every app; each deploy job fails fast with a clear message when a required secret/variable is missing. Manual runs with `deploy_all` deploy everything |
| 3 (`bdbfc93`) | Failed at `azure/login` (`AADSTS700213`, no matching federated identity record) | GitHub issues immutable subject claims for this repository (`repo:ryanpaulcariaga@3658143/motorcycle@1352834212:environment:production`) but the credential used the legacy name-only subject. Fix: `scripts/setup-azure-oidc.ps1` now builds the immutable subject from `-OwnerId`/`-RepositoryId` and replaces a stale named credential |
| Later | ✅ Succeeded | Credential corrected, workflow rerun |

Lessons: compare the "Federated token details" in the failed `azure/login` log with the Entra federated credential (issuer, subject, audience must match exactly); the environment secrets only change when the app registration, tenant, or subscription changes; docs-only pushes do not deploy, so use **Run workflow** with `deploy_all` to redeploy everything.

HTTP smoke checks confirm reachability and API database readiness. The operator additionally confirmed database/storage connectivity and working Facebook sign-in on 2026-10-20. These checks do not replace the detailed browser acceptance still tracked in G-05; remaining deployment settings are in the README "Deploying to Azure" section.

- [x] **NS-1 One-time Azure and GitHub setup** (TODO-3, G-01): Entra app registration, federated credential, Website Contributor on `motorcycle-prod-rg`, GitHub `production` environment with secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and variables `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (TODO-1), `VITE_API_URL`. Done 2026-10-19.
- [ ] **NS-2 Confirm App Service runtimes and API settings** (TODO-2): API = .NET 10, web = Node 22, admin = Node 22 (needed for `pm2 serve`). Verify API production redirect URIs, CORS, and secret storage per README M1; working Facebook sign-in and DB/storage connectivity were operator-confirmed on 2026-10-20.
- [x] **NS-3 Verify production HTTP reachability** (TODO-2, TODO-3, G-01): ✅ `GET /health`, `/health/ready`, `/bikes`, and admin `/` returned HTTP 200 on 2026-10-19. Operator confirmed database/storage connectivity and Facebook sign-in on 2026-10-20. Detailed content/image/sitemap/admin workflow browser validation remains open under G-05.
- [x] **NS-4 Confirm pnpm lockfile compatibility** (TODO-4, G-04): ✅ `pnpm install --frozen-lockfile` passed in CI and in the deploy jobs (pnpm 10), 2026-10-19.
- [ ] **NS-5 Run API tests locally** (TODO-7, G-04): stop the running API and Visual Studio, then `dotnet test apps\api\Motorcycle.Api.slnx`. Never run in this session.

Tick each item with evidence (run link or date) and update the scorecard and gates when done.

Other open work: automated tests for image service/controller, spec metadata, bulk spec/grid, and compared-with tracking; Azure Blob upload acceptance validation with an authenticated admin; admin authorization and security hardening (G-07).

Resolved 2026-10-19: Serilog console logging and request logging; global ProblemDetails exception handler; `/health` and `/health/ready`; `sitemap.xml`, `robots.txt`, `not-found`, `loading`, and `error` pages in `apps/web`; `ci.yml`; single auto-deploy pipeline `deploy.yml` (push to `master`: CI then per-app deploy via Azure OIDC, replacing the placeholder `deploy-api/web/admin.yml`); `apps/web` switched to Next.js standalone output for App Service; lint errors in `apps/web/components/Header.tsx` fixed. Lookup endpoint caching (10 minutes) and Development-only Swagger already existed.

### Local Development Quick Reference

Local ports: API `https://localhost:7240` (single `https` launch profile), public web `https://localhost:3000` (custom HTTPS server `apps/web/server.mjs`), admin SPA `https://localhost:3001`. The API owns the admin callback `https://localhost:7240/api/admin/auth/facebook/callback`. Local API secrets use `dotnet user-secrets` on `apps/api/Motorcycle.Api` (`UserSecretsId: motorcycle-api-local`). Local access to the Azure PostgreSQL server needs your current public IP in its firewall rules or the API fails with "Failed to connect ... :5432". Stop a running API before `dotnet test` or `dotnet build` or DLLs are locked. Azure deployment steps are in [README.md](README.md#deploying-to-azure).

### Feature Log (implemented)

| # | Feature | Summary |
|---|---|---|
| 1 | Public catalog & comparison | Browse/search/filter bikes, detail page, N-bike compare with grouped specs (`/api/bikes`, `/api/bikes/{slug}`, `/api/bikes/compare`, `/api/spec-groups`, `/api/brands`, `/api/categories`). Compare tracking is limited to published bikes |
| 2 | Admin auth & roles | API-owned Facebook PKCE, HttpOnly session, active `AdminRole` policy; role CRUD under `/api/admin/admin-roles`. First administrator is bootstrapped with `dotnet run --project apps/api/Motorcycle.Api --launch-profile https -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>` (already done locally; do not rerun) |
| 3 | Brand / Category / BikeModel admin | CRUD with reference-protected deletes (`409 *_referenced`); BikeModel list has brand/category filters and sortable headers that persist when navigating to variants and back |
| 4 | Bike variant admin | CRUD, publish/unpublish, reviewed flag (`is_reviewed`), reassignment to another BikeModel (`PATCH /api/admin/bikes/{id}/model`), unique `(model_id, year, variant_name)`; delete blocked when images exist |
| 5 | Bike image management | API-owned Azure Blob upload/delete, ordering, primary image |
| 6 | Public user authentication | Facebook sign-in for `apps/web` via `/api/auth/*`; provider-agnostic `User`/`UserExternalLogin` with verified-email linking |
| 7 | Spec metadata admin | CRUD/reorder of `spec_groups`/`spec_definitions`, global unique code, transactional rename cascade, `409` on unsafe deletes/type changes |
| 8 | Bulk spec editing | Set one spec across many bikes (`/api/admin/bikes/spec-values`) and a multi-spec grid (`/api/admin/bikes/spec-grid`), all-or-nothing saves, filterable by brand/category/MSRP |
| 9 | Compared-bike recommendations | `bike_comparisons` pair counter (migration `AddBikeComparisons`), `GET /api/bikes/{slug}/compared-with`, "Often compared with" on bike detail |
| 10 | Azure production deployment | API, public web app, and admin SPA deployed to Azure App Service via GitHub Actions OIDC; production endpoints and API health/readiness checks returned HTTP 200 on 2026-10-19. API startup applies pending migrations in every environment; the legacy `Database:MigrateOnStartup` setting controls only Development seeding. Browser acceptance and release-readiness gates remain tracked separately |

API contracts live in `docs/api.md`, architecture in `docs/architecture.md`, schema in `docs/database.md`. API unit tests: `apps/api/Motorcycle.Api.Tests` (admin controller authorization, `AdminRoleService`, `BikeAdminService`). No frontend test runner yet.

### Non-Functional Requirements (targets to design and review against; none are verified yet)

**Responsive and mobile**
- Mobile-first for both apps. Verify at 360, 768, and 1280 px widths; no horizontal page scroll except intentional scrollable tables.
- Touch targets at least 44x44 px; sidebar collapses to a drawer below `md` (public app).
- Admin SPA: decide per page whether phone/tablet use is supported. Wide data screens (bike list, Bulk Spec Edit grid, spec grid) may be tablet/desktop-only, but must degrade to horizontal scroll with sticky identifying columns rather than break.
- Compare page: side-by-side cards for few bikes, scrollable table with sticky first column beyond the threshold; test with 2, 5, and 10+ bikes on a phone.
- Images: `next/image` with correct `sizes`, responsive gallery, explicit dimensions to prevent layout shift.

**Accessibility (target WCAG 2.2 AA)**
- Check text contrast on the gold/orange and dark-brown backgrounds and finalize the palette hex values.
- Visible focus states, full keyboard navigation (menus, drawer, compare picker, admin forms and grids), semantic landmarks and headings.
- Meaningful alt text for bike images; table headers/scopes for spec and compare tables; accessible announcements for async save/error states in the admin app.

**SEO and sharing (public app)**
- Per-bike metadata exists; `sitemap.xml` and `robots.txt` are implemented. Still open: OpenGraph/Twitter images, canonical URLs, and JSON-LD structured data (e.g. `Product`).
- Slug policy: slugs are immutable on edit; define redirects or `410`/`404` behavior for unpublished or deleted bikes.
- Custom error, loading, and not-found pages are implemented.

**Performance and scale**
- Budgets (initial targets): LCP under 2.5 s on mobile for `/bikes` and `/bikes/[slug]`; keep JS bundles small.
- Next.js caching/revalidation strategy for catalog pages; API output caching for lookup endpoints; enforce maximum page size and query limits.
- Review filter queries for N+1 and index use as the catalog grows (JSONB expression indexes per filterable spec).
- CDN/Front Door for images once traffic warrants it.

**Security**
- Rate limiting on public, auth, and upload endpoints.
- Security headers on all three apps (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protections).
- CSRF stance for cookie-authenticated admin writes (currently SameSite=Lax plus credentialed CORS to a fixed origin): document the reasoning or add anti-forgery tokens.
- Image uploads: enforce allowed types, size limits, and content sniffing; strip metadata; generate server-side names.
- Admin audit log (who changed what and when), since the admin API can hard-delete records.
- Plan an exit from Facebook as the admin identity provider (e.g. Entra ID) before production.
- Dependency and secret scanning in CI (Dependabot, secret scanning).

**Privacy and legal**
- Privacy policy and terms of use; cookie consent before analytics or advertising cookies are introduced.
- Public user data export/deletion process; Facebook app review and data-use requirements.
- Image licensing/attribution policy for catalog photos.

**Content and data**
- Define data sourcing and verification workflow, including what the `is_reviewed` flag means and who may publish.
- Decide units (metric/imperial), MSRP currency, and localization needs for the target market (Southeast Asia).

### Engineering Practices
- **Testing:** unit tests for Application services and filter strategies; integration tests against PostgreSQL for repositories and migrations; frontend tests for critical flows (e.g. Playwright for browse, filter, compare, and admin edit). Set a coverage target once the baseline is measured.
- **CI gates (implemented in `ci.yml`, not yet run on GitHub):** on each push/PR run `dotnet build`/`dotnet test`, `pnpm --filter web lint` and build, and admin typecheck/build. `.github/workflows/ci.yml` runs these gates (API build/test; web and admin lint and build).
- **Environments:** define local, staging, and production; consider App Service deployment slots. Use separate databases and storage per environment.
- **Migrations and seeding:** the API applies pending migrations on every startup in every environment; the deployment pipeline does not run them. The legacy `Database:MigrateOnStartup` setting controls only the Development startup seed (true by default in Development, false elsewhere). Production seed data is handled through admin APIs or the explicit seed command.
- **Dependencies:** keep pnpm and NuGet dependencies current; review Next.js 16 and .NET 10 upgrade notes when bumping.
- **Documentation discipline:** every shipped change updates the relevant `docs/` file and this plan's Feature Log, Work Register, Production Readiness Scorecard, and Release Gates (tick gates with evidence).

### Production Readiness

The readiness scorecard, release gates (G-01 to G-12), and work register are at the top of this document. Tick gates there as evidence is produced.

### Provisioned Azure Resources (as of 2026-09-22)

All resources live in resource group `motorcycle-prod-rg`, region **Southeast Asia**.

| Resource | Name | Notes |
|---|---|---|
| Storage Account | `motorcycleimagesprod` | StorageV2, Standard, LRS, Hot tier, public network access enabled, account-level anonymous blob access enabled |
| Blob container | `images` | Anonymous access level: **Blob (anonymous read access for blobs only)** |
| Key Vault | `motorcycle-prod-kv` | Azure RBAC permission model; secrets: `StorageConnectionString`, `PostgresConnectionString` |
| PostgreSQL Flexible Server | `motorcycle-prod-pg` | Burstable B1ms, PostgreSQL 16 (reports 18.6), admin login `motoadmin`, public access + "allow Azure services" enabled |
| PostgreSQL database | `motorcycle_db` | Created under `motorcycle-prod-pg` |
| App Service Plan | `motorcycle-prod-plan` | Linux, Basic B1 |
| API Web App | `motorcycle-api-prod` | `https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net`; system-assigned managed identity granted **Key Vault Secrets User** on `motorcycle-prod-kv`; production configuration needs admin/public Facebook credentials and callback URLs, frontend redirect URLs, and CORS origins (see root README M1) |
| Public web Web App | `motorcycle-web-prod` | `https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net` |
| Admin Web App | `motorcycle-admin-prod` | `https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net`; Facebook redirects to the API callback, not this SPA |

Key Vault references configured on `motorcycle-api-prod`:

```text
Storage__ConnectionString = @Microsoft.KeyVault(SecretUri=https://motorcycle-prod-kv.vault.azure.net/secrets/StorageConnectionString/)
ConnectionStrings__DefaultConnection = @Microsoft.KeyVault(SecretUri=https://motorcycle-prod-kv.vault.azure.net/secrets/PostgresConnectionString/)
```

GitHub's `production` environment variables `NEXT_PUBLIC_API_URL` and `VITE_API_URL` point at the API default domain above; `NEXT_PUBLIC_SITE_URL` points at the public web domain. These are build-time frontend settings, so changes require a frontend redeploy. The API's production settings include both frontend redirect URLs and CORS origins, plus admin and public Facebook callback URLs; the exact setting names and values are in root README M1. Both production Facebook callback URLs must also be registered in the Facebook app as documented in the API README. All three apps are deployed and their HTTP smoke checks passed on 2026-10-19; browser-based authentication and catalog acceptance still need verification.

Monorepo full-stack app: a public Next.js frontend (SSR/SEO) and private Vite React SPA (no SEO requirement), plus a shared ASP.NET Core Web API backend (Clean Architecture, EF Core, Strategy pattern for spec filtering), PostgreSQL (JSONB specs, schema versioned via EF Core Migrations), and Azure Blob Storage for images. The public experience supports browse/search/filter/compare bikes with grouped specs. The admin experience manages the catalog, motorcycle specifications, image assignments, and specification metadata through the same API. Future-proofing remains for AI pros/cons, annual surveys, analytics, voting/comments, dealer listings, and advertising.

**Decisions**
- Repo structure: **monorepo** — single `motorcycle-app` repo with `apps/web` (public Next.js frontend), `apps/admin` (private Vite React SPA), and `apps/api` (shared ASP.NET Core backend); `docs/` for shared architecture/database/API docs; `.github/workflows` for CI/CD pipelines targeting each deployable app.
- Auth: public catalog remains anonymous. The API uses Facebook Authorization Code + PKCE for admin sign-in and creates an encrypted HttpOnly session only after it verifies the active `AdminRole`. A stronger organization identity provider may replace Facebook before production deployment.
- Data entry: the admin site replaces manual SQL as the normal workflow for bikes, specifications, images, and metadata. Seed scripts remain for local bootstrap and repeatable test data.
- Dealer links: future dealer records are separate from manufacturer brands; a motorcycle may expose one or more approved dealer listings or contact links with clear source and availability information.
- Hosting: Azure App Service (Linux, one plan, three Web Apps: `api`, `web`, and `admin`). Azure Database for PostgreSQL – Flexible Server. Azure Storage Account (Blob) for images, served via **public read-only blob container**; the admin API uploads and assigns public image URLs while browser clients never receive storage credentials. Azure CDN/Front Door is deferred until traffic warrants it.
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
- Future items (design for, do not build now): AI-generated pros/cons for compared bikes; annual user surveys (preferred bike / owned bike + feedback); most-viewed bikes & most-searched specs/categories analytics; per-bike upvote/downvote + comments; dealer listings and links; and advertising for clearly labeled sponsored placements and relevant motorcycle campaigns. Add lightweight schema stubs now where low-cost, but no endpoints/UI.

**Steps**

### Phase 0 — Monorepo Initialization ✅ DONE
0. Set up `motorcycle-app` monorepo structure:
   - Create directories: `apps/web/`, `apps/api/`, `docs/`, `.github/workflows/`
   - Initialize root `package.json` with pnpm workspaces (targets `apps/*`)
   - Create `.gitignore` (Node, .NET, Python, OS files)
   - Create `README.md` (monorepo overview)
   - Create `.github/copilot-instructions.md` (AI development guidelines for full-stack feature work)
   - Create placeholder specs (since retired in favor of this document)
   - Create placeholder docs: `docs/architecture.md`, `docs/api.md`, `docs/database.md`
   - Create GitHub Actions workflow templates: `deploy-web.yml`, `deploy-api.yml` (since replaced by `.github/workflows/deploy.yml`)
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
10. ✅ DONE — Lookup endpoints (`spec-groups`/`brands`/`categories`) are cached in memory for 10 minutes; HTTP output caching for other endpoints is open.
11. ✅ DONE — CORS, Development-only Swagger, Serilog structured logging, request logging, and a global ProblemDetails exception handler.
12. ✅ DONE — `/health` (liveness) and `/health/ready` (database connectivity).

### Phase 3 — Frontend (Next.js + Tailwind CSS) ✅ DONE — *can start in parallel with Phase 2 once API contracts drafted (step 9)*
13. Scaffold `apps/web`: Next.js App Router, TypeScript, Tailwind CSS (mobile-first config), a data-fetching layer (typed API client) matching backend DTOs.
14. Configure Tailwind theme tokens for the color palette: `header` black bg/white text, `page` background gold/orange, `content`/card areas white background, `sidebar` dark brown, `button-default` brown with `:active`/pressed state turning black (plus gold/orange, black, dark grey as alternate button variants for different emphasis levels).
15. Build shared layout components mobile-first: `Header` (black bg, white text, top nav, collapses to mobile menu), `Sidebar` (dark brown, secondary nav links, becomes a drawer/hamburger panel below `md` breakpoint), `PageShell` (gold/orange page background wrapping a white-background central content area), `Button` (variant-driven brown/gold/black/dark-grey styles with active-state feedback).
16. Pages:
   - `/bikes` — list/search page: static filter sidebar (brand/category/year/price) + dynamic spec filter panel (range sliders for numeric, multiselect for enum) built from `/api/spec-groups`; server-rendered for SEO with client-side filter interactivity; responsive grid (1 col mobile → multi-col desktop).
   - `/bikes/[slug]` — detail page (GSMArena-style order): title first, then the image gallery beside highlighted top specs, then Compare/Pictures action links, then the full spec table grouped/ordered per settings, then a Reviews section (placeholder until user reviews ship); the same brand-filter sidebar as `/` and `/bikes` stays visible; "Compare" deep-links to `/compare?ids={bikeId}` so the current bike is pre-selected.
   - `/compare` — bike picker uses a debounced free-text search (`GET /api/bikes?search=`) instead of listing every bike, so it stays usable as the catalog grows; selected bikes render as removable chips, side-by-side cards for few bikes, auto-switch to scrollable comparison table past threshold; selection state lives in the `ids` URL query param (shareable links).
   - `/` home — GSMArena-inspired layout: a flush-left sidebar (Brands filter, Latest Devices, and placeholder "Top 10 by Daily Interest"/"Top 10 by Fans"/"Popular Comparisons" sections pending future view/vote/comparison analytics) beside a latest-bikes grid as the initial central display.
17. Image handling: `next/image` with a remote pattern pointing at the Azure Blob public container hostname.
18. Basic SEO metadata (per-bike titles/OG tags using bike name + primary image).
18a. Public user authentication: any active Facebook identity can sign in through the shared API's `/api/auth/*` endpoints (Authorization Code + PKCE, provider tokens never reach the browser), with no manual registration. The API stores a provider-agnostic `User`/`UserExternalLogin` model so a future Google (or other) sign-in method resolves to the same account when the provider reports a verified email matching an existing user; `apps/web`'s header shows a Facebook sign-in link or the signed-in user's name with a sign-out action.

### Phase 4 — Admin Catalog Management ✅ IMPLEMENTED LOCALLY
#### Stage 1 — Admin BikeModel MVP ✅ DONE (automated acceptance tests/hardening remain)
19. Scaffold `apps/admin` as a separate Vite React SPA with TypeScript and Tailwind CSS. Copy the established `apps/web` UI tokens, typography, layout conventions, and API-client approach into an administration-focused shell.
20. Add Facebook OAuth2 sign-in for the admin site and protected API requests. Keep public catalog endpoints anonymous and read-only; expose Stage 1 mutations under `/api/admin`.
21. Add typed `BikeModel` CRUD contracts, application services, repository operations, and protected endpoints for loading, adding, editing, and deleting rows in `bike_models`.
22. Prevent deletion of a `BikeModel` referenced by any `Bike` row. Return a clear conflict/error response and show an actionable message in the admin UI.
23. Build the Stage 1 admin UI: authenticated shell, BikeModel list, add/edit form, delete confirmation, loading/empty/error states, and responsive styling matching `apps/web`.

#### Stage 2 — Bike Variant CRUD & Publication ✅ DONE
24. Added CRUD for `bikes` (year/variant records) under protected `/api/admin/bikes`, including publish/unpublish toggling; edits to a published variant apply immediately without an unpublish step. Deletion is a hard delete, blocked with a conflict response when the variant has dependent `bike_images`. A new unique index on `(model_id, year, variant_name)` enforces variant identity. The admin UI adds a per-model variant list/form (`BikeManagement.tsx`) reachable from each BikeModel row.

#### Stage 3 — Bike Image Management ✅ IMPLEMENTED
25. Added API-owned Azure Blob upload/delete, protected image listing, ordering, primary-image selection, and admin UI management. Focused service/controller tests and authenticated Azure Blob acceptance validation remain.

#### Remaining Admin Work
26. ✅ DONE — CRUD for `spec_groups` and `spec_definitions`, including ordering, labels, data types, units, filter settings, group reassignment, and a transactional rename-cascade so renaming a spec's code updates every bike's stored value under that code in the same operation. Deleting a non-empty group, deleting a definition bikes still hold values for, or an incompatible `dataType` change are hard-blocked with a `409` conflict.
27. Finish admin authorization, frontend/security hardening, focused acceptance tests, and final release validation.
26a. ✅ IMPLEMENTED — admin "Bulk Spec Edit" page (`/admin/bulk-spec`): pick one specification and a required brand (optional category and MSRP range), then set that spec across many bikes in one all-or-nothing save via `GET`/`PUT /api/admin/bikes/spec-values`. Tests and browser validation remain.
26b. ✅ IMPLEMENTED — Bikes Bulk Edit is now reached from a link on the Bikes page (single Bikes entry in the sidebar), and gains Excel export/import: `GET /api/admin/bikes/export` (filtered `.xlsx` with Id, Brand, Model, Category, Variant Name, Year, MSRP Price, Published and one `Label [code]` column per spec, plus a Guide sheet) and `POST /api/admin/bikes/import` (multipart `.xlsx`, max 5 MB / 5000 rows). Blank Id inserts an unpublished bike; an existing Id updates details/specs (blank spec cell clears it). Validation (ids, brand/model lookup, year, price, number/boolean/text spec types, duplicate ids and variants) is all-or-nothing and returns every row error. Unit tests in `BikeImportServiceTests`; browser validation with a real Excel file remains.

### Phase 5 — Azure Production Deployment & Operations ✅ LIVE (readiness work remains)
28. ✅ Provisioned: Resource Group (`motorcycle-prod-rg`) → Azure Database for PostgreSQL Flexible Server (`motorcycle-prod-pg`, database `motorcycle_db`) → Azure Storage Account (`motorcycleimagesprod`, `images` Blob container, public read access for images) → Azure Key Vault (`motorcycle-prod-kv`, `StorageConnectionString` + `PostgresConnectionString` secrets) → App Service Plan (`motorcycle-prod-plan`, Linux) with three Web Apps (`motorcycle-api-prod`, `motorcycle-web-prod`, `motorcycle-admin-prod`); the API app has a system-assigned managed identity with **Key Vault Secrets User** and Key Vault references configured for both connection strings. See **Provisioned Azure Resources** above for exact names/URLs.
29. ✅ Implemented: GitHub Actions CI/CD in `.github/workflows/`; `deploy.yml` builds and deploys changed apps to their App Services using OIDC. The pipeline does not run migrations; the API applies pending migrations on startup, with an explicit `dotnet ef database update` procedure documented in the README for operators who need pre-deployment application.
30. ✅ Deployed: public web uses the Next.js standalone runtime, admin serves the Vite SPA, and the API runs on App Service. Production API, web, and admin URLs are listed in the README; API database readiness returned HTTP 200 in the 2026-10-19 smoke check.
31. Remaining: consider custom domains, confirm HTTPS-only and production Facebook OAuth settings, and complete browser-level release validation.

### Phase 6 — Future Backlog (not built now, tracked for later) ⏳ NOT STARTED (intentionally deferred)
32. AI-generated pros/cons for compared bikes (likely an async job hitting an LLM, cached per bike-set).
33. Annual survey feature (preferred bike / owned bike + feedback) using `survey_responses` stub table.
34. Analytics: most-viewed bikes, most-searched specs/categories, backed by `bike_views`/`spec_search_log` stub tables + a lightweight aggregation job/dashboard.
35. Upvote/downvote + comments per bike using `bike_votes`/`bike_comments` stub tables — will require introducing auth/session identity first.
36. Advertising foundation: define advertiser/campaign/creative/placement concepts, approval and expiration states, and a reporting model for impressions and clicks. Keep sponsored content separate from organic bike ranking and comparison calculations.
37. Advertising API and delivery: expose approved active placements through a cacheable, context-aware endpoint; support placement limits, category/brand targeting, frequency controls, and graceful no-ad responses.
38. Advertising UI: add responsive ad slots to agreed pages with visible `Sponsored` labeling, accessible fallbacks, privacy/consent handling where required, and no layout-breaking behavior when ads are blocked or unavailable.
39. Advertising operations and governance: build admin workflows for campaign review, creative moderation, budget/end-date controls, reporting, fraud monitoring, and advertiser disclosure. Evaluate direct sponsorships first; add an external ad network only after privacy, performance, and brand-safety review.
40. Dealer links: define dealer records and motorcycle-specific listings, including dealer name, location or service area, destination URL, listing status, last-verified timestamp, and optional pricing/availability. Keep dealer links moderated and separate from manufacturer brand data and organic bike ranking.
41. Dealer API and UI: expose approved links on bike detail pages through a cacheable endpoint or detail response, with clear external-link labeling, stale-link handling, and a no-listings state. Add admin workflows for verification, expiration, removal, and click reporting.

**Relevant files**
- **Root**: `package.json` (pnpm workspaces), `.gitignore`, `README.md`, `.github/copilot-instructions.md` (AI guidelines)
- **`apps/api/`** — ASP.NET Core Web API, Clean Architecture solution: `Motorcycle.Domain/`, `Motorcycle.Application/`, `Motorcycle.Infrastructure/` (contains `Migrations/`, `DbContext`, `Seed/`), `Motorcycle.Api/`; plus `Motorcycle.Api.sln` at the root of `apps/api/`
- **`apps/web/`** — public Next.js app with Tailwind CSS configured (theme tokens for the header/page/sidebar/content/button color palette)
- **`apps/admin/`** — private Vite React SPA with Stage 1 role/BikeModel management, Stage 2 Bike variant CRUD/publication management, Stage 3 image management, and spec-group/spec-definition metadata management; it consumes the shared API and never connects directly to the database or Blob Storage.
- **`docs/`** — shared architecture, API, and database documentation; updated as implementation progresses
- **`.github/workflows/`** — CI/CD pipelines for all deployable apps (path-triggered on commits to `apps/web/`, `apps/admin/`, and `apps/api/`)

**Verification**
1. `dotnet ef database update` applies all migrations cleanly against a fresh local/dev PostgreSQL instance, and re-running it is a no-op (idempotent); `dotnet ef migrations script` reviewed to confirm the raw-SQL index statements are included correctly.
2. Seed scripts produce a queryable set of bikes with correct spec alignment (manually verify a sample bike's spec table matches `spec_groups`/`spec_definitions` order).
3. `GET /api/bikes` supports combined static + dynamic spec filters (exercising each `ISpecFilterStrategy` implementation) and returns correct pagination.
4. `GET /api/bikes/compare?ids=...` returns a correctly grouped/ordered matrix for 2, 5, and 10+ bikes (to validate the UI's side-by-side → scrollable-table switch threshold).
5. Frontend `/bikes`, `/bikes/[slug]`, and `/compare` pages render against the live API in a local dev environment; image gallery loads from the Azure Blob container; verify layout/colors at mobile, tablet, and desktop breakpoints.
6. Stage 1 admin mutations reject unauthenticated and unauthorized requests; valid Facebook-authenticated administrator actions create, edit, and delete unreferenced BikeModels, while referenced BikeModel deletion returns a clear conflict without direct database access from the admin browser.
7. Stage 2 admin mutations: an administrator can create/edit a Bike variant under a BikeModel, publish/unpublish it (publishing enforces required year/variant-name, and public catalog/comparison responses immediately reflect the toggle), and delete it — deletion of a variant with dependent images returns `409 bike_referenced` without removing data.
8. Deployed App Services reachable over HTTPS; API connects to Azure Database for PostgreSQL and Blob Storage using Key Vault-sourced secrets (no secrets in App Service plain settings or source control).

**Further Considerations**
1. Category-specific spec sets (e.g., scooters vs. sportbikes needing different spec lists) aren't explicitly modeled — current design relies purely on per-bike JSONB flexibility (bikes just omit specs that don't apply). If you later want the *settings UI* to scope certain spec groups to certain categories, that's an additive change to `spec_definitions` (add optional `category_id` scoping) — flag if this matters for the admin site later.
2. Public blob container for images means anyone with a bike's blob URL can view it (fine for public marketing photos) — confirm no bike images should ever be private/unpublished-only; if unpublished bikes need hidden images, we'd need SAS tokens or a private container for those specific blobs.
3. Exact hex values for the black/gold-orange/dark-brown palette aren't specified yet — recommend finalizing a small design-token swatch (e.g., via Tailwind config) before Phase 3 UI work starts, so contrast/accessibility (WCAG AA text contrast on gold/orange backgrounds) can be checked early.
