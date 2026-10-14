# Data Model: Admin Bike Catalog Filters

This feature introduces no persistent entities or API DTO changes.

## Existing bike model

The Bikes tab uses the existing bike-model records:

- `id`: stable row identity
- `brandId` / `brandName`: associated brand
- `categoryId` / `categoryName`: associated category
- `name`: model-line name

Each model has one brand and one category.

## UI filter state

- `brandId`: selected brand ID, or empty for no brand restriction
- `categoryId`: selected category ID, or empty for no category restriction

The visible list is derived from the loaded model list. A model is visible when it matches every active selection. Changing filter state does not mutate or persist model data.

## UI ordering state

- `sortField`: `brand`, `category`, or `name`; defaults to `brand`
- `sortDirection`: `asc` or `desc`; defaults to `asc`

The filtered list is sorted by the selected field, with the other descriptive fields used as deterministic tie-breakers. Filter and ordering state is transient and encoded in the Bikes URL query parameters (`brandId`, `categoryId`, `sort`, and `direction`) so it can be restored on refresh and preserved across Variants navigation. It is not persisted in the catalog database or browser storage.
