# Quickstart: Bike Model Reassignment

## Prerequisites

- API dependencies restored and local database available.
- Admin SPA dependencies installed.
- An active administrator account and at least two BikeModels.
- A bike variant that does not collide with a variant in the target BikeModel.

## Validation

1. Run the API tests:

   ```powershell
   dotnet test apps\api\Motorcycle.Api.slnx
   ```

   Expected: reassignment service tests pass for valid moves, duplicate rejection, unknown target, and unchanged bike properties.

2. Build the admin app:

   ```powershell
   pnpm --filter admin build
   ```

   Expected: TypeScript checking and the Vite production build succeed.

3. Sign in to the admin SPA and open **Bikes Variants**. Choose **Reassign model** on a bike and verify:
   - The modal shows the current BikeModel and allows choosing another.
   - Cancel leaves the current model unchanged.
   - Confirming a valid target updates the model shown in the list.
   - Variant name, year, MSRP, specifications, publication status, and assigned images remain unchanged.
   - A duplicate target combination displays an error and leaves the bike unchanged.
