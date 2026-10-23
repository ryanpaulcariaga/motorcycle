# Design Decisions and Targets

Why the system is built the way it is, plus the quality targets reviewed against. Concrete architecture is in [architecture.md](architecture.md), schema in [database.md](database.md), API contracts in [api.md](api.md). What remains to be done is in [plan-motorcycle-web-app.md](../plan-motorcycle-web-app.md).

## Decisions

- **Monorepo:** `apps/web` (public Next.js), `apps/admin` (private Vite React SPA), `apps/api` (shared ASP.NET Core API), `docs/`, `.github/workflows`.
- **Auth:** the public catalog is anonymous. The API uses Facebook Authorization Code + PKCE for admin sign-in and creates an encrypted HttpOnly session only after verifying an active `AdminRole`. A stronger organization identity provider may replace Facebook later.
- **Data entry:** the admin site replaces manual SQL for bikes, specs, images, and metadata. Seed scripts remain for local bootstrap and repeatable test data.
- **Hosting:** Azure App Service (Linux, one plan, three Web Apps), Azure Database for PostgreSQL Flexible Server, Azure Blob Storage with a public read-only container for images (the API uploads; browsers never receive storage credentials). Azure CDN/Front Door is deferred until traffic warrants it.
- **Responsive image variants:** Keep the uploaded original for zoom and generate separate WebP variants sized by longest edge at 320, 640, 1280, and 2048 pixels. Never upscale; when the source is smaller than a size, that variant is written at the source's native size so all four variants always exist for accepted uploads. Require uploads to be 4:3 landscape (±2%) and at least 1200 pixels wide; the admin SPA crops to exactly 4:3 in the browser (drag and zoom, with cancel) before upload and the cropped image becomes the stored original, so every variant and the zoom view share the crop and match the 4:3 display slots. The 1280 and 2048 variants are always created; for smaller sources they are native-size WebP copies (never upscaled), and the page fallback to the original remains only for legacy images. Metadata is stripped from generated variants; nullable variant URLs plus original dimensions are exposed from the API. Existing images are handled by an explicit rerunnable backfill command (no ratio enforcement); undersized images keep only their original and need replacement. The uncropped source is not retained. This adds storage and upload CPU in exchange for smaller catalog image transfers.
- **Secrets:** Azure Key Vault referenced from App Service through managed identity.
- **Data access:** EF Core (Npgsql) over Dapper, so the schema stays in C# configuration in the repo. The Repository pattern in `Infrastructure` wraps the `DbContext`; `specs` is mapped as `jsonb` with a value comparer.
- **Strategy pattern for filtering:** `ISpecFilterStrategy` per `data_type` (number range, exact match, multi-select, boolean), resolved by factory/DI, so new filter types do not touch existing code.
- **Schema as code:** EF Core migrations only. Anything EF does not model (GIN/expression indexes, views) goes in `migrationBuilder.Sql(...)` inside the migration.
- **Spec model:** `spec_groups` → `spec_definitions`, each with `sort_order`. Bikes store a flat JSONB map `spec_code -> value`; rendering joins against definitions at request time so specs can be reordered or added without touching bike rows.
- **Dynamic filtering:** JSONB with a GIN index on `specs` plus expression indexes for specs flagged `is_filterable`, sized for 200–1000+ bikes per year.
- **Comparison UX:** unlimited bikes; side-by-side cards for a few, a scrollable table past a threshold (about 4–5), always ordered by group/definition.
- **CSS:** Tailwind CSS, mobile-first (`sm:`/`md:`/`lg:`); sidebar becomes a drawer below `md`.
- **Palette:** header black/white text; page gold/orange; content area white; sidebar dark brown; buttons brown, black when pressed (also gold/orange, black, dark grey for other emphasis). Tokens live in each app's stylesheet and must stay identical.
- **Dealer links (future):** separate from manufacturer brands; a bike may expose several approved, moderated dealer listings with source and availability.
- **Future items, design for but do not build:** AI pros/cons, annual survey, analytics, votes/comments, dealer listings, advertising. Stub tables `bike_views`, `spec_search_log`, `bike_votes`, `bike_comments`, `survey_responses` reserve the schema.

## Open design questions

1. Category-specific spec sets are not modeled; bikes simply omit specs that do not apply. Scoping spec groups to categories later is additive (optional `category_id` on `spec_definitions`).
2. The public blob container means anyone with an image URL can view it. If unpublished bikes need hidden images, use SAS tokens or a private container for those blobs.
3. Final hex values for the palette are not fixed; check WCAG AA contrast on gold/orange before finalizing.

## Non-functional targets (none verified yet)

**Responsive and mobile**
- Verify at 360, 768, and 1280 px; no horizontal page scroll except intentional scrollable tables; touch targets at least 44x44 px.
- Admin: decide per page whether phone/tablet is supported. Wide grids (bike list, Bulk Spec Edit, spec grid) may be tablet/desktop-only but must degrade to horizontal scroll with sticky identifying columns.
- Compare page: test with 2, 5, and 10+ bikes on a phone. Images use `next/image` with correct `sizes` and explicit dimensions.

**Accessibility (WCAG 2.2 AA)**
- Check contrast on gold/orange and dark-brown backgrounds; visible focus states; full keyboard navigation (menus, drawer, compare picker, admin forms and grids); semantic landmarks and headings.
- Alt text for bike images; table headers/scopes for spec and compare tables; accessible announcements for async save/error states in admin.

**SEO and sharing**
- Implemented: per-bike metadata, `sitemap.xml`, `robots.txt`, error/loading/not-found pages. Open: OpenGraph/Twitter images, canonical URLs, JSON-LD (`Product`).
- Slugs are immutable on edit; define redirect or `410`/`404` behavior for unpublished or deleted bikes.

**Performance**
- LCP under 2.5 s on mobile for `/bikes` and `/bikes/[slug]`; small JS bundles.
- Next.js caching/revalidation for catalog pages; API output caching for lookups (10 minutes today) and `/api/bikes`; enforce maximum page size and query limits.
- Review filter queries for N+1 and index use as the catalog grows (JSONB expression indexes per filterable spec). CDN/Front Door for images when traffic warrants.

**Security**
- Security headers on all three apps (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protections).
- CSRF stance for cookie-authenticated admin writes (currently SameSite=Lax plus credentialed CORS to a fixed origin): document the reasoning or add anti-forgery tokens.
- Image uploads: allowed types, size limits, content sniffing (done); still consider metadata stripping and server-side names.
- Admin audit log, since the admin API can hard-delete records; plan an exit from Facebook as admin identity provider (e.g. Entra ID); dependency and secret scanning in CI.

**Privacy and legal**
- Privacy policy and terms; cookie consent before analytics or advertising cookies; public user data export/deletion; Facebook app review and data-use requirements; image licensing/attribution policy.

**Content and data**
- Define sourcing and verification workflow, what `is_reviewed` means, and who may publish. Decide units (metric/imperial), MSRP currency, and localization for Southeast Asia.

## Engineering practices

- **Testing:** unit tests for Application services and filter strategies; integration tests against PostgreSQL for repositories and migrations; Playwright for critical frontend flows (browse, filter, compare, admin edit). Set a coverage target once the baseline is measured.
- **CI (`ci.yml`):** `dotnet build`/`dotnet test`, web lint and build, admin typecheck/build.
- **Environments:** define local, staging, production; consider deployment slots; separate databases and storage per environment.
- **Dependencies:** keep pnpm and NuGet packages current; review Next.js 16 and .NET 10 upgrade notes when bumping.
- **Documentation discipline:** every shipped change updates the relevant `docs/` file and the plan's Features, Task Board, and Release Gates.

## Acceptance checks

1. `dotnet ef database update` applies all migrations cleanly to a fresh database and re-running is a no-op; `dotnet ef migrations script` shows the raw-SQL indexes.
2. Seeded bikes show specs in `spec_groups`/`spec_definitions` order.
3. `GET /api/bikes` supports combined static and dynamic filters (each strategy) with correct pagination.
4. `GET /api/bikes/compare?ids=...` returns a correctly grouped and ordered matrix for 2, 5, and 10+ bikes.
5. `/bikes`, `/bikes/[slug]`, `/compare` render against the API; images load from Blob Storage; layout and colors hold at mobile, tablet, and desktop.
6. Admin mutations reject unauthenticated and unauthorized requests; referenced deletes return a conflict (`409 *_referenced`) without removing data.
7. Publishing a variant enforces required year/variant name and is reflected immediately in public catalog and compare responses.
8. Deployed apps are reachable over HTTPS; the API reaches PostgreSQL and Blob Storage through Key Vault-sourced secrets, with no secrets in plain App Service settings or source control.
