# Quickstart: Validate Bike Catalog Management

## Prerequisites

- PostgreSQL is available and current EF Core migrations are applied, including the new uniqueness index added for this feature.
- An active administrator session already works (Stage 1 `AdminRole` bootstrap is complete; see `specs/005-admin-catalog-management/quickstart.md`).
- At least one existing `BikeModel` fixture with no variants, to create the first test variant against.
- Dependencies are installed with `pnpm install`; the API and both frontend workspaces are available.

## Run Locally

1. Start the API with `dotnet run --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj --launch-profile https`.
2. Start the admin site from `apps/admin` and sign in with the active administrator identity.
3. Start the public site with `pnpm --filter web dev` when public-route regression checks are needed.

## Validate Variant Create/Edit

1. Open an existing `BikeModel` in admin and create a new variant with a valid year, variant name, and MSRP.
2. Confirm the variant appears in that model's variant list as unpublished.
3. Edit the variant's variant name, year, MSRP, and one spec value; confirm the changes persist after reload.
4. Submit an empty variant name or missing year; confirm the request is rejected with a clear validation error and no data changes.
5. Create a second variant under the same model with the same year and variant name as the first; confirm `409 bike_exists`.
6. Submit an unrecognized spec key or a value with the wrong type (e.g., text for a `number` spec); confirm the request is rejected and the offending field is identified.

## Validate Publication State

1. Confirm the newly created unpublished variant does not appear via the public site's catalog or comparison views.
2. Publish the variant; confirm it now appears on the public catalog and comparison views.
3. While published, edit one of its core fields and save; confirm the change is immediately visible on the public catalog without needing to unpublish/republish.
4. Unpublish the variant; confirm it disappears from public views immediately while remaining visible and editable in admin.
5. Create a new, minimal variant and attempt to publish it before required fields are complete (if applicable to your test fixture); confirm publication is rejected until requirements are met.

## Validate Deletion

1. Delete a variant with no dependent images; confirm it is permanently removed from both admin and public views.
2. Once image assignment exists (a later feature), attempt to delete a variant that has at least one assigned image; confirm `409 bike_referenced` with a dependent image count, and that no data is removed.

## Validate Authorization

1. Attempt each `/api/admin/bikes*` request without a first-party credential; confirm `401`.
2. Attempt each request with a valid credential for an inactive administrator; confirm `403`.

## Automated Checks

- Run the API build and test commands from the repository guidance in `.github/copilot-instructions.md`.
- Run the admin workspace lint/build checks (`eslint`, `tsc --noEmit`, `next build`).
- Exercise the scenarios above against the local API and database.

Image upload/assignment and specification-metadata CRUD remain deferred to later features.

See [contracts/admin-bikes-api.md](contracts/admin-bikes-api.md) for endpoint details and [data-model.md](data-model.md) for fields, relationships, and validation rules.
