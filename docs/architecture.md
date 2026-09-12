# Architecture

## Overview

Full-stack web application for browsing, searching, filtering, and comparing motorcycles.

### Tech Stack

- **Frontend**: Next.js 15 (React, TypeScript, App Router, Tailwind CSS)
- **Backend**: ASP.NET Core 8 (C#, Clean Architecture, EF Core)
- **Database**: PostgreSQL 14+ (JSONB specs, indexed for performance)
- **Storage**: Azure Blob Storage (public read-only for images)
- **Infrastructure**: Azure App Service (Linux), Key Vault, managed identity
- **Package Manager**: pnpm workspaces
- **CI/CD**: GitHub Actions

### System Design

```
Browser
  ↓
Next.js App (apps/web/)
  ↓ (HTTP API calls)
ASP.NET Core API (apps/api/)
  ↓ (EF Core + Npgsql)
PostgreSQL Database
  ↓ (image URLs stored in JSONB)
Azure Blob Storage (images served via public URL)
```

### Future Advertising Boundary

Advertising is a post-MVP capability and must remain separate from the organic motorcycle catalog. A future advertising module should own advertisers, campaigns, creatives, placements, targeting, approval state, and delivery metrics. The application may provide contextual signals such as the current category or brand, but sponsored content must never alter organic search ordering, filters, or comparison results.

The first version should favor direct, reviewed sponsorships over an unvetted third-party network. Ad delivery should be cacheable and failure-tolerant: an unavailable or blocked ad must leave the surrounding page usable. Every sponsored placement needs an explicit disclosure, responsive rendering, accessibility support, and privacy/consent controls appropriate to its targeting and measurement model.

### Future Dealer Links Boundary

Dealer information should be modeled separately from `brands`: a brand identifies the motorcycle manufacturer, while a dealer is an external seller or service provider. A future dealer module should associate approved dealer listings with specific bikes and store the destination URL, geographic coverage, verification state, and expiration/last-verified information. Dealer links may be displayed on bike detail pages, but they must not affect organic bike ranking or comparison calculations.

### Key Principles

1. **Clean Architecture**: Backend layers (Domain → Application → Infrastructure → API) with unidirectional dependencies.
2. **Strategy Pattern**: Spec filtering logic extensible per data type.
3. **Database as Code**: EF Core migrations define schema in C#; all SQL visible in version control.
4. **Monorepo**: Single repo, full-stack features in one session, shared specs/docs.
5. **Mobile-First**: Tailwind CSS utilities, responsive breakpoints from ground up.
6. **SEO-Ready**: Next.js server-rendering, metadata per page, structured data.

See [database.md](database.md) and [api.md](api.md) for detailed design.
