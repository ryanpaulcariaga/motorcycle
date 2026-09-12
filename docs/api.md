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

### Future Advertising API

Advertising is not part of the MVP API. A future version may expose a read-only delivery endpoint such as `GET /api/advertising/placements` that accepts the page context, placement key, and optional category/brand context, then returns only approved and currently active creatives. The response should include disclosure text and a stable impression token rather than exposing internal campaign or budget data.

Separate event endpoints or an internal event pipeline may record impressions and clicks. These events must be privacy-conscious, rate-limited, and independent from the organic bike search and comparison endpoints. Delivery should return an empty result when no eligible ad exists, so clients do not need an error state for normal ad inventory gaps.

### Future Dealer Links API

Dealer links are not part of the MVP API. A future read-only endpoint such as `GET /api/bikes/{slug}/dealers` may return approved, currently valid dealer listings for a motorcycle, including dealer name, service area, destination URL, availability/price when verified, and the last-verified timestamp. Unapproved, expired, or removed links must not be returned.

Dealer links should be clearly identified as external destinations. The endpoint should return an empty list when no verified dealer is available and should not change the bike's organic search or comparison response.

---

**Authentication**: None (MVP). Future: JWT bearer tokens.

**Caching**: `spec-groups`, `brands`, `categories` cached 1 hour server-side.

**CORS**: Configured for Next.js origin.

See [architecture.md](architecture.md) for design rationale.
