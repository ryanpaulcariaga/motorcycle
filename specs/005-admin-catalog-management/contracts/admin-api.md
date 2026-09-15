# Admin API Contract

Stage 1 endpoints use the shared API. The admin app completes Facebook Authorization Code + PKCE and sends only an application-issued short-lived first-party credential on protected requests. Facebook access tokens are never accepted by these endpoints.

Local callback: `https://localhost:3001/api/auth/callback/facebook`. Stage 1 requests `public_profile`; the Facebook email permission is not required and may be unavailable for development apps. The email snapshot supplied during bootstrap/provisioning remains optional.

## First-Party Credential Contract

- Credential format: signed JWT, minted only by the admin server after a valid application session.
- Algorithm: RS256 with the private signing key held by the admin server; the API validates with the configured public key.
- Lifetime: 5-10 minutes; expired credentials are rejected.
- Required claims: `iss` (admin application issuer), `aud` (motorcycle API audience), `sub` (Facebook user ID), `exp` (expiry), and `jti` (unique token ID).
- API validation: verify signature, issuer, audience, subject, and expiry, then load the active `AdminRole` by `sub`.
- Facebook access tokens are never forwarded to or accepted by the API.
- The browser uses the admin application's HttpOnly session; only server-side admin API requests attach the first-party JWT.

## Boundary and Errors

- Base path: `/api/admin`
- All endpoints require an authenticated first-party credential and an active `AdminRole`.
- `401 Unauthorized` means the credential is missing, invalid, or expired.
- `403 Forbidden` means the identity is authenticated but has no active administrator role.
- `400 Bad Request` contains field-level validation errors.
- `404 Not Found` is returned for an unknown resource.
- `409 Conflict` contains a stable `code` and actionable `message` for duplicate identities, duplicate BikeModels, and referenced-model deletion.
- Public catalog routes remain under their existing paths and remain anonymous/read-only.
- Application DTOs are mirrored by TypeScript types in `apps/admin`.

## Administrator Role Operations (Stage 1)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/admin-roles` | List role records, including identity snapshots, role, active status, and timestamps |
| `POST` | `/api/admin/admin-roles` | Provision an active role for an unassigned Facebook user ID |
| `PATCH` | `/api/admin/admin-roles/{id}` | Change role, active status, or identity snapshots; Facebook user ID is immutable |

`CreateAdminRoleRequest` includes `facebookUserId`, `emailSnapshot`, `displayNameSnapshot`, and `role`. `UpdateAdminRoleRequest` includes permitted mutable fields and `isActive`. A duplicate Facebook user ID returns `409` with `admin_role_exists`. Role deletion is not supported.

Stage 1 accepts only the `Administrator` role value. Other role values return `400` with field-level validation feedback.

## First Administrator Bootstrap

Before Facebook sign-in or role-management UI validation, an operator runs the idempotent API bootstrap command after applying the database migration:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

The command creates one active `Administrator` record, refuses an unexpected overwrite of an existing identity, and is never exposed as a browser or public HTTP operation. Do not run it before the implementation and migration exist.

## BikeModel Operations (Stage 1)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/bike-models` | List BikeModels with brand and category display data |
| `POST` | `/api/admin/bike-models` | Create a BikeModel |
| `GET` | `/api/admin/bike-models/{id}` | Read a BikeModel for editing |
| `PUT` | `/api/admin/bike-models/{id}` | Update a BikeModel |
| `DELETE` | `/api/admin/bike-models/{id}` | Delete an unreferenced BikeModel |

`CreateBikeModelRequest` and `UpdateBikeModelRequest` include `brandId`, `categoryId`, and `name`. The service validates required fields and existing lookups. A referenced model returns `409` with `bike_model_referenced` and leaves all related data unchanged.

## Lookup Operations Used By The Admin UI

The admin form may use the existing anonymous read-only `GET /api/brands` and `GET /api/categories` endpoints for selection options. No Stage 1 admin mutation endpoints are added for brands, categories, spec groups, or spec definitions.

## Explicitly Deferred

Bike CRUD, publication management, Azure Blob image upload/assignment, and spec-group/spec-definition CRUD are not part of this contract.
