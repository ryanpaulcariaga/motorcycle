# Implementation Plan: Administrator Role Management

## Summary

Extend the existing administrator role management flow with snapshot editing and permanent role deletion. Keep Facebook identity immutable, preserve the role's activation state when editing snapshots, and require explicit confirmation before deleting.

## Technical Context

- Frontend: Vite React SPA in `apps/admin`; all requests use its centralized typed API client.
- Backend: ASP.NET Core API with Application service/repository contracts and Infrastructure EF Core implementation.
- Authorization: existing `ActiveAdministrator` policy protects `/api/admin/admin-roles`.
- Persistence: existing `AdminRole` entity; no schema change is required.
- API documentation: update the administrator-role contract in `docs/api.md`.

## Design

1. Reuse the existing administrator modal for both provisioning and editing, prefill snapshot values for edits, and leave Facebook user ID immutable.
2. Keep activation/deactivation as a distinct row action. Snapshot edits submit the existing active state.
3. Add a protected `DELETE /api/admin/admin-roles/{id}` endpoint with service and repository deletion operations; return not found for missing roles and no content for successful deletion.
4. Ask for explicit browser confirmation before calling delete; update the list only after the API confirms success and show failures in the existing error area.
5. Preserve existing API response DTOs and database schema.

## Validation

- Build the admin workspace to type-check and bundle the React client.
- Run the API solution build and tests.
- Review the API documentation and feature task checklist for contract consistency.
