# Plan: Bulk Spec Grid

- API: `GET /api/admin/bikes/spec-grid` (filters) returns each bike with its full `specs` JSONB; `PUT /api/admin/bikes/spec-grid` applies `{ changes: [{ bikeId, specCode, value }] }` in one `SaveChanges`, validated via `BikeValidators.ValidateSpecs` before any mutation.
- Admin: `BulkSpecEditor.tsx` uses `react-data-grid` with frozen bike column, column groups per spec group, custom text/number/boolean editors, copy/paste, fill handle, dirty tracking.
- The old `spec-values` endpoints are retained.
