# Quickstart: Validate Admin Catalog Management

## Prerequisites

- PostgreSQL is available and current EF Core migrations are applied.
- A Facebook OAuth app is configured for local development with Authorization Code + PKCE and this exact redirect URL: `https://localhost:3001/api/auth/callback/facebook`.
- The admin app requests `public_profile`; the `email` permission is intentionally not requested because Meta may reject it for this development app.
- The initial active administrator has been created through the trusted bootstrap procedure after the migration is applied.
- Dependencies are installed with `pnpm install`; the API and both frontend workspaces are available.
- Test fixtures include one unreferenced BikeModel and one BikeModel referenced by at least one Bike.

## Run Locally

1. Start the API with `dotnet run --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj --launch-profile https`.
2. Start the public site with `pnpm --filter web dev` when public-route regression checks are needed.
3. Start the admin site with its workspace dev command from `apps/admin`.
4. Sign in with the Facebook test identity that has the active bootstrap role.

## First Administrator Bootstrap

Run the bootstrap command only after the `AdminRole` migration and bootstrap implementation are complete, the database is migrated, and the API is running:

```powershell
dotnet run --project apps/api/Motorcycle.Api --launch-profile https -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

The command is operator-only and idempotent. Verify the active role record before testing Facebook sign-in.

## Validate Authentication and Role Lifecycle

1. Open `https://localhost:3001`, accept the locally generated certificate if prompted, complete sign-in, and confirm the admin shell loads; inspect requests to confirm no Facebook access token is sent to the API and that server-side API calls use the short-lived first-party JWT.
2. Provision a second Facebook identity through role management and confirm it can sign in.
3. Deactivate that role and confirm the identity receives an authorization failure on the next protected request.
4. Reactivate the role and confirm protected access returns.
5. Repeat provisioning for the same Facebook user ID and confirm `409` with `admin_role_exists`.
6. Attempt a protected request without a first-party credential and with an invalid/inactive identity; confirm `401` and `403` behavior respectively.

## Validate BikeModel Management

1. Load BikeModels and brand/category options through the typed admin client.
2. Create a valid BikeModel, then edit its name and selections; confirm the list reflects both changes.
3. Submit missing or unknown brand/category values and confirm field-level validation prevents persistence.
4. Delete the unreferenced fixture and confirm it is removed.
5. Attempt to delete the referenced fixture; confirm `409` with `bike_model_referenced`, no Bike data is removed, and the UI presents an actionable message.
6. Resize the admin experience to 320px, 768px, and 1024px+ widths and confirm navigation, forms, lists, and errors remain usable.

## Automated Checks

- Run the API build and test commands from the repository guidance.
- Run the admin workspace lint/build checks.
- Exercise the scenarios above against the local API and database.

Bike CRUD, publication management, image upload/assignment, and specification metadata CRUD remain deferred.

See [admin-api.md](contracts/admin-api.md) for endpoint details and [data-model.md](data-model.md) for fields, relationships, and validation rules.
