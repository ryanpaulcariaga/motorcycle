# Implementation Plan: Bulk Single-Spec Edit

**Spec**: [spec.md](spec.md)

## Approach

Extend the existing admin bikes slice; no new project and no schema change (the `bikes.specs` JSONB column is reused).

- **Application**: `BikeSpecValueItemDto`, `UpdateSingleSpecRequest` in `DTOs/BikeAdminDto.cs`; `IBikeAdminService.GetSpecValuesAsync` / `UpdateSingleSpecAsync`; validation reuses `BikeValidators.ValidateSpecs`.
- **Infrastructure**: `BikeAdminRepository.GetForSpecEditAsync` (optional brand, category, and price filters) and `GetByIdsAsync`.
- **Api**: `GET` and `PUT /api/admin/bikes/spec-values` in `AdminBikesController`.
- **Admin SPA**: `components/bikes/BulkSpecEditor.tsx`, client functions in `lib/api.ts`, types in `lib/types.ts`, route `/admin/bulk-spec` and sidebar link in `src/App.tsx`.
- **Docs**: `docs/api.md`.

## Contract

- `GET /api/admin/bikes/spec-values?specCode[&brandId][&categoryId][&minPrice][&maxPrice]` returns `BikeSpecValueItemDto[]`; `400` for an unknown spec code.
- `PUT /api/admin/bikes/spec-values` body `{ specCode, values: [{ bikeId, value }] }` returns `{ updatedCount }`; `400` for invalid values or duplicate bikes, `404` for unknown bikes. A `null` value removes the spec.
