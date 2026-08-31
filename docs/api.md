# API Specification

## Base URL

```
https://api.motorcycle-app.example.com
```

(Local dev: `http://localhost:5000`)

## Endpoints

### Bikes

#### GET /api/bikes

List motorcycles with pagination, sorting, and filtering.

**Query Parameters**:
- `page` (int, default 1)
- `pageSize` (int, default 20)
- `sortBy` (string: `model`, `year`, `price`, default `model`)
- `sortOrder` (string: `asc`, `desc`, default `asc`)
- `brands` (string: comma-separated brand IDs)
- `categories` (string: comma-separated category IDs)
- `year` (string: `2020-2024` range syntax or exact year)
- `price` (string: `10000-50000` range syntax)
- Dynamic specs: `spec_<code>=<operator>:<value>` (e.g., `spec_horsepower=gt:100`, `spec_type=in:sport,cruiser`)

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "modelName": "Ninja 400",
      "brandName": "Kawasaki",
      "categoryName": "Sport",
      "year": 2024,
      "msrpPrice": 4699,
      "slug": "kawasaki-ninja-400-2024",
      "primaryImageUrl": "https://blobs.example.com/kawasaki-ninja-400.jpg",
      "specs": { "cc": "399", "horsepower": "45" }
    }
  ],
  "totalCount": 342,
  "pageCount": 18
}
```

#### GET /api/bikes/{slug}

Get detailed motorcycle info + all images.

**Response**:
```json
{
  "id": "uuid",
  "modelName": "Ninja 400",
  "brandName": "Kawasaki",
  "categoryName": "Sport",
  "year": 2024,
  "msrpPrice": 4699,
  "slug": "kawasaki-ninja-400-2024",
  "images": [
    { "url": "https://blobs.example.com/...", "sortOrder": 1, "isPrimary": true }
  ],
  "specsGrouped": {
    "Engine": {
      "cc": { "label": "Displacement", "unit": "cc", "value": "399" },
      "horsepower": { "label": "Horsepower", "unit": "hp", "value": "45" }
    },
    "Body": { ... }
  }
}
```

#### GET /api/bikes/compare?ids=id1,id2,id3

Compare multiple motorcycles side-by-side.

**Response**:
```json
{
  "bikeIds": ["id1", "id2", "id3"],
  "specsGrouped": {
    "Engine": {
      "cc": {
        "label": "Displacement",
        "unit": "cc",
        "id1": "399",
        "id2": "650",
        "id3": null
      }
    }
  }
}
```

### Spec Definitions

#### GET /api/spec-groups

Get all spec groups and their definitions (drives filter UI + compare labels).

**Response**:
```json
{
  "groups": [
    {
      "id": "uuid",
      "code": "engine",
      "name": "Engine",
      "sortOrder": 1,
      "specs": [
        {
          "id": "uuid",
          "code": "cc",
          "label": "Displacement",
          "dataType": "number",
          "unit": "cc",
          "isFilterable": true,
          "filterType": "range"
        }
      ]
    }
  ]
}
```

### Lookups

#### GET /api/brands

List all brands.

#### GET /api/categories

List all categories.

---

**Authentication**: None (MVP). Future: JWT bearer tokens.

**Caching**: `spec-groups`, `brands`, `categories` cached 1 hour server-side.

**CORS**: Configured for Next.js origin.

See [architecture.md](architecture.md) for design rationale.
