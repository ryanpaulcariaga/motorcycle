# Research: Bike Model Reassignment

## Decision: Add a dedicated reassignment operation

**Decision**: Add a protected `PATCH /api/admin/bikes/{id}/model` operation with a request containing only `modelId`.

**Rationale**: The existing bike update operation accepts variant name, year, MSRP, and specs along with the optional model ID. Reusing it would require the UI to submit unrelated fields, contrary to the requirement that reassignment only edits the BikeModel.

**Alternatives considered**:
- Reuse `PUT /api/admin/bikes/{id}`: rejected because it requires a full edit request and couples reassignment to unrelated properties.
- Change the public catalog API: rejected because reassignment is an administrator-only mutation and public read contracts are unaffected.

## Decision: Validate existing model and uniqueness in the Application service

**Decision**: Load the bike, verify that the target BikeModel exists, and apply the existing `(modelId, year, variantName)` duplicate check, excluding the current bike.

**Rationale**: This follows the existing create/update validation path and preserves the catalog's uniqueness rule. Returning a conflict prevents losing or overwriting variant records.

**Alternatives considered**:
- Rely solely on a database constraint: rejected because the admin should receive the repository-standard `409 bike_exists` response and a clear explanation.
- Allow duplicates: rejected because it violates the existing catalog uniqueness contract.

## Decision: Preserve all other bike data and reuse the modal/API conventions

**Decision**: Update only `ModelId` and `UpdatedAt`, persist through the existing repository, and reload the list after success. Reuse `Modal`, `getBikeModels`, and the centralized typed admin API client.

**Rationale**: This preserves specs, MSRP, publication status, slug, and images while keeping the new interaction consistent with existing admin workflows.

**Alternatives considered**:
- Build a new modal/client/data path: rejected as duplicate infrastructure with no benefit.
- Regenerate the slug or modify other fields: rejected because reassignment is explicitly limited to BikeModel assignment.
