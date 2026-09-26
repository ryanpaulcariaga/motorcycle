# API Specification

## Base URL

```
https://api.motorcycle-app.example.com
```

(Local dev: `https://localhost:7240`, used by both Visual Studio's `https` profile and `dotnet run --launch-profile https`.)

## Endpoints

### Bikes

#### GET /api/bikes

List motorcycles with pagination, sorting, and filtering.

**Query Parameters**:
- `page` (int, default 1)
- `pageSize` (int, default 20)
- `sortBy` (string: `model`, `year`, `price`, default `model`)
- `sortOrder` (string: `asc`, `desc`, default `asc`)
- `search` (string: free-text match against model name, variant name, or brand name; used by the compare-page bike picker)
- `brands` (string: comma-separated brand IDs)
- `categories` (string: comma-separated category IDs)
- `year` (string: `2020-2024` range syntax or exact year)

Imported motorcycles use year `0` when the source does not identify one; year filters exclude those records.
- `price` (string: `10000-50000` range syntax)
- Dynamic specs: `spec_<code>=<operator>:<value>` (e.g., `spec_horsepower=gt:100`, `spec_type=in:sport,cruiser`)

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "modelId": 1,
      "modelName": "Ninja 400",
      "variantName": "Standard",
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
  "id": 1,
  "modelId": 1,
  "modelName": "Ninja 400",
  "variantName": "Standard",
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
  "bikeIds": [1, 2, 3],
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
      "id": 1,
      "code": "engine",
      "name": "Engine",
      "sortOrder": 1,
      "specs": [
        {
          "id": 1,
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

### Public User Authentication

`apps/web` (and any other first-party public frontend) shares one user-authentication boundary on the same API used for the catalog. Any active identity from a supported external provider can sign in; there is no manual registration or allowlist. The API owns the OAuth exchange and session; provider access tokens are never exposed to the browser.

- `GET /api/auth/{provider}` starts Authorization Code + PKCE for `facebook` (or a future provider such as `google`) and stores the state/verifier in short-lived secure HttpOnly cookies.
- `GET /api/auth/{provider}/callback` exchanges the authorization code server-side, resolves or creates the `User` record, creates a 30-day secure HttpOnly `mc_user_session` cookie, and redirects to the configured public web app URL (`?authError=...` on failure).
- `GET /api/auth/session` returns `{ userId, email, displayName }` for the signed-in user, or `401` when there is no active session.
- `POST /api/auth/signout` clears the session cookie.

**Multi-provider account linking**: each external sign-in is stored as a `user_external_logins` row keyed by `(provider, providerUserId)` and linked to one internal `User`. On sign-in the API looks up that exact provider identity first. If it is new, and the provider supplies a **verified** email (Facebook only returns an email for verified accounts; a future Google integration would check its `email_verified` claim), the API links the new provider identity to an existing `User` with that email instead of creating a duplicate account. An unverified or absent email always creates a new `User`. This lets one person sign in with Facebook today and Google (or another provider) later and reach the same account, without ever trusting an unverified email to merge accounts. Adding a provider only requires a new `IExternalAuthProvider` implementation (a Strategy per provider, mirroring `ISpecFilterStrategy`) registered alongside `FacebookExternalAuthProvider`; the controller, session model, and account-linking rule are unchanged.

The public user session (`UserAuth` cookie scheme, `AuthenticatedUser` policy) is entirely separate from the administrator session (`AdminAuth` scheme, `ActiveAdministrator` policy): different cookie names, different claims (`sub` is the internal `User.Id`, not a provider ID), and different expiry. A future feature that requires a signed-in public user (e.g. reviews, voting) authorizes with `[Authorize(Policy = "AuthenticatedUser")]`.

### Administration API

The same ASP.NET Core API serves the private `apps/admin` Vite React SPA. Public catalog endpoints stay anonymous and read-only. The API completes Facebook Authorization Code + PKCE, verifies the active `AdminRole`, and creates a one-hour secure HttpOnly session cookie. The React client calls the API directly with credentialed CORS requests; Facebook access tokens are never exposed to the browser or accepted by protected catalog endpoints.

#### Administrator Authentication

- `GET /api/admin/auth/facebook` starts Facebook Authorization Code + PKCE and stores the state and verifier in short-lived secure HttpOnly cookies.
- `GET /api/admin/auth/facebook/callback` validates the callback, exchanges the authorization code server-side, verifies an active `AdminRole`, creates the admin session, and redirects to the configured admin SPA URL.
- `GET /api/admin/auth/session` returns the signed-in identity when the session has an active administrator role.
- `POST /api/admin/auth/signout` removes the admin session.

Protected `/api/admin` requests require the API session cookie. `401 Unauthorized` means the session is missing or expired; `403 Forbidden` means the identity no longer has an active administrator role. CORS must allow the configured admin SPA origin with credentials.

#### Administrator Roles

- `GET /api/admin/admin-roles` lists administrator role records.
- `POST /api/admin/admin-roles` provisions an active `Administrator` role.
- `PATCH /api/admin/admin-roles/{id}` updates snapshots, role, or active status.
- Role records are never deleted. Duplicate Facebook identities return `409` with `admin_role_exists`.

#### BikeModel Administration

Stage 1 provides typed contracts for:

- BikeModel list, create, edit, and delete operations under `/api/admin/bike-models`;
- a `409 Conflict` response when a BikeModel is referenced by a bike and cannot be deleted.

BikeModel deletion conflicts return `409` with `bike_model_referenced` and a dependent-bike count. Create/update requests validate brand/category references and the unique `(brandId, name)` pair.

The BikeModel UI loads its dropdown data directly from the API's public `/api/brands` and `/api/categories` endpoints.

Azure Blob image upload/assignment is implemented in Stage 3; spec-group/spec-definition management is implemented per `specs/009-spec-metadata-management/`.

#### Spec Group and Spec Definition Administration

Protected endpoints under `/api/admin/spec-groups` and `/api/admin/spec-definitions` manage the same `SpecGroup`/`SpecDefinition` metadata the public `/api/spec-groups` endpoint renders:

- `GET/POST/PUT/DELETE /api/admin/spec-groups` and `PUT /api/admin/spec-groups/order` (bulk reorder, `{ groupIds: [...] }`).
- `GET/POST/PUT/DELETE /api/admin/spec-definitions` (optionally `?groupId=` to scope the list) and `PUT /api/admin/spec-groups/{groupId}/spec-definitions/order` (bulk reorder within one group, `{ definitionIds: [...] }`).
- `spec_definitions.code` is the literal JSON key used across every `bikes.specs` row and is validated as **globally unique** (case-insensitive, across all groups), not merely unique within one group. Renaming a definition's `code` via `PUT /api/admin/spec-definitions/{id}` renames the matching key across every bike's `specs` in the same database transaction as the definition update — both succeed or neither does. A `dataType` change that is incompatible with any bike's existing stored value is rejected outright (`409 spec_definition_datatype_incompatible` with an affected-bike count); no conversion is attempted.
- Deleting a `SpecGroup` that still has `SpecDefinition` rows returns `409` with `spec_group_referenced`. Deleting a `SpecDefinition` that any bike currently has a non-null value for returns `409` with `spec_definition_referenced`. Duplicate codes return `409` with `spec_group_code_exists`/`spec_definition_code_exists`.
- `isFilterable`/`filterType` consistency is validated dynamically against the currently registered `ISpecFilterStrategy` implementations, so adding a new strategy automatically expands the accepted `filterType` values without an API contract change.

See [contracts/admin-spec-metadata-api.md](../specs/009-spec-metadata-management/contracts/admin-spec-metadata-api.md) for the full contract.

#### Bike (Variant) Administration

Stage 2 provides typed contracts for administering `Bike` (year/trim variant) records under `/api/admin/bikes`:

- `GET /api/admin/bikes?modelId={id}` lists variants, optionally scoped to one BikeModel.
- `GET /api/admin/bikes/{id}` returns one variant's full detail, including current spec values.
- `POST /api/admin/bikes` creates a variant under an existing BikeModel; defaults to unpublished.
- `PUT /api/admin/bikes/{id}` edits a variant's core fields and specs, whether or not it is currently published; changes to a published variant are visible on the public catalog immediately.
- `PATCH /api/admin/bikes/{id}/publish` and `PATCH /api/admin/bikes/{id}/unpublish` toggle public visibility. Publishing a variant missing required core details (year, variant name) returns `400` with `bike_not_publishable`.
- `DELETE /api/admin/bikes/{id}` permanently deletes a variant. Returns `409` with `bike_referenced` and a dependent image count when the variant has assigned images.
- Create/update requests validate the referenced BikeModel's existence, require year and variant name, enforce a unique `(modelId, year, variantName)` combination (`409` with `bike_exists` on conflict), and validate submitted spec values against the full existing spec-definition set (not filtered by category); unrecognized codes or mismatched types return `400`.

See [contracts/admin-bikes-api.md](../specs/006-bike-catalog-management/contracts/admin-bikes-api.md) for the full request/response contract. Spec-group/spec-definition management is implemented per `specs/009-spec-metadata-management/` (see above).

#### Bike Image Administration

Stage 3 provides protected image management under `/api/admin/bikes/{bikeId}/images`:

- `GET` lists assigned images in `sortOrder` order.
- `POST` accepts a multipart `file` upload (JPEG, PNG, WebP, or GIF; maximum 10 MiB). The API uploads it to the configured Azure Blob `images` container and stores the public URL in `bike_images`.
- `PATCH /{imageId}/primary` makes one image primary and clears the primary flag from its siblings.
- `PUT /order` accepts `{ "imageIds": [3, 1, 2] }` and persists the complete image order.
- `DELETE /{imageId}` removes the database assignment and the corresponding Blob object.

All image endpoints require the `ActiveAdministrator` policy. Storage credentials remain server-side in `Storage:ConnectionString`; the admin browser only receives public image URLs.

### Future Advertising API

Advertising is not part of the MVP API. A future version may expose a read-only delivery endpoint such as `GET /api/advertising/placements` that accepts the page context, placement key, and optional category/brand context, then returns only approved and currently active creatives. The response should include disclosure text and a stable impression token rather than exposing internal campaign or budget data.

Separate event endpoints or an internal event pipeline may record impressions and clicks. These events must be privacy-conscious, rate-limited, and independent from the organic bike search and comparison endpoints. Delivery should return an empty result when no eligible ad exists, so clients do not need an error state for normal ad inventory gaps.

### Future Dealer Links API

Dealer links are not part of the MVP API. A future read-only endpoint such as `GET /api/bikes/{slug}/dealers` may return approved, currently valid dealer listings for a motorcycle, including dealer name, service area, destination URL, availability/price when verified, and the last-verified timestamp. Unapproved, expired, or removed links must not be returned.

Dealer links should be clearly identified as external destinations. The endpoint should return an empty list when no verified dealer is available and should not change the bike's organic search or comparison response.

---

**Authentication**: Public catalog endpoints require no authentication. Administration endpoints require the API-managed HttpOnly session for an active administrator role. The operator-only bootstrap command creates the initial role after migrations are applied.

**Caching**: `spec-groups`, `brands`, `categories` cached 1 hour server-side.

**CORS**: Configured for the public Next.js origin and the Vite administration SPA origin; administration requests permit credentials.

See [architecture.md](architecture.md) for design rationale.
