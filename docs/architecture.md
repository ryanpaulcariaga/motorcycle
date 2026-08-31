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

### Key Principles

1. **Clean Architecture**: Backend layers (Domain → Application → Infrastructure → API) with unidirectional dependencies.
2. **Strategy Pattern**: Spec filtering logic extensible per data type.
3. **Database as Code**: EF Core migrations define schema in C#; all SQL visible in version control.
4. **Monorepo**: Single repo, full-stack features in one session, shared specs/docs.
5. **Mobile-First**: Tailwind CSS utilities, responsive breakpoints from ground up.
6. **SEO-Ready**: Next.js server-rendering, metadata per page, structured data.

See [database.md](database.md) and [api.md](api.md) for detailed design.
