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

The API Web App's system-assigned managed identity holds the **Key Vault Secrets User** role on `motorcycle-prod-kv` and reads both connection strings via Key Vault references in its app settings. Application code has not yet been deployed to any of the three Web Apps. During development, the API uses `dotnet user-secrets` to connect to the provisioned Azure PostgreSQL and Blob Storage resources.

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
  ↓ (image URLs stored in JSONB)
Azure Blob Storage (images served via public URL)
```

### Administration Boundary

`apps/admin/` is a separate Vite React SPA, not a backend or a direct database client. It copies the public `apps/web/` visual language and uses the same ASP.NET Core API through typed contracts. The API owns Facebook Authorization Code + PKCE, validates the callback, and creates a one-hour secure HttpOnly cookie session for an active `AdminRole`. Credentialed browser requests call `/api/admin` directly; the API reads the session identity and resolves the active role before allowing an operation. Facebook access tokens, PostgreSQL credentials, and Blob Storage credentials never reach the browser. Public catalog routes remain anonymous and read-only.

The first administrator is created through an operator-only bootstrap command after the `admin_roles` migration is applied. Subsequent administrator provisioning, activation, and deactivation happen through the protected role-management API.

Stage 2 adds Bike (year/trim variant) CRUD and publication management under `/api/admin/bikes`, so administrators can create, edit, publish/unpublish, and delete variants beneath an existing BikeModel; editing a published variant applies immediately without an unpublish step, and deletion is a hard delete blocked only when the variant has assigned images. Stage 3 adds API-owned Azure Blob upload, image assignment, ordering, primary-image selection, and deletion under `/api/admin/bikes/{bikeId}/images`; the admin browser never receives database or storage credentials.

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
4. **Monorepo**: Single repo, shared backend with public and admin frontends, and shared specs/docs.
5. **Mobile-First**: Tailwind CSS utilities, responsive breakpoints from ground up.
6. **SEO-Ready Public Catalog**: The public Next.js catalog uses server rendering, metadata, and structured data; the private admin SPA intentionally does not require SEO.

See [database.md](database.md) and [api.md](api.md) for detailed design.

### Catalog Model

The catalog separates a stable bike model line from its comparable variants. `BikeModel` owns the brand, category, and product-line name; `Bike` is the year/trim record selected for browsing and comparison. For example, `Ninja 400` is the model line and `2024 Standard` or `2024 SE` are variants. Variant-specific specs, MSRP, images, slug, and publication state stay on `Bike`. A year of `0` represents an unknown source year.
