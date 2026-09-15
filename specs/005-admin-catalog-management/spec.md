# Admin Catalog Management

## Overview

Provide a private administrative Next.js application for maintaining the motorcycle catalog through the existing ASP.NET Core API. The admin site complements, but does not replace, the public comparison site.

## Requirements

- **Separate frontend:** Add `apps/admin/` as a Next.js, TypeScript, and Tailwind CSS workspace with a structure consistent with `apps/web/`.
- **Shared API:** Both public and admin frontends use `apps/api/`. The admin site must use typed API contracts and must not access PostgreSQL or Azure Blob Storage directly.
- **Protected mutations:** Catalog write endpoints require authenticated, authorized administrator access. Public catalog endpoints remain anonymous and read-only.
- **Motorcycle management:** Create, edit, publish/unpublish, and delete model lines and year/trim variants, including brand, category, model name, variant name, year, MSRP, slug, and specification values.
- **Specification values:** Validate each motorcycle's values against the configured specification definitions and preserve the JSONB storage model.
- **Image management:** Upload images through the API, associate them with a motorcycle, choose one primary image, reorder images, and remove image assignments. Storage credentials remain server-side.
- **Metadata management:** Create and edit brands, categories, specification groups, and specification definitions, including their ordering, labels, types, units, and filter configuration.
- **Usability:** Provide searchable management lists, clear validation and mutation errors, and responsive layouts for administration tasks.

## Out of Scope

- Public self-service registration or public catalog editing
- Direct browser access to database or Blob Storage credentials
- User-review, advertising, survey, analytics, or dealer-management administration
- Public self-service management of administrator identities or roles
