# Architecture

## Overview

Full-stack application with a public motorcycle catalog and a private administration site. The public site supports browsing, searching, filtering, and comparison; the admin site maintains catalog data through the shared API.

### Tech Stack

- **Frontend**: Next.js 16 (React, TypeScript, App Router, Tailwind CSS)
- **Admin frontend**: Vite React single-page application (TypeScript, Tailwind CSS)
- **Backend**: ASP.NET Core 10 (C#, Clean Architecture, EF Core)
- **Database**: PostgreSQL 14+ (JSONB specs, indexed for performance)
- **Storage**: Azure Blob Storage (public read-only for images)
- **Infrastructure**: Azure App Service (Linux), Key Vault, managed identity

### Provisioned Azure Resources

Resource group `motorcycle-prod-rg` (Southeast Asia) currently contains:

- Storage Account `motorcycleimagesprod` with public `images` Blob container (anonymous read access for blobs only)
- Key Vault `motorcycle-prod-kv` (secrets: `StorageConnectionString`, `PostgresConnectionString`)
- PostgreSQL Flexible Server `motorcycle-prod-pg`, database `motorcycle_db`
- App Service Plan `motorcycle-prod-plan` (Linux, Basic B1)
- Web Apps `motorcycle-api-prod`, `motorcycle-web-prod`, `motorcycle-admin-prod`, each on the plan above

The API Web App's system-assigned managed identity holds the **Key Vault Secrets User** role on `motorcycle-prod-kv` and reads both connection strings via Key Vault references in its app settings. Set `ConnectionStrings__DefaultConnection` with the setting name in **Name** and only the reference in **Value**, for example `@Microsoft.KeyVault(SecretUri=https://motorcycle-prod-kv.vault.azure.net/secrets/PostgresConnectionString/)`; do not repeat the setting name inside the value. The secret holds a full Npgsql connection string, and `GET /health/ready` confirms connectivity. All three applications are deployed to Azure App Service. Smoke checks returned HTTP 200 for the public web `/bikes`, admin `/`, API `/health`, and API `/health/ready` on 2026-10-19:

- Public web: <https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net/>
- Admin: <https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net/>
- API: <https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/>

During development, the API uses `dotnet user-secrets` to connect to the provisioned Azure PostgreSQL and Blob Storage resources.

- **Package Manager**: pnpm workspaces
- **CI/CD**: GitHub Actions

### System Design

```
Public browser                 Administrator browser
  ↓                              ↓
Next.js public app             Vite React SPA
(apps/web/)                    (apps/admin/)
  └────────── HTTP API calls ──────────┘
                 ↓
        ASP.NET Core API (apps/api/)
        ├─ public read-only endpoints
        └─ protected admin write endpoints
  ↓ (EF Core + Npgsql)
PostgreSQL Database
  ↕ (image URL metadata in relational columns)
Azure Blob Storage (images served via public URL)
```

### Administration Boundary

`apps/admin/` is a separate Vite React SPA, not a backend or a direct database client. It copies the public `apps/web/` visual language and uses the same ASP.NET Core API through typed contracts. The API owns Facebook Authorization Code + PKCE, validates the callback, and creates a one-hour secure HttpOnly cookie session for an active `AdminRole`. Credentialed browser requests call `/api/admin` directly; the API reads the session identity and resolves the active role before allowing an operation. Facebook access tokens, PostgreSQL credentials, and Blob Storage credentials never reach the browser. Public catalog routes remain anonymous and read-only.

The first administrator is created through an operator-only bootstrap command after the `admin_roles` migration is applied. Subsequent administrator provisioning, activation, and deactivation happen through the protected role-management API.

Stage 2 adds Bike (year/trim variant) CRUD and publication management under `/api/admin/bikes`, so administrators can create, edit, publish/unpublish, and delete variants beneath an existing BikeModel; editing a published variant applies immediately without an unpublish step, and deletion is a hard delete blocked only when the variant has assigned images. Stage 3 adds API-owned Azure Blob upload, image assignment, ordering, primary-image selection, and deletion under `/api/admin/bikes/{bikeId}/images`; the admin browser never receives database or storage credentials.

Image processing runs in Infrastructure behind the Application `IImageProcessor` interface. Uploads must be 4:3 landscape (±2%) and at least 1200 pixels wide; the admin SPA crops in the browser before upload; the API creates metadata-stripped WebP copies with 320, 640, 1280, and 2048-pixel longest edges, capped at the source size (never upscaled) so all four always exist, while retaining the uploaded original for zoom. Variant URLs and source dimensions are stored on `bike_images` and exposed through the public and admin DTOs. Public pages select small variants for thumbnails, medium for cards/compare, large for the detail image, and xl, then large, then the original for zoom (a missing size falls back to the next smaller variant, then the original). Operators can run `dotnet run --project apps/api/Motorcycle.Api -- images backfill-variants` to process existing images; undersized images remain original-only and are flagged in admin.

Spec metadata management adds protected CRUD for `SpecGroup`/`SpecDefinition` under `/api/admin/spec-groups`/`/api/admin/spec-definitions`, including group/definition reordering. Because `SpecDefinition.Code` is the literal JSON key read from every `Bike.Specs` row, its uniqueness is enforced globally (not per-group), and renaming it triggers a transactional rename-cascade across every affected bike so no data is silently orphaned; deleting a group with definitions, deleting a definition bikes still hold values for, or changing a `dataType` incompatibly with existing bike values are all hard-blocked with a `409` conflict rather than silently discarding data.

Bulk single-spec editing lets an administrator set one specification across many bikes (optionally filtered by brand, category, and MSRP range) through `GET`/`PUT /api/admin/bikes/spec-values`; values are validated against the definition's `dataType` and saved all-or-nothing in one transaction, with no schema change.

### Public User Authentication Boundary

`apps/web` users sign in through the same shared API under `/api/auth`, using a session model that is architecturally identical to the admin one (OAuth Authorization Code + PKCE completed by the API, provider tokens never reaching the browser) but functionally separate: any active external identity may sign in — there is no manual allowlist or `AdminRole`-style approval step — and the session uses its own `UserAuth` cookie scheme (`mc_user_session`) and `AuthenticatedUser` authorization policy, distinct from `AdminAuth`/`ActiveAdministrator`.

Identity resolution is provider-agnostic by design so Facebook today and Google (or another provider) later resolve to the same person:

- `Motorcycle.Domain.User` is the durable account (`Id`, optional `Email`/`EmailVerified`, `DisplayName`, `IsActive`).
- `Motorcycle.Domain.UserExternalLogin` links a `User` to one provider identity, keyed uniquely by `(Provider, ProviderUserId)`.
- `Motorcycle.Application.Interfaces.IExternalAuthProvider` is a Strategy per provider (mirroring `ISpecFilterStrategy`) that builds the authorization URL and exchanges the code for a normalized `ExternalAuthProfile`; `IExternalAuthProviderFactory` resolves the right one by name. `FacebookExternalAuthProvider` (in `Motorcycle.Infrastructure/Auth/`) is the only implementation today — adding Google means adding one more class and its config, not changing the controller or linking logic.
- `IUserAuthService.FindOrCreateUserAsync` looks up the exact `(provider, providerUserId)` login first; if none exists, it only links to an existing `User` by email when the provider profile reports the email as verified, otherwise it creates a new `User`. This prevents an unverified email claim on one provider from taking over an account created through another provider.

Session claims carry the internal `User.Id` (not the provider's ID) in `sub`, so the session model never depends on which provider was used. Public catalog routes stay anonymous; authenticated-user routes will be layered on top of the `AuthenticatedUser` policy as future features (reviews, voting) require them.


### Future Advertising Boundary


Advertising is a post-MVP capability and must remain separate from the organic motorcycle catalog. A future advertising module should own advertisers, campaigns, creatives, placements, targeting, approval state, and delivery metrics. The application may provide contextual signals such as the current category or brand, but sponsored content must never alter organic search ordering, filters, or comparison results.

The first version should favor direct, reviewed sponsorships over an unvetted third-party network. Ad delivery should be cacheable and failure-tolerant: an unavailable or blocked ad must leave the surrounding page usable. Every sponsored placement needs an explicit disclosure, responsive rendering, accessibility support, and privacy/consent controls appropriate to its targeting and measurement model.

### Future Dealer Links Boundary

Dealer information should be modeled separately from `brands`: a brand identifies the motorcycle manufacturer, while a dealer is an external seller or service provider. A future dealer module should associate approved dealer listings with specific bikes and store the destination URL, geographic coverage, verification state, and expiration/last-verified information. Dealer links may be displayed on bike detail pages, but they must not affect organic bike ranking or comparison calculations.

### Key Principles

1. **Clean Architecture**: Backend layers (Domain → Application → Infrastructure → API) with unidirectional dependencies.
2. **Strategy Pattern**: Spec filtering logic extensible per data type.
3. **Database as Code**: EF Core migrations define schema in C#; all SQL visible in version control.
4. **Monorepo**: Single repo, shared backend with public and admin frontends, and shared docs.
5. **Mobile-First**: Tailwind CSS utilities, responsive breakpoints from ground up.
6. **Aligned Styling**: The admin and public web apps share the same look (header, sidebar, content area, spacing, colors, fonts, square corners). A style change requested for either app is always applied to both.
6. **SEO-Ready Public Catalog**: The public Next.js catalog uses server rendering, metadata, and structured data; the private admin SPA intentionally does not require SEO.

See [database.md](database.md) and [api.md](api.md) for detailed design.

### Catalog Model

The catalog separates a stable bike model line from its comparable variants. `BikeModel` owns the brand, category, and product-line name; `Bike` is the year/trim record selected for browsing and comparison. For example, `Ninja 400` is the model line and `2024 Standard` or `2024 SE` are variants. Variant-specific specs, MSRP, images, slug, and publication state stay on `Bike`. A year of `0` represents an unknown source year.
