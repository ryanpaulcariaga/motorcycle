# Motorcycle App: Plan

Living document: **what is built and what is left to do.** Nothing else lives here.

- Architecture → [docs/architecture.md](docs/architecture.md) · API → [docs/api.md](docs/api.md) · Schema → [docs/database.md](docs/database.md)
- Design decisions, quality targets, acceptance checks → [docs/design-decisions.md](docs/design-decisions.md)
- Azure resources, URLs, local dev, deployment troubleshooting → [docs/operations.md](docs/operations.md)
- Deployment steps → [README](README.md#deploying-to-azure)

Legend: ✅ done · 🔄 started (note says what is left) · ⬜ not started

## Status

**LIVE IN AZURE; NOT YET READY FOR GENERAL PUBLIC PROMOTION** (2026-10-23). All three apps are deployed and healthy. The verdict becomes READY only when every blocker gate is ticked with evidence.

**Progress: 30 of 91 tasks done · 1 in progress · 60 not started.**

**Next up:** Finish T-85 image performance verification, then T-11 to T-15 (tests and CI), followed by production verification of the security baseline before G-07 can be ticked.

## Idea intake and triage

Use this section to capture new product features, UX improvements, functionality, technical investments, and research before they become planned work. Ideas are proposals, not commitments; they do not change progress counts or release readiness until accepted and added to the relevant section below.

| # | Status | Type | Idea / problem and expected value | Timing / priority | Related feature, task, or gate | Decision / next step |
|---|---|---|---|---|---|---|
| I-01 | Accepted | Product / data trust | Show when important catalog data was last verified and its source, and let users report incorrect or missing specs. Helps users judge reliability and gives admins actionable corrections. | After launch | F-14; T-63, T-64, T-86, T-87 | Planned for after launch; define source/verification fields and moderation workflow before implementation. |
| I-02 | Accepted | Product / comparison | Let users share a comparison by URL and save bikes or comparisons to revisit later. Makes the core comparison experience easier to share and return to. | After launch | F-15; T-88, T-89 | Planned for after launch; define URL limits and whether saved items require sign-in before implementation. |

No other proposals are currently recorded.

When adding an idea, give it the next `I-nn` ID and use **Proposed** status. During triage, decide whether to accept, defer, or reject it based on user value, urgency, effort, risks, dependencies, and alignment with the project. Record the rationale and next step in the final column. For technology or architecture proposals, include the problem the change solves and its trade-offs; record accepted design decisions in `docs/design-decisions.md`.

For an accepted idea, add any user-facing capability to **Features**, add actionable work to the appropriate **Tasks** section (and link its release gate if applicable), and update the proposal with those IDs. Keep deferred ideas here for reconsideration; retain rejected ideas with a brief reason so they are not repeatedly re-triaged. Move an idea out of this section only if it is fully represented elsewhere or no longer relevant.

## Features (built)

| # | Feature |
|---|---|
| F-01 | ✅ Public catalog: browse, search, filter, detail page |
| F-02 | ✅ Compare N bikes with grouped specs; suggestions below the search field; bikes stay in the order added |
| F-03 | ✅ "Often compared with" on bike detail |
| F-04 | ✅ Public sign-in with Facebook |
| F-05 | ✅ Admin sign-in (Facebook PKCE) and admin roles |
| F-06 | ✅ Admin: Brand, Category, BikeModel CRUD |
| F-07 | ✅ Admin: Bike variant CRUD, publish, reviewed flag, move to another model, image-presence filter |
| F-08 | ✅ Admin: image upload, ordering, primary image, file-signature validation |
| F-09 | ✅ Admin: spec group/definition management |
| F-10 | ✅ Admin: Bulk Spec Edit, editable motorcycle/year/MSRP grid fields, shared sorting, Excel export/import |
| F-11 | ✅ API rate limiting |
| F-12 | ✅ Azure deployment via GitHub Actions OIDC |
| F-13 | ✅ Aligned look and tighter grids across web and admin |
| F-16 | ✅ Responsive image variants with API upload processing, backfill, and size-aware public/admin use |
| F-17 | ✅ Public header bike search with live suggestions and searchable browse results |
| F-18 | ✅ Security baseline: proxy-aware rate limits, response headers, admin Origin validation, and mutation audit trail |
| F-19 | ✅ SEO metadata: social sharing images, canonical URLs, and bike Product structured data |

## Features (planned)

| # | Feature |
|---|---|
| F-14 | Catalog data transparency and user-submitted correction reports |
| F-15 | Shareable comparisons and saved bikes/comparisons |

## Release gates

Blockers before public promotion:
- [x] **G-01** Deployment and basic availability (2026-10-19, run #39211828423; DB, storage, Facebook sign-in confirmed 2026-10-20)
- [ ] **G-02** Production configuration · [ ] **G-03** Migration state reviewed · [ ] **G-04** CI green and core tests · [ ] **G-05** Browser acceptance
- [ ] **G-06** Monitoring · [ ] **G-07** Security baseline · [ ] **G-10** Privacy policy and terms · [ ] **G-11** Backups and rollback

Should pass before promotion: [ ] **G-08** Accessibility and responsive · [ ] **G-09** Performance · [ ] **G-12** Cost alerts

## Tasks

Each task is small enough to finish in one sitting. Update the row (and its gate) when its status changes. If a task is only partly done, mark 🔄 and write what is left in Notes.

### Tests and CI

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-11 | ⬜ | Open a pull request and confirm CI is green | CI passed inside the 2026-10-19 deploy run | G-04 |
| T-12 | ⬜ | Run the full API test suite locally | API and Visual Studio must be stopped | G-04 |
| T-13 | ⬜ | Add image controller tests | | G-04 |
| T-14 | ⬜ | Add spec metadata tests | | G-04 |
| T-15 | ⬜ | Add bulk spec edit tests | | G-04 |

### Browser acceptance

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-16 | ⬜ | Public: `/bikes` search and filters | | G-05 |
| T-17 | ⬜ | Public: bike detail page and image gallery | | G-05 |
| T-18 | ⬜ | Public: compare with 2, 5, and 10 bikes | | G-05 |
| T-19 | ⬜ | Public: `sitemap.xml` and `robots.txt` use the production host | | G-05 |
| T-20 | ⬜ | Admin: BikeModel and variant create, edit, publish, delete | | G-05 |
| T-21 | ⬜ | Admin: image upload, ordering, primary image on production | Also covers production upload validation | G-05, G-07 |
| T-22 | ⬜ | Admin: spec group/definition management | | G-05 |
| T-23 | ⬜ | Admin: Bulk Spec Edit and spec grid | | G-05 |
| T-24 | ⬜ | Admin: Excel export and import with a real `.xlsx` file | | G-05 |

### Security

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-25 | ✅ | Configure forwarded headers so rate limiting sees real client IPs | Production trusts one App Service ingress hop before rate limiting; verify the client IP after deployment | G-07 |
| T-26 | ✅ | Security headers on the API | CSP, HSTS (HTTPS only), nosniff, referrer, frame, and permissions headers; Swagger has a compatible CSP | G-07 |
| T-27 | ✅ | Security headers on the public web app | Per-response nonce CSP (inline style attributes retained for gallery zoom) and standard headers in Next.js Proxy; matched pages render dynamically, so recheck caching/LCP under T-57/T-59 | G-07 |
| T-28 | ✅ | Security headers on the admin SPA | Vite dev/preview headers and production Node static server headers; deployment uses the packaged server | G-07 |
| T-29 | ✅ | Document the CSRF stance for the cookie session | Unsafe `/api/admin` requests require an exact configured `Origin`; SameSite=Lax and CORS are defense-in-depth | G-07 |
| T-30 | ✅ | Audit log: entity, migration, and write on every admin mutation | EF interceptor and `admin_audit_logs` migration; stores actor/action/entity/field names, not values; tracked rename cascade audited | G-07 |
| T-31 | ✅ | Audit log: read endpoint and admin page | Protected paginated `GET /api/admin/audit-logs` and `/admin/audit` page | G-07 |
| T-32 | ✅ | Decide the admin identity-provider exit plan (e.g. Entra ID) | Entra ID OIDC with explicit provider-neutral subject mapping, no email auto-linking, and a verified transition window; implementation remains future work | G-07 |

### Production configuration

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-33 | ⬜ | Move the Facebook secret to a Key Vault reference | | G-02 |
| T-34 | ⬜ | Register production redirect URIs in the Facebook app | | G-02 |
| T-35 | ⬜ | Complete Meta app review and data-use requirements | | G-02 |
| T-36 | ⬜ | Verify production CORS origins | | G-02 |
| T-37 | ⬜ | Confirm HTTPS-only on all three Web Apps | | G-02 |
| T-38 | ⬜ | Decide on custom domains | | G-02 |
| T-39 | ⬜ | Confirm App Service runtimes (API .NET 10, web/admin Node 22) | | G-02 |
| T-40 | ⬜ | Review production migration state and startup migration behavior | | G-03 |

### Monitoring

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-41 | ⬜ | Add Application Insights to the API | | G-06 |
| T-42 | ⬜ | Add Application Insights to web and admin | | G-06 |
| T-43 | ⬜ | Alert rules for failures | | G-06 |
| T-44 | ⬜ | Uptime probe for `/health/ready` | | G-06 |

### Backup and recovery

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-45 | ⬜ | PostgreSQL backup retention | | G-11 |
| T-46 | ⬜ | Blob soft delete | | G-11 |
| T-47 | ⬜ | Test one restore | | G-11 |
| T-48 | ⬜ | Write the rollback runbook | Goes in `docs/operations.md` | G-11 |

### Privacy and legal

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-49 | ⬜ | Privacy policy page | None exists | G-10 |
| T-50 | ⬜ | Terms page | None exists | G-10 |
| T-51 | ⬜ | Define the user data export and deletion process | | G-10 |

### Quality before promotion

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-52 | ⬜ | Check gold/orange and dark-brown contrast; finalize palette | Both apps | G-08 |
| T-53 | ⬜ | Keyboard, focus, alt text, and table header audit | | G-08 |
| T-54 | ⬜ | Responsive check of the public site at 360, 768, 1280 px | | G-08 |
| T-55 | ⬜ | Responsive check of admin on tablet | | G-08 |
| T-56 | ⬜ | Output caching for `/api/bikes` | | G-09 |
| T-57 | ⬜ | Next.js caching and revalidation for catalog pages | | G-09 |
| T-58 | ⬜ | Load test at 1000+ bikes | | G-09 |
| T-59 | ⬜ | Measure mobile LCP on `/bikes` and `/bikes/[slug]` | Target under 2.5 s | G-09 |
| T-60 | ⬜ | Azure budget | | G-12 |
| T-61 | ⬜ | Azure cost alerts | | G-12 |
| T-62 | ⬜ | Define success metrics (traffic, compare usage, catalog completeness) | Include catalog coverage, verified-data rate, search-to-detail visits, and compare usage; define how each is measured before adding engagement features | |
| T-63 | ⬜ | Define catalog data sourcing and verification | Define trusted sources, source attribution, and when verification dates are updated | |
| T-64 | ⬜ | Define the `is_reviewed` publishing workflow | Include how admins verify source data and handle user-submitted correction reports | |
| T-65 | ✅ | SEO: OpenGraph images | Generated site-wide OpenGraph/Twitter images; bike previews use the primary catalog image | |
| T-66 | ✅ | SEO: canonical URLs | Canonicals set for home, browse, compare, and bike detail; browse filters do not create duplicate canonicals | |
| T-67 | ✅ | SEO: JSON-LD structured data | Bike detail pages emit Product data with brand, category, images, and available scalar specs | |

### Image sizes (responsive variants)

The API stores the uploaded original and generates smaller copies for the public catalog, so grids and thumbnails do not download full-size files. Resizing only goes down; admins must upload the largest, highest-quality picture they have.

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-78 | ✅ | Decide sizes and rules; record in `docs/design-decisions.md` | Long-edge sizes 320, 640, 1280, and 2048 px; WebP variants, never upscaled (larger sizes are native-size copies so all four always exist), 1200 px minimum, original retained for zoom | G-09 |
| T-79 | ✅ | Minimum upload size validation (API) | API rejects images narrower than 1200 px or outside 4:3 (±2%); admin crops to 4:3 (drag/zoom/cancel via `react-easy-crop`, `ImageCropper.tsx`) before upload. Covered by `BikeImageAdminServiceTests.cs` | G-09 |
| T-80 | ✅ | Generate and store variants on upload (API) | Infrastructure processor creates separate WebP blobs; upload failures clean up stored blobs and image deletion removes all variants | G-09 |
| T-81 | ✅ | Schema and DTO changes | Migration records variant URLs and source dimensions; API DTOs and both frontend TypeScript contracts updated; docs updated | G-09 |
| T-82 | ✅ | Backfill existing images | `dotnet run --project apps/api/Motorcycle.Api -- images backfill-variants`; low-resolution images stay original-only and are flagged in admin | G-09 |
| T-83 | ✅ | Use the right size in the public web app | Cards/compare use small or medium, detail uses large, zoom uses xl/original; `sizes` provided and existing remote patterns cover Blob Storage | G-09 |
| T-84 | ✅ | Admin upload guidance and preview | Guidance, pre-upload size check, source dimensions, and available variants are displayed; admin thumbnails prefer small | G-09 |
| T-85 | 🔄 | Verify the gain | Variants are implemented; production before/after image-byte comparison and mobile LCP measurement on `/bikes` remain | G-09 |

### After launch

| # | Status | Task | Notes |
|---|---|---|---|
| T-68 | ⬜ | Analytics: record bike views and spec searches | |
| T-69 | ⬜ | Analytics: dashboard | |
| T-70 | ⬜ | Replace placeholder "Top 10" sidebar sections with real data | Needs T-68 |
| T-71 | ⬜ | Dealer links: records, moderation, API, UI | |
| T-72 | ⬜ | Advertising: placements, delivery, labeling, admin | |
| T-73 | ⬜ | Votes and comments | Needs public user identity |
| T-74 | ⬜ | Annual survey | |
| T-75 | ⬜ | AI pros/cons for compared bikes | |
| T-76 | ⬜ | CDN or Front Door for images | |
| T-77 | ⬜ | Revisit this list and split any task that has grown too big | |
| T-86 | ⬜ | Show data source and last-verified date for key specs | Depends on the catalog sourcing and verification policy in T-63 and the publishing workflow in T-64 | |
| T-87 | ⬜ | Let users report incorrect or missing catalog data | Add a public correction-report flow and an admin review path; do not publish reports directly as catalog changes | |
| T-88 | ⬜ | Add shareable comparison URLs | Define and enforce a reasonable comparison size limit; preserve the selected bikes when the URL is shared | |
| T-89 | ⬜ | Let users save bikes and comparisons | Decide whether sign-in is required and how saved items behave across devices | |

### Done

| # | Task | Evidence |
|---|---|---|
| T-01 | ✅ Azure resources provisioned | |
| T-02 | ✅ OIDC deploy pipeline and first deploy | Run #39211828423, 2026-10-19 |
| T-03 | ✅ Production reachable; DB, storage, Facebook sign-in confirmed | 2026-10-19, 2026-10-20 |
| T-04 | ✅ Production URL variables set | |
| T-05 | ✅ pnpm lockfile works in CI | 2026-10-19 |
| T-06 | ✅ Sidebar and grid spacing aligned across web and admin | 2026-10-22 |
| T-07 | ✅ Logging, ProblemDetails, health endpoints, startup migrations | |
| T-08 | ✅ Rate limiting with tests | `RateLimitingTests.cs` |
| T-09 | ✅ Image upload limits and signature checks with tests | `BikeImageAdminServiceTests.cs` |
| T-10 | ✅ Admin authorization with tests | `AdminBikesControllerAuthorizationTests.cs` |
| T-90 | ✅ Public header bike search and submitted browse results | API-backed suggestions; web lint and production build pass |
| T-91 | ✅ Add shared sorting to Bulk Spec Edit | Main-page sort selection applies to both the grid and Excel export |

## Session log

Newest first. Added at "update the plan for our progress"; read when asked "what should we do next".

**2026-10-26** — Completed T-65 to T-67: added generated social preview images, canonical metadata for public routes, bike-specific OpenGraph/Twitter previews, and Product JSON-LD on bike detail pages.

**2026-10-25** — Made the Bulk Spec Edit grid support updating the motorcycle variant name, year, and MSRP together with specifications. Category remains read-only because it is shared by all variants of a BikeModel.

**2026-10-26** — Added the API/web/admin security baseline: trusted one-hop forwarding before rate limiting, security headers at each serving layer, strict Origin checks for cookie-authenticated admin mutations, and a transactional audit log with a protected endpoint and admin page. Documented the CSRF and Entra ID exit decisions; G-07 remains blocked on production verification.

**2026-10-25** — Added main-page sorting to Bulk Spec Edit; one selection orders both the on-screen grid and Excel export by motorcycle fields or specification values. The grid's Motorcycle column displays only the variant name, and non-editable identifying cells are shaded gray.

**2026-10-24** — Added compact icon-led bike search to the public header with live API-backed suggestions and submitted search results on `/bikes`; kept the header controls on one row at mobile widths, anchored desktop navigation to the right edge, and compacted search spacing with variant-only suggestion names. Fixed result-row sizing and text contrast, and prevented browser saved-form autocomplete from covering suggestions.

**2026-10-24** — Removed the redundant "Open image" link from admin image management and moved the Original download link after 2048.

**2026-10-23** — Implemented responsive image variants: API processing, schema/DTOs, backfill command, admin upload guidance, and public size selection. Production image-byte and mobile-LCP measurement remains (T-85).

**2026-10-23 (later)** — Added accepted post-launch plans for catalog data transparency/correction reports and shareable/saved comparisons. Clarified success metrics and catalog verification work; no code changed.

**2026-10-23 (later)** — Planned responsive image variants (small/medium/large/xl) and a minimum upload size: T-78 to T-85. Plan only; no code changed.

**2026-10-23** — Restructured the plan into small tasks; moved reference material to `docs/`. No product code changed.
- Left off at: nothing in progress.
- Suggested next: T-11 to T-15, then T-25 and T-26.
