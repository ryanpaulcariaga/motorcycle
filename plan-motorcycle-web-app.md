# Motorcycle App: Plan

Living document: **what is built and what is left to do.** Nothing else lives here.

- Architecture → [docs/architecture.md](docs/architecture.md) · API → [docs/api.md](docs/api.md) · Schema → [docs/database.md](docs/database.md)
- Design decisions, quality targets, acceptance checks → [docs/design-decisions.md](docs/design-decisions.md)
- Azure resources, URLs, local dev, deployment troubleshooting → [docs/operations.md](docs/operations.md)
- Deployment steps → [README](README.md#deploying-to-azure)

Legend: ✅ done · 🔄 started (note says what is left) · ⬜ not started

## Status

**LIVE IN AZURE; NOT YET READY FOR GENERAL PUBLIC PROMOTION** (2026-10-23). All three apps are deployed and healthy. The verdict becomes READY only when every blocker gate is ticked with evidence.

**Progress: 58 of 118 tasks done · 7 in progress · 53 not started.**

**Next up:** Configure the production legal operator/contact/jurisdiction values and complete the privacy, inquiry retention, log-retention, and backup-deletion review in T-112 before G-10 can be ticked. Verify the contact form and admin inbox with a test database and authenticated session under T-113. Verify ratings/comments, interest-profile, and account privacy controls in authenticated public browser sessions, and verify the analytics dashboard with an authenticated admin session. Finish T-85 image performance verification, then T-11 to T-15 (tests and CI), followed by production verification of the security baseline before G-07 can be ticked.

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
| F-01 | ✅ Public catalog: home discovery sections for the top 10 latest bikes, Most Viewed, Most Popular, and Popular Comparisons, plus a View all bikes link to browse and search with all brand, category, year, MSRP and engine displacement filters in a collapsed-by-default Advanced filters panel above results; collapsed sort controls with draggable ordered brand, category, model, variant, year, and price criteria and admin-style direction toggles; detail page; compact home and browse bike cards with gold hover borders and no hover shadow in one column through tablet widths and responsive desktop columns, with 24 bikes per browse page |
| F-02 | ✅ Compare N bikes with grouped specs; group, header, and value cells share one alignment; up to two in columns, three or more in rows on desktop and in side-by-side bike columns on phones; suggestions below the search field; bikes stay in the order added |
| F-03 | ✅ "Often compared with" on bike detail |
| F-04 | ✅ Public sign-in with Facebook |
| F-05 | ✅ Admin sign-in (Facebook PKCE), 12-hour sliding sessions with active-tab keepalive and explicit expiry handling, Bikes as the signed-in landing tab, and admin roles |
| F-06 | ✅ Admin: Brand, Category, BikeModel CRUD; model labels show assigned bike counts; Bike Models filters and ordered sorting stay above the grid instead of in the sidebar |
| F-07 | ✅ Admin: Bike variant CRUD, published control, move to another model, collapsible above-grid filters for brand/category/model/year/MSRP plus published/review/image state, and Bulk-style ordered multi-sort including review completion time; the main Bikes grid requires a brand and queries only that brand; model labels show assigned bike counts |
| F-08 | ✅ Admin: image upload, drag-and-drop ordering, primary image, file-signature validation |
| F-09 | ✅ Admin: spec group/definition management and drag-and-drop ordering |
| F-10 | ✅ Admin Bikes: one screen keeps individual variant actions, filters and ordered sorting alongside grid editing, displayed-bike review updates, Excel export, and Excel import for exactly the displayed variants |
| F-11 | ✅ API rate limiting |
| F-12 | ✅ Azure deployment via GitHub Actions OIDC |
| F-13 | ✅ Aligned look and tighter grids across web and admin; sidebars use a shared super-dark grey, while top-navigation and bike-detail controls use brown hover states, including the user-rating modal actions; account name and sign-out controls have consistent header spacing; bike variant headers match cell padding, the right-side bike actions stay fixed while the grid scrolls horizontally, and admin modal action icons match grid icon colors |
| F-16 | ✅ Responsive image variants with API upload processing, backfill, and size-aware public/admin use |
| F-17 | ✅ Public header bike search with live suggestions and searchable browse results; Browse Bikes has variant-only keyword and Include discontinued filters inside collapsed Advanced filters, detail links retain publication state, and MotoCompare links home |
| F-18 | ✅ Security baseline: proxy-aware rate limits, response headers, admin Origin validation, and mutation audit trail; audit log navigation highlights independently of Administrators |
| F-19 | ✅ SEO metadata: social sharing images, canonical URLs, and bike Product structured data |
| F-20 | ✅ Responsive public and admin layouts for mobile, tablet, and desktop; wide layouts keep 14rem sidebars and cap the body at its 1366px-desktop size while matching 1rem/1.5rem group spacing to the responsive sidebar/content gap and keeping home body headings aligned with sidebar title insets, bike-detail highlights always use one column, mobile account-menu rows and browse links are consistently right-aligned, sidebar sections expand independently, pages scroll to content, and the bulk-edit modal uses one vertical scroller with fixed title and actions |
| F-21 | ✅ Admin shared per-bike Draft/In Progress/Completed status with a recorded UTC completion timestamp, per-spec verifications and progress, and a dedicated one-click In Progress checkbox per bike; the Bikes-grid status picker lazily creates options only for the open record, matching the Brand picker, while populated specs drive automatic Completed status with manual override and toolbar labels clarify that updates and resets apply only to displayed bikes |
| F-22 | ✅ Public and admin display brand-prefixed model/variant names without repeating the brand |
| F-23 | ✅ Shared brand-navigation sidebar on public home, catalog, detail, comparison, and settings pages; all browse filters are in a collapsed-by-default Advanced filters panel with an active-filter count, compare-picker filters stay with the compare controls, and browse filter state is retained from results to bike details |
| F-24 | ✅ Opt-in aggregate interest analytics and protected admin dashboard; no analytics identifiers or raw search terms; preferences available through header settings |
| F-26 | ✅ Public and admin show the same branded browser compatibility notice when JavaScript, required capabilities, or framework startup is unavailable |
| F-28 | ✅ Public privacy and terms pages, global legal links, and authenticated JSON account export plus permanent cascade-backed account deletion from Settings |
| F-29 | ✅ Public contact form stores inquiries through the shared API; protected admin inbox supports read/unread state, an unread navigation count, reading, deleting, and in-app polling notifications, with no email notifications |
| F-30 | ✅ Admins can tag models or variants as test data, toggle variant test data directly from the Bikes grid, and configure test-bike visibility per administrator in the private Administrators tab; mapped administrators receive published production plus tagged test bikes through the same public UI and interactions only when enabled on their administrator role, including unpublished test bikes, while anonymous/normal users and opted-out administrators receive published production only |

## Features (planned)

| # | Feature |
|---|---|
| F-14 | Catalog data transparency and user-submitted correction reports |
| F-15 | Shareable comparisons and saved bikes/comparisons |
| F-25 | 🔄 Signed-in, separately opted-in interest profiles with deletion and 12-month retention; authenticated browser verification remains |
| F-27 | 🔄 Bike detail action-row rating summary, user-review dialog, "Most Popular" catalog ranking, and independent rating-free Comments with replies directly below specs; authenticated browser verification remains |

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
| T-16 | ⬜ | Public: `/bikes` search and filters | Verify all filters and sorting are collapsed by default, combined filters, ordered multi-field sorting, pagination, and brand-sidebar navigation | G-05 |
| T-17 | ⬜ | Public: bike detail page and image gallery | | G-05 |
| T-18 | ⬜ | Public: compare with 2, 5, and 10 bikes | Verify the two-column/three-or-more-row switch, phone side-by-side bike columns, and contained narrow-screen scrolling | G-05, G-08 |
| T-19 | ⬜ | Public: `sitemap.xml` and `robots.txt` use the production host | | G-05 |
| T-20 | ⬜ | Admin: BikeModel and variant create, edit, publish, delete | | G-05 |
| T-21 | ⬜ | Admin: image upload, ordering, primary image on production | Also covers production upload validation | G-05, G-07 |
| T-22 | ⬜ | Admin: spec group/definition management | | G-05 |
| T-23 | ⬜ | Admin: Bulk Spec Edit and spec grid | | G-05 |
| T-24 | ⬜ | Admin: Excel export and import with a real `.xlsx` file | | G-05 |
| T-113 | ⬜ | Verify contact form and admin inbox end to end | Check submission, validation, unauthorized access, pagination, reply link, read/unread changes, navigation count and deletion using a test database and authenticated admin session | G-05, G-07, G-10 |

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
| T-112 | ⬜ | Configure and approve production legal details before promotion | Set `LEGAL_OPERATOR_NAME`, `PRIVACY_CONTACT_EMAIL`, and `LEGAL_JURISDICTION`; review privacy/terms, inquiry retention and request handling, hosting logs, and backup/restore behavior for deletion obligations | G-10 |

### Quality before promotion

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-52 | ⬜ | Check gold/orange and dark-brown contrast; finalize palette | Both apps | G-08 |
| T-53 | ⬜ | Keyboard, focus, alt text, and table header audit | | G-08 |
| T-54 | ✅ | Verify public routes at 360, 768, and 1280 px | Local production build: home, browse, detail/gallery, and two-bike compare stayed within the viewport; tested mobile navigation, filters, and contained comparison scrolling | G-08 |
| T-55 | 🔄 | Verify admin workflows at 360, 768, and 1280 px | Mock-session checks covered navigation, brand table/form, and Bulk Spec grid with no page-level overflow; still verify image management in an authenticated workflow | G-08 |
| T-56 | ⬜ | Output caching for `/api/bikes` | | G-09 |
| T-57 | ⬜ | Next.js caching and revalidation for catalog pages | | G-09 |
| T-58 | ⬜ | Load test at 1000+ bikes | | G-09 |
| T-59 | ⬜ | Measure mobile LCP on `/bikes` and `/bikes/[slug]` | Target under 2.5 s | G-09 |
| T-60 | ⬜ | Azure budget | | G-12 |
| T-61 | ⬜ | Azure cost alerts | | G-12 |
| T-62 | ⬜ | Define success metrics (traffic, compare usage, catalog completeness) | Include catalog coverage, verified-data rate, search-to-detail visits, and compare usage; define how each is measured before adding engagement features | |
| T-63 | ⬜ | Define catalog data sourcing and verification | Revisit admin source URL entry; define trusted sources and public attribution policy | |
| T-64 | ⬜ | Define the review-status publishing workflow | Include how admins verify source data and handle user-submitted correction reports | |
| T-65 | ✅ | SEO: OpenGraph images | Generated site-wide OpenGraph/Twitter images; bike previews use the primary catalog image | |
| T-66 | ✅ | SEO: canonical URLs | Canonicals set for home, browse, compare, and bike detail; browse filters do not create duplicate canonicals | |
| T-67 | ✅ | SEO: JSON-LD structured data | Bike detail pages emit Product data with brand, category, images, and available scalar specs | |
| T-118 | ✅ | Cache public test-data access decisions | Memoize each authenticated request and cache the database permission decision for five seconds per user; role mutations and account deletion invalidate affected entries. Focused API tests pass | G-09 |

### Responsive design (public web and admin)

Keep the public and admin apps visually aligned while adapting their navigation and content layouts to mobile, tablet, and desktop. Preserve usable controls and avoid unintended page-level horizontal overflow; data-dense tables may use an intentional, contained horizontal scroll region where needed.

| # | Status | Task | Notes | Gate |
|---|---|---|---|---|
| T-92 | ✅ | Audit responsive behavior in both apps | Identified narrow header/search, early sidebar split, browse pagination overflow, admin table/grid overflow, and modal sizing issues; acceptance widths are 360, 768, and 1280 px | G-08 |
| T-93 | ✅ | Make the public header, navigation, and search responsive | Search moves to a full-width second row on phones; accessible menu drawer and responsive nav; verified at target widths | G-08 |
| T-94 | ✅ | Make public browse, detail, and compare layouts responsive | Sidebar stacks until desktop, cards/specs adapt, pagination wraps, image viewer fits mobile, and comparison tables scroll within their region; verified at target widths | G-08 |
| T-95 | ✅ | Make the admin shell and navigation responsive | Added a mobile navigation/filter disclosure, aligned 14rem desktop sidebar, and narrow-safe shell/header; mock-session checks show no page overflow at target widths | G-08 |
| T-96 | ✅ | Make admin forms, image management, and data grids responsive | Responsive panel/modal padding, stacked modal actions, wrapped image actions, contained tables, and a full-width internally scrollable Bulk Spec grid | G-08 |

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
| T-68 | 🔄 | Analytics: record bike views and spec searches | Opt-in bike, brand/category filter, comparison and zero-result aggregates verified in browser and isolated PostgreSQL; public spec-filter tracking remains. G-10 privacy review still required. |
| T-69 | 🔄 | Analytics: dashboard | Protected API and admin UI verified with unit tests and mocked browser data; authenticated end-to-end dashboard verification remains. |
| T-71 | ⬜ | Dealer links: records, moderation, API, UI | |
| T-72 | ⬜ | Advertising: placements, delivery, labeling, admin | |
| T-73 | 🔄 | Ratings and comments | Rating summary and User reviews button sit beside Compare; reviews use a modal, while independent discussion comments and single-level replies sit directly below full specs. APIs, migrations, ownership/edit/delete flows and tests pass; authenticated browser acceptance remains |
| T-74 | ⬜ | Annual survey | |
| T-75 | ⬜ | AI pros/cons for compared bikes | |
| T-76 | ⬜ | CDN or Front Door for images | |
| T-77 | ⬜ | Revisit this list and split any task that has grown too big | |
| T-86 | ⬜ | Show data source and last-verified date for key specs | Depends on the catalog sourcing and verification policy in T-63 and the publishing workflow in T-64 | |
| T-87 | ⬜ | Let users report incorrect or missing catalog data | Add a public correction-report flow and an admin review path; do not publish reports directly as catalog changes | |
| T-88 | ⬜ | Add shareable comparison URLs | Define and enforce a reasonable comparison size limit; preserve the selected bikes when the URL is shared | |
| T-89 | ⬜ | Let users save bikes and comparisons | Decide whether sign-in is required and how saved items behave across devices | |
| T-99 | 🔄 | Record structured user interest signals | API and web instrumentation implemented; focused tests, PostgreSQL and web build pass. Verify the signals with an authenticated public browser session. | |
| T-100 | 🔄 | Add user controls for interest profiles | Settings page and opt-in/withdrawal UI verified in a browser with mocked API; live authenticated end-to-end verification and G-10 privacy review remain. | |

### Done

| # | Task | Evidence |
|---|---|---|
| T-119 | ✅ Require an admin Bikes brand before loading variants | The main Bikes screen opens with its required brand filter, requests only the selected brand through `/api/admin/bikes?brandId={id}`, preserves the brand while clearing optional filters, and keeps model-scoped views unchanged; focused API filtering coverage and admin/API builds pass |
| T-117 | ✅ Refine public browse keyword and publication filtering | Browse keyword matching is variant-only; Keyword and an Include discontinued checkbox live inside Advanced filters, default results remain published, checked results include both states, state persists through pagination and detail links, and unpublished details suppress published-only compare/review/comment actions. API visibility tests pass (5 focused tests); web lint and production build pass |
| T-116 | ✅ Add a visible keyword search option to public bike browsing | Browse has a keyword field with Search bikes and Clear keyword actions, preserves advanced filters and sorting, and uses the same anonymous search analytics flow; keywords now match variant names only. Web lint and production build pass |
| T-114 | ✅ Make Bikes the admin landing page | `/`, `/admin`, and `/admin/` render the Bikes variant screen and highlight Bikes after sign-in; explicit admin deep links remain unchanged. Admin build and lint pass |
| T-115 | ✅ Add test-data tags to bike models and variants | Added independent `is_test_data` columns and admin controls; model tags hide all variants and variant tags hide one row. Public test-data access requires the signed-in user's Facebook login to match an active Administrator role and includes real rating/comment flows. 135 API tests pass (2 PostgreSQL opt-in tests skipped), EF has no pending changes, and admin/web builds and lint pass (6 pre-existing admin warnings) |
| T-70 | ✅ Replace placeholder "Top 10" sidebar sections with real data | Public fan rankings use active-user ratings; daily interest uses the current UTC day's anonymous opt-in bike-view aggregates, published-bike filtering, count/ID tie-breaks, an API endpoint, and sidebar counts. 15 focused API tests, web lint and production build pass. |
| T-51 | ✅ Define and implement the user data export and deletion process | `GET /api/user/account/export`, `DELETE /api/user/account`, Settings controls, versioned JSON export, database-cascade deletion, session clearing, CSRF-origin checks, 3 passing focused tests, and an optional PostgreSQL cascade test |
| T-50 | ✅ Terms page | `/terms`, shared footer link, configurable operator/contact/jurisdiction, web lint and production build pass |
| T-49 | ✅ Privacy policy page | `/privacy`, shared footer link, configured data/consent/retention/deletion disclosures, web lint and production build pass |
| T-111 | ✅ Unify admin editing toolbars | Bikes supports single and displayed-bike grid editing, Excel export/import, and one unified UI with exact-ID protection. All admin CRUD tabs use shared readable Refresh/Add buttons with one color treatment, full-width on mobile and natural width on larger screens. 40 focused API tests, admin build and lint pass; authenticated browser acceptance remains under T-23/T-24 |
| T-110 | ✅ Track shared admin review progress | Draft/In Progress/Completed status, UTC completion timestamp, per-spec verification, list/grid/export filtering, bulk marking, and a lazily rendered Bikes-grid status list matching Brand; focused API tests and admin build pass. Authenticated browser acceptance remains under T-55 |
| T-109 | ✅ Replace browse sort direction dropdowns with toggles | Each sort level uses the admin-style A→Z/Z→A toggle; existing form serialization remains. Focused web lint and production build pass; browser acceptance remains under T-16 |
| T-108 | ✅ Add unsupported-browser fallback to both frontends | Capability tests, web lint/build and admin build pass; public nonce and admin production CSP/asset responses checked. Live browser verification unavailable; G-05 remains open |
| T-107 | ✅ Replace secondary sort control with ordered multi-field sorting | Sort is in a collapsed-by-default bordered box matching Advanced filters; add/remove/reorder supported fields for one or more criteria. API applies all criteria before paging. Focused API test covers three levels and paging; web ESLint/build pass |
| T-106 | ✅ Reduce browse sort controls and add an optional secondary sort | Compact inline primary sorting; secondary field/order controls are collapsed by default; API sorts before paging and preserves secondary sort in browse URLs. Focused service tests, API compile, web ESLint/build passed |
| T-105 | ✅ Collapse all browse filters by default | Brand, category, and range fields plus apply/clear actions are inside a collapsed-by-default panel; active count includes each filter type. Focused ESLint and production build pass; browser connection timed out |
| T-104 | ✅ Put catalog filters above browse results | Brand/category visible; advanced ranges collapsed by default with active count. Web lint/build; preserved combined filters, URL state, sorting, pagination, analytics, and brand-sidebar navigation |
| T-103 | ✅ Share filters across public pages and separate advanced controls | Web lint/build; headless browser verified filtering on home, browse, detail, compare and settings, state retention, divider and mobile layout |
| T-102 | ✅ Move browse filters into the sidebar and add sorting | Web lint/build; headless browser checked combined filters, model/year/price sorting in both directions, pagination, clearing, and mobile layout |
| T-101 | ✅ Keep advanced range filters aligned on desktop | Paired two-column layout; public web lint and production build pass |
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
| T-91 | ✅ Add shared sorting to Bulk Spec Edit | Draggable ordered multi-field sorting applies to both the grid and Excel export |
| T-97 | ✅ Remove redundant brand prefixes from bike and model display labels | Admin and web lint/build pass; separate brand data and Product JSON-LD brand remain intact |
| T-98 | ✅ Add consent-controlled user interest storage | Isolated PostgreSQL migration, active-user checks, 12-month retention, account isolation and concurrent withdrawal/ingestion tested; 27 focused tests pass |

## Session log

**2026-11-24** — Renamed the public home and shared catalog sidebar headings to "Most Viewed", "Most Popular", and "Popular Comparisons", and aligned the home body headings with the sidebar title inset.

**2026-11-24** — Matched the public home discovery groups and the public/admin sidebar section gaps to the responsive gap between sidebar and body: 1rem below desktop and 1.5rem from the desktop breakpoint upward. Focused web/admin lint and both production builds pass.

**2026-11-24** — Changed public bike-detail highlights to a single column at every viewport width. Focused web lint and the public production build pass.

**2026-11-24** — Refined the public home page into four separately surfaced discovery groups: Top 10 Latest Bikes, Top 10 by Daily Interest, Top 10 by Fans, and Top 10 Popular Comparisons. Home and the shared catalog sidebar reuse the same ranking data. Public and admin shells preserve 14rem sidebars, cap the complete layout at the 1366px desktop width, and use a matching 1.5rem sidebar/content gap and inner spacing. Focused web lint and the production build pass.

**2026-11-24** — Required a brand before the admin Bikes grid loads and added server-side brand filtering to the list endpoint, so the main screen sends only the selected brand while model-scoped admin views remain unchanged. Clear filters now preserves the required brand; a focused service test covers cross-brand exclusion.

**2026-11-24** — Changed the admin Bikes review-status control to a Brand-aligned lazy list: closed records no longer create repeated status option nodes, and only the selected record renders its three choices. The control closes on selection, outside interaction, or Escape and keeps the current status marked. The admin production build and focused lint pass; lint retains the component's existing `useEffect` dependency warning.

**2026-11-24** — Fixed the admin Bikes grid action icons to the right edge during horizontal scrolling, with opaque header/row backgrounds and an edge shadow separating the frozen column from scrolling data. The admin production build and focused lint pass; lint retains the component's existing `useEffect` dependency warning.

**2026-11-24** — Changed the admin Bikes grid Data column to a label-free Test checkbox and made Year, Variant, MSRP, and Brand directly editable in the grid. Brand uses one lazily populated list only while a row dropdown is open, avoiding duplicated option nodes across records; changing it updates the bike model. Year/Variant/MSRP validate and save on blur or Enter, and model-inherited test-data state remains checked and disabled. Removed last-touched row tracking, memoized filtering/lookups, and capped live grid DOM to 100 bikes per page while keeping displayed-bike bulk actions scoped to all filtered records. Temporary focus highlighting is CSS-only, inline save locks use refs, and outside-click dropdown dismissal is deferred. The admin production build and focused lint pass, with the component's existing `useEffect` dependency warning.

**2026-11-24** — Optimized public test-data authorization for bike requests with same-request memoization and a five-second per-user memory cache, reducing repeated administrator-role database lookups across parallel or closely repeated client calls. Administrator-role mutations and account deletion invalidate affected cached decisions; 12 focused API tests pass.

**2026-11-23** — Refined public Browse Bikes so Keyword and the Include discontinued checkbox live inside collapsed Advanced filters. Keyword matches variant names only; checking Include discontinued includes both current and discontinued variants while unchecked results remain published-only. Publication state persists through pagination and detail navigation, and unpublished details hide compare/review/comment actions. Focused API tests, web lint, and the public production build pass.

**2026-11-23** — Limited public bike keyword searches to model and variant names, excluding brand-only matches, and updated the browse placeholder and API contract. Focused web lint, the public production build, and the changed Infrastructure build pass; the full API build was not rerun because the active local API process held output DLLs.

**2026-11-23** — Added a persisted, default-off View test bikes control to each administrator role in the private Administrators tab. The API checks that role setting for catalog, comparison, ranking, review, and comment access, keeping the public Settings page unchanged. The EF migration was generated; API tests, web/admin builds and lint pass.

**2026-11-23** — Added a visible keyword search field above the public browse filters, with Search bikes and Clear keyword actions. Keyword state is preserved alongside advanced filters and sorting, browse submissions participate in anonymous search analytics, and the header search now shows a discoverable placeholder. Public web ESLint and the production build pass.

**2026-11-23** — Added independent test-data tags for bike models and variants. Admins can set and see the tags in model/variant editing and filters. Tagged records stay out of anonymous/normal-user catalog, comparison, ranking, analytics, review, comment and interest paths. A public user gains access only when their linked Facebook provider ID matches an active Administrator role, including real rating/comment operations and credentialed test-detail previews. The EF migration was generated; 135 API tests pass (2 opt-in PostgreSQL tests skipped), EF has no pending changes, admin/web builds pass, web lint is clean, and admin lint retains 6 pre-existing warnings.

**2026-11-23** — Expanded and aligned the displayed-bike review actions: the grid and bulk-edit workflow use "Set displayed to 'Draft'", "Set displayed to 'In Progress'", and "Set displayed to 'Completed'"; bulk-edit status changes remain staged until save.

**2026-11-23** — Hid the Review completed timestamp from the admin Bikes grid and added Review completed as an ordered sort option, while preserving the Review status column and controls. The admin production build and focused lint passed; lint retains the existing `useEffect` dependency warning.

**2026-11-23** — Changed public bike-detail highlights to one column on mobile and two columns from the small breakpoint onward. Focused web lint and production build passed.

**2026-11-23** — Changed the shared public and admin sidebar palette from dark brown to dark grey (`#282828`) while preserving the matching section layout and contrast.

**2026-11-23** — Added a dedicated In Progress checkbox column to the admin Bikes grid. Checking a row sets only that bike to In Progress; unchecking returns it to Draft, using the same API path that clears the completion timestamp when leaving Completed.

**2026-11-23** — Renamed bike review states to Draft, In Progress, and Completed, and added a persisted UTC `review_completed_at` timestamp. Entering Completed records the time, leaving or resetting Completed clears it, old statuses are migrated with historical completion times backfilled from `updated_at`, and the admin Bikes list displays the completion date/time. All 131 active API tests pass (2 optional PostgreSQL tests skipped), the EF snapshot has no pending model changes, and the admin build/lint pass with six existing warnings.

**2026-11-23** — Added single-level replies to public bike comments. Signed-in riders can open an inline reply form on a specific comment, and replies remain grouped beneath it with the same owner edit/delete controls. Simplified the discussion heading to "Comments", removed redundant explanatory copy, and updated the comment prompt to "Ask a question or share information." Four focused API comment tests, web lint, and the web production build pass; authenticated browser acceptance remains.

**2026-11-23** — Fixed the desktop admin account header so the display name has the same full-height horizontal padding as the public header. The sign-out hover background now starts after the name instead of touching it. Focused admin ESLint and the admin production build passed.

**2026-11-23** — Upgraded the public and admin browser fallback from a basic notice to the same branded, accessible recovery UI. The standalone capability check now waits for React to mount before revealing either application, so blocked or failed framework bundles keep showing recovery guidance instead of a blank screen. Four focused compatibility tests, web lint/build, and admin lint/build passed (the admin retains six unrelated lint warnings); a rendered 360px fallback check confirmed visible guidance, action visibility, and no horizontal overflow.

**2026-11-23** — Reworked admin session continuity: the API now defaults to a configurable 12-hour sliding cookie, the visible admin tab refreshes the session every five minutes and on return from a hidden tab, and an actual expiry presents a clear re-authentication prompt instead of silently navigating away. Updated the auth architecture/API/operations documentation. The API build passed, all 130 active API tests passed (2 optional PostgreSQL tests skipped), and the admin production build and lint passed with only the six existing warnings.

**2026-11-23** — Aligned the one- and two-bike comparison group headers with the Spec header and specification values by applying the same horizontal table-cell padding on mobile and desktop. Focused web lint and production build passed.

**2026-11-23** — Aligned the public mobile account name and sign-out rows with Browse Bikes and Compare, matching the working admin hamburger menu. The fix right-justifies stacked account-row flex content without changing the desktop header.

**2026-11-24** — Added persisted read/unread state to contact inquiries, protected PATCH controls, unread totals in the inbox contract, unread message styling, and an admin navigation badge refreshed every 30 seconds and when the tab becomes visible. Generated the `AddContactInquiryReadState` migration and updated API/schema docs. Eight focused contact inquiry tests and the admin production build pass; admin lint has only the five existing unrelated warnings. Authenticated browser and PostgreSQL end-to-end checks remain under T-113.

**2026-11-23** — Fixed modal scrolling across admin and web: bulk edit, Excel import errors, public user reviews, and the image viewer now avoid nested vertical scrollers; modal titles and actions stay accessible while content scrolls. Added the single-vertical-scroller pattern to the repository's always-on modal convention for all future modal creation and updates. Bulk edit passed a 390x844 mocked browser check. Admin and web builds passed, and lint passed with only the admin's existing warnings.

Newest first. Added at "update the plan for our progress"; read when asked "what should we do next".

**2026-11-22** — Clarified the Bikes bulk review actions as "Set displayed to 'In review'" and "Reset displayed to 'Not reviewed'" so their filtered-list scope is explicit before confirmation.

**2026-11-22** — Added a View all bikes link beside the Latest Bikes heading so the home preview opens the existing Browse Bikes filters, sorting, search, and pagination workflow without duplicating those controls.

**2026-11-22** — Increased the Latest Bikes home listing from 12 to 24 bikes and made home and Browse Bikes share one catalog page-size constant so the displayed counts remain aligned. Focused web lint and the production build passed.

**2026-11-22** — Made Bikes the default admin landing screen after Facebook sign-in. The `/`, `/admin`, and `/admin/` routes now render and highlight Bikes while existing deep links and expired-session return navigation remain unchanged. Admin production build and lint passed.

**2026-11-22** — Added the public "Top 10 by Daily Interest" sidebar from current-UTC-day anonymous opt-in `bike_view` aggregates. The API ranks only published bikes by view count, then bike ID, and the web sidebar shows each rank, today's view count and a no-activity state without exposing private per-user interest profiles. Fifteen focused API tests, web lint, and the production web build pass.

**2026-11-22** — Added the public "Top 10 by Fans" sidebar from active signed-in user ratings. The API returns published bikes ordered by fan count, then average rating and bike ID; the web sidebar shows rank, fan count, and average with a no-ratings state. Successful saves and removals refresh server-rendered catalog data so the ranking updates immediately. Three focused API tests, web lint, and the production web build pass. Daily-interest ranking remains under T-70.

**2026-11-22** — Added an anonymous contact form, API/database migration, and active-administrator inbox with deletion. Eleven focused API/rate-limit tests, both frontend builds and lint passed (six existing admin lint warnings); migration snapshot matches. Mocked public browser checks covered successful and failed submissions and 360px overflow. No email notification or automatic inquiry retention; authenticated browser and PostgreSQL end-to-end checks remain under T-113, and legal/retention review remains under T-112.

**2026-11-22** — Added public Privacy and Terms pages with shared footer links and deployment-time operator, contact, and jurisdiction settings. Settings now offers signed-in JSON account export and confirmed permanent account deletion; the API exports account, linked sign-in, interest, review, and comment data and deletes user-owned relational rows through existing cascades before clearing the session. Three focused API tests, web lint, and the production web build pass; the optional PostgreSQL cascade test is present but skipped without its dedicated test database. G-10 remains open under T-112 for production legal details, hosting-log retention, and backup/deletion review.

**2026-11-22** — Added a Bikes-screen action that marks every currently displayed variant In review in one atomic update while preserving spec verifications. The action confirms the bulk status change, refreshes the filtered grid, and reports the updated count; admin production build and focused lint passed (one pre-existing hook dependency warning remains).

**2026-11-22** — Moved ratings/reviews out of the bike-detail page body into a User reviews dialog opened beside Compare. The action row displays the current average and rating count; rating-free discussion comments remain directly below Full Specifications. API tests, web lint/build and migration checks passed; authenticated browser acceptance remains.

**2026-11-22** — Added signed-in bike ratings and optional reviews: one 1–5 review per user and bike, edit/delete ownership, public aggregate/list display, rate limiting, CSRF request-header protection, and concurrency-safe PostgreSQL upserts. Added the migration, 4 focused API tests, docs, and public web UI; API tests, web lint, and the production build pass. Authenticated browser acceptance remains.

**2026-11-22** — Moved Bike Models brand/category filters and ordered sorting from the admin sidebar into collapsed controls above the models grid, matching the Bikes screen. Unified single and bulk bike administration on the Bikes screen. Current filters and sorting now drive spreadsheet editing and Excel export for only the displayed variants, with Excel import available in the same UI; the old bulk URL renders the unified screen. Shared toolbar components now give Bikes, Bike Models, Specifications, Brands, Categories, Administrators, and Audit the same readable Refresh/Add treatment: full-width stacked actions on mobile and natural-width wrapping buttons on larger screens. Added exact bike-ID filtering to the API, with 40 focused API tests, admin production build and lint passing (six unrelated lint warnings remain). Authenticated browser acceptance remains under T-23 and T-24.

**2026-11-22** — Expanded Bulk Spec Edit and standardized admin bike controls: Single Edit filters and Bulk-style sorting now live in collapsed panels above results. Both use active filter counts and ordered sort controls with drag handles, field changes, directions, removal, and add-level actions. Bulk grid/Excel share inclusive year/displacement filters and ordered sorts. 38 focused API tests, the admin production build, and admin lint passed (lint retains six unrelated warnings). Browser acceptance remains under T-23 and T-24.

**2026-11-22** — Changed public bike-card hover styling from a raised shadow to a gold border. Focused web lint and the public web production build passed; admin styling remains unchanged.

**2026-11-21** — Added shared per-bike review status and bulk review tracking while preserving per-spec verification; consolidated status storage into one column. Focused API tests, admin build and migration snapshot check passed; authenticated browser verification remains under T-55.

**2026-11-15** — Replaced browse sort direction dropdowns with admin-style A→Z/Z→A toggles for each sort level. Focused web lint and build passed; browser connection timed out, so T-16 acceptance remains.

**2026-11-15** — Added an early compatibility notice to both apps for missing browser capabilities or unavailable JavaScript. Capability tests, web lint/build, admin build, and CSP/asset response checks passed. Browser connection timed out; G-05 browser acceptance remains open.

**2026-11-15** — Kept public home and browse bike cards in one column through tablet widths, including the 768px iPad Mini viewport; 2 columns start at `lg` and 3 at `xl`. Focused ESLint and the public production build passed; browser verification was unavailable because the shared browser connection timed out.

**2026-11-15** — Removed position dropdowns from shared reorder controls. Both frontend builds passed; public pointer, touch, and keyboard drag and admin group/definition drag with mocked API responses passed browser checks. No non-drag single-pointer alternative remains; G-08 accessibility review is still open.

**2026-11-15** — Removed move up/down buttons from public and admin reorder controls; position selectors provide a non-drag alternative. Both frontend builds and focused lint passed; browser checks covered public keyboard/position ordering and admin position ordering with mocked API responses. Authenticated admin verification remains.

**2026-11-15** — Added shared drag handles to public sort levels and admin sort levels, spec groups/definitions, and bike images; existing move buttons remain. Isolated browser checks covered public pointer, keyboard, touch and URL submission, plus admin ordering with mocked API responses. Authenticated admin end-to-end acceptance remains under T-55.

**2026-11-15** — Replaced the crowded secondary-sort controls with a collapsed bordered box matching Advanced filters and ordered add/remove/reorder sort levels for brand, category, model, variant, year, and price. Added serialized URL/API criteria while retaining compatibility with earlier sort parameters. Focused API tests, web ESLint/build pass; browser verification timed out.

**2026-11-15** — Reduced browse sort crowding with a compact inline primary sort and optional collapsed secondary sort; secondary sort is applied before pagination, with independent direction and browse/detail URL retention. Focused service tests, API compile, web ESLint/build passed. T-16 browser acceptance remains.

**2026-11-15** — Moved all `/bikes` filters into the collapsed-by-default Advanced filters panel; active count now includes brand and category. Focused ESLint and the public web production build passed. Browser verification was unavailable because the shared browser connection timed out; T-16 acceptance remains.

**2026-11-15** — Moved advanced catalog filters from the shared sidebar to the top of Browse Bikes results. Compare-picker filters remain beside the compare controls; sidebar brand links remain available across public pages. Web lint/build passed; broader T-16 browser acceptance remains.

**2026-11-15** — Kept Brand and Category visible at the top of the browse filter panel and made advanced range filters collapsed by default with an active-range count. Web lint/build passed; broader T-16 browser acceptance remains.

**2026-11-15** — Shared the filter sidebar across all public pages and added a divider above advanced filters. Web lint/build and browser checks passed for submissions from each page, state retention, and mobile layout; broader T-16 acceptance remains.

**2026-11-15** — Moved Browse Bikes filters into the sidebar and added model, year, and price sorting. Web lint/build and headless browser checks passed for combined filters, sorting directions, pagination, clearing, mobile width, and home sidebar; broader T-16 acceptance remains.

**2026-11-15** — Fixed the public Bikes advanced filters so year, price, and displacement inputs stay paired in a responsive two-column desktop layout instead of leaving a full-width final field. Focused lint and the public web production build passed; broader T-16 browser acceptance remains.

**2026-11-15** — Implemented opt-in daily interest counters and admin dashboard, with 12-month retention and no analytics identifiers or raw search terms. Focused API tests, frontend builds, public browser checks, mocked dashboard rendering, and isolated PostgreSQL ingestion/concurrency/retention checks passed. Authenticated dashboard end-to-end verification, public spec-filter tracking, privacy policy and legal review remain. Existing comparison recommendation counters remain separate.

**2026-11-09** — Fixed mobile comparisons with 3+ bikes to show specs as rows and bikes side-by-side in a contained horizontal scroller; desktop 3+ and two-bike layouts are unchanged. Public web lint/build and a rendered three-bike check passed; T-18 browser acceptance remains.

**2026-11-09** — Removed duplicate brand prefixes from bike and model labels throughout admin and public web, including comparison labels, metadata, confirmations, accessibility text, and spec-grid messages. Admin and web lint/build passed; existing brand fields and structured brand metadata remain.

**2026-10-26** — Implemented responsive layouts for both apps (T-92 to T-96). Public home, browse, detail/gallery, and two-bike compare passed 360/768/1280 browser checks; fixed pagination overflow found during verification. Mock-session admin checks covered the shell, brand table/form, and Bulk Spec grid at target widths. T-55 remains in progress until image management is verified in an authenticated workflow; G-08 remains open.

**2026-10-26** — Added a responsive-design feature and implementation breakdown for both public web and admin (T-92 to T-96), and clarified responsive acceptance coverage (T-54/T-55). Plan only; no code changed.

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
