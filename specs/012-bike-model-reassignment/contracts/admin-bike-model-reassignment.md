# Admin Bike Model Reassignment Contract

All requests require the existing `ActiveAdministrator` authorization policy.

## PATCH /api/admin/bikes/{id}/model

Reassign a bike variant to an existing BikeModel. This operation changes only `ModelId` and `UpdatedAt`; it does not edit other bike details.

**Request**

```json
{
  "modelId": 23
}
```

**Response `204`**: reassignment succeeded (or the bike was already assigned to the requested model).

**Response `400`**: target `modelId` is not a positive integer.

**Response `404`**: the bike or target BikeModel does not exist.

**Response `409`**:

```json
{
  "code": "bike_exists",
  "message": "A bike with this model, year, and variant name already exists."
}
```

The conflict is returned when the target model already contains a different bike with the same year and variant name. No bike fields are changed on failure.

Unauthenticated requests return `401`; authenticated identities without an active administrator role return `403`.
