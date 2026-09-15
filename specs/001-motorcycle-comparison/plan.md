# Implementation Plan: Motorcycle Comparison

See [../../plan-motorcycleWebApp.md](../../plan-motorcycleWebApp.md) in the project root for the full plan.

**High-level phases**:

1. Database schema (PostgreSQL, EF Core migrations)
2. Backend API (ASP.NET Core, Clean Architecture, Strategy pattern for filtering)
3. Frontend (Next.js, Tailwind CSS, responsive layout)
4. Admin catalog management (`apps/admin` plus protected shared API operations)
5. Azure infrastructure & CI/CD for public web, admin, and API apps
6. Future features (AI, surveys, analytics, comments, dealer links, advertising)

See [../005-admin-catalog-management/spec.md](../005-admin-catalog-management/spec.md) for the planned private admin application.
