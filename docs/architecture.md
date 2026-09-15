# Architecture

## Overview

Full-stack application with a public motorcycle catalog and a private administration site. The public site supports browsing, searching, filtering, and comparison; the admin site maintains catalog data through the shared API.

### Tech Stack

- **Frontend**: Next.js 16 (React, TypeScript, App Router, Tailwind CSS)
- **Admin frontend**: Next.js 16 application (React, TypeScript, App Router, Tailwind CSS)
- **Backend**: ASP.NET Core 10 (C#, Clean Architecture, EF Core)
- **Database**: PostgreSQL 14+ (JSONB specs, indexed for performance)
- **Storage**: Azure Blob Storage (public read-only for images)
- **Infrastructure**: Azure App Service (Linux), Key Vault, managed identity
- **Package Manager**: pnpm workspaces
- **CI/CD**: GitHub Actions

### System Design

```
Public browser                 Administrator browser
  ↓                              ↓
Next.js public app             Next.js admin app
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

`apps/admin/` is a separate private Next.js workspace, not a backend or a direct database client. Stage 1 copies the public `apps/web/` visual language and uses the same ASP.NET Core API through typed contracts. Facebook Authorization Code + PKCE authenticates administrators. The admin server stores an encrypted HttpOnly session and mints a short-lived RS256 first-party JWT; the API validates that JWT and resolves the active `AdminRole` by Facebook user ID before allowing `/api/admin` operations. Public catalog routes remain anonymous and read-only.

The first administrator is created through an operator-only bootstrap command after the `admin_roles` migration is applied. Subsequent administrator provisioning, activation, and deactivation happen through the protected role-management API.

Bike CRUD, image uploads, Azure Blob Storage access, and specification metadata are deferred admin stages. When implemented, those operations remain API-owned and the admin browser must never receive database or storage credentials.

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
6. **SEO-Ready**: Next.js server-rendering, metadata per page, structured data.

See [database.md](database.md) and [api.md](api.md) for detailed design.

### Catalog Model

The catalog separates a stable bike model line from its comparable variants. `BikeModel` owns the brand, category, and product-line name; `Bike` is the year/trim record selected for browsing and comparison. For example, `Ninja 400` is the model line and `2024 Standard` or `2024 SE` are variants. Variant-specific specs, MSRP, images, slug, and publication state stay on `Bike`. A year of `0` represents an unknown source year.
