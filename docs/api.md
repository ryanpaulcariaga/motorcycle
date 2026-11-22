# API Specification

## Base URL

```
https://api.motorcycle-app.example.com
```

(Local dev: `https://localhost:7240`, used by both Visual Studio's `https` profile and `dotnet run --launch-profile https`.)

## Endpoints

### Contact inquiries

`POST /api/contact` accepts anonymous JSON with optional `name` (maximum 100 characters), required `email` (valid email, maximum 254), and required `message` (maximum 5000). A successful durable database save returns `202 Accepted` without exposing an inquiry ID or a public read endpoint. Invalid requests return 400, an oversized request returns 413, and rate-limited requests return 429. The per-client-IP contact limit defaults to five requests per minute and can be set with `RateLimiting:ContactPerMinute`.

`GET /api/admin/contact-inquiries?page=1&pageSize=20` requires an active administrator and returns `{ items, page, pageSize, totalCount }`, newest first. Each item contains `id`, `name`, `email`, `message`, and `createdAt`. Page sizes are limited to 100. `DELETE /api/admin/contact-inquiries/{id}` requires the same authorization and an allowed Origin; it returns 204 or 404. Deletions use the normal admin audit interceptor without recording message contents.

### Bikes

#### GET /api/bikes

List motorcycles with pagination, sorting, and filtering.

**Query Parameters**:
- `page` (int, default 1)
- `pageSize` (int, default 20)
- `sort` (optional comma-separated ordered criteria, each `field:asc` or `field:desc`; supported fields: `brand`, `category`, `model_name`, `variant_name`, `year`, `price`; for example, `year:desc,price:asc,model_name:asc`)
- Legacy `sortBy`, `sortDescending`, `thenSortBy`, and `thenSortDescending` parameters remain supported when `sort` is omitted.
- `search` (string: free-text match against model name, variant name, or brand name; used by the compare-page bike picker)
- `brandId`, `categoryId` (int, optional)
- `yearMin`, `yearMax` (int, inclusive bounds)
- `priceMin`, `priceMax` (decimal, inclusive MSRP bounds; missing prices do not match)
- One dynamic specification filter: `specCode` and `specMin`/`specMax` for a range, `specValue` for an exact or boolean match, or `specValues` for a comma-separated multiselect. For example, `specCode=cc&specMin=250&specMax=500` filters engine displacement.

Imported motorcycles use year `0` when the source does not identify one. Browse sends `yearMin=1` when only a maximum year is selected so that unknown years do not match.

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
      "primaryImageVariants": {
        "small": "https://blobs.example.com/kawasaki-ninja-400/small.webp",
        "medium": "https://blobs.example.com/kawasaki-ninja-400/medium.webp",
        "large": "https://blobs.example.com/kawasaki-ninja-400/large.webp",
        "xl": null
      },
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
    {
      "id": 1,
      "blobUrl": "https://blobs.example.com/kawasaki-ninja-400/original.jpg",
      "width": 1920,
      "height": 1080,
      "variants": {
        "small": "https://blobs.example.com/kawasaki-ninja-400/small.webp",
        "medium": "https://blobs.example.com/kawasaki-ninja-400/medium.webp",
        "large": "https://blobs.example.com/kawasaki-ninja-400/large.webp",
        "xl": null
      },
      "sortOrder": 1,
      "isPrimary": true
    }
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

#### Bike ratings and comments

- `GET /api/bikes/{bikeId}/reviews` is anonymous and returns `{ averageRating, ratingCount, reviews }` for a published bike. `averageRating` is `null` until the bike has a rating. Each review contains `id`, display-only `authorName`, `rating`, nullable `body`, `createdAt`, and `updatedAt`; emails and user IDs are not exposed.
- `GET /api/bikes/{bikeId}/reviews/mine` requires `AuthenticatedUser` and returns the current user's review, or `204` when none exists.
- `PUT /api/bikes/{bikeId}/reviews` creates or replaces the current user's one review for the bike with `{ "rating": 1..5, "body": "optional" }`. The comment is trimmed and may be at most 1,000 characters.
- `DELETE /api/bikes/{bikeId}/reviews` removes the current user's review.

#### Bike discussion comments

- `GET /api/bikes/{bikeId}/comments` is anonymous and returns the latest 200 discussion comments. Comments are newest-first and contain only `id`, display-only `authorName`, `body`, `createdAt`, and `updatedAt`.
- `GET /api/bikes/{bikeId}/comments/mine` requires `AuthenticatedUser` and returns the current user's comments for the bike so the UI can expose owner controls.
- `POST /api/bikes/{bikeId}/comments` creates a rating-free comment with `{ "body": "..." }`.
- `PUT /api/bikes/{bikeId}/comments/{commentId}` updates an owned comment.
- `DELETE /api/bikes/{bikeId}/comments/{commentId}` deletes an owned comment.

Discussion comments are independent from ratings and do not change the average. A user may create multiple comments; each body is trimmed and must contain 1–1,000 characters. Mutations refuse edits/deletes of another user's comments with `404`.

Credentialed review and comment mutations require `X-Review-Request: 1`; this custom header is the CSRF request signal because the user session is in a secure HttpOnly cookie. Mutations are rate limited and return `400` for invalid content or an unavailable bike, `401` for a missing session, and `404` for an owned record that is missing.

#### GET /api/bikes/compare?ids=id1,id2,id3

Compare multiple motorcycles side-by-side.
Bike results are returned in the same order as the requested `ids`, so the compare view follows the order bikes were added. Duplicate IDs are included only once.

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

Each successful comparison also increments the `bike_comparisons` counter for every pair of the compared bikes (any number). Tracking is best-effort and never fails the request.

This existing request-based counter is independent of the opt-in browser analytics below and is not a count of unique visitors.

#### GET /api/bikes/popular-comparisons?limit=10

Most compared pairs of published bikes (most compared first; `limit` 1–20, default 10). Powers the "Popular Comparisons" sidebar, which links each pair to `/compare?ids=<bikeA.id>,<bikeB.id>`.

**Response**: `[{ "bikeA": <BikeListItemDto>, "bikeB": <BikeListItemDto>, "compareCount": 12 }]`

#### GET /api/bikes/top-by-fans?limit=10

Published bikes ranked for the "Top 10 by Fans" sidebar. A fan is one active user with a rating for that bike; each user can have only one review per bike. Results are ordered by fan count, then average rating, then bike ID (`limit` 1–20, default 10).

**Response**: `[{ "bike": <BikeListItemDto>, "fanCount": 12, "averageRating": 4.3 }]`

#### GET /api/bikes/top-by-daily-interest?limit=10

Published bikes ranked by the current UTC date's opted-in anonymous `bike_view` count. Private signed-in interest profiles are excluded. Results are ordered by view count and then bike ID (`limit` 1–20, default 10), and only bikes still published are returned.

**Response**: `[{ "bike": <BikeListItemDto>, "viewCount": 12 }]`

#### GET /api/bikes/{slug}/compared-with?limit=4

Published bikes most often compared with the given bike (most compared first; `limit` 1–12, default 4). Returns `404` for an unknown/unpublished slug.

**Response**: `[{ "bike": <BikeListItemDto>, "compareCount": 12 }]`


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

### Interest analytics

`POST /api/analytics/events` accepts an opted-in browser event, without credentials or search text. It returns `204` on success, `400` for invalid event shapes or catalog IDs, and `429` when rate limited. It is anonymous and accepts at most 4 KiB per request. The client must not send events before consent; this endpoint cannot independently verify a browser's preference.

Examples:

```json
{ "type": "bike_view", "id": 1 }
{ "type": "brand_filter", "id": 2 }
{ "type": "category_filter", "id": 3 }
{ "type": "search", "zeroResults": true }
{ "type": "comparison", "bikeIds": [1, 2, 3] }
```

Bike IDs must be published; brand and category IDs must exist. Comparisons require 2–25 distinct positive IDs. One comparison increments its total and each unordered pair transactionally. Search counts only submitted header searches after results load; no raw terms are collected. Browser failures are logged and do not interrupt browsing. `RateLimiting:AnalyticsPerMinute` defaults to 60 per IP, in addition to the global limiter.

`GET /api/admin/analytics?from=2026-11-01&to=2026-11-15` requires the active-administrator policy. Inclusive UTC dates must fall within the past 12 calendar months; omitted dates default to the past 30 days ending today. It returns `from`, `to`, `bikeViews`, `comparisons`, `searches`, `zeroResults`, `daily`, `bikes`, `brands`, `categories`, and `pairs`. Ranked lists contain at most 20 entries. Counts include opted-in activity only and are not unique visitors.

```json
{
  "from": "2026-11-01",
  "to": "2026-11-15",
  "bikeViews": 12,
  "comparisons": 3,
  "searches": 4,
  "zeroResults": 1,
  "daily": [{ "day": "2026-11-15", "bikeViews": 12, "comparisons": 3, "searches": 4, "zeroResults": 1 }],
  "bikes": [{ "id": 1, "name": "Example bike", "count": 12 }],
  "brands": [{ "id": 1, "name": "Example brand", "count": 5 }],
  "categories": [{ "id": 1, "name": "Example category", "count": 2 }],
  "pairs": [{ "bikeAId": 1, "bikeAName": "Example bike", "bikeBId": 2, "bikeBName": "Another bike", "count": 3 }]
}
```

### Account interest profiles

These endpoints require the public user session and an active account; they are independent of anonymous aggregate analytics. `GET /api/user/interests/preference` returns `{ "enabled": false }` by default. `PUT /api/user/interests/preference` accepts `{ "enabled": true }` to opt in or `{ "enabled": false }` to withdraw and delete all recorded profile activity. Mutations require a configured allowed `Origin`, the `X-Interest-Request` header, and JSON. Browser cross-origin requests are subject to the credentialed CORS policy.

`POST /api/user/interests/events` accepts `{ "type": "bike_view", "id": 1 }`, `bike_search_selection`, `brand_filter`, `category_filter`, or `{ "type": "comparison", "bikeIds": [1, 2] }`. Unknown fields, including raw search text, are rejected. Bikes must be published; brand and category IDs must exist; comparisons contain 2–25 distinct positive IDs. Responses are `204` for recorded events, `400` for invalid input, `401` for an unauthenticated or inactive user, `403` if profiling is off, and `429` when rate limited. The API checks consent for each event, not just in the browser. Account-linked counters expire after 12 calendar months; no endpoint exposes profile data to admins or third parties.

### Health and Errors

- `GET /health` returns `200` while the process is running (liveness).
- `GET /health/ready` returns `200` when the database is reachable, otherwise `503` (readiness).
- Unhandled server errors return an RFC 7807 `application/problem+json` `500` response without exception details; details go to the Serilog console log.

### Rate Limiting

Requests are limited per client IP using fixed one-minute windows; excess requests receive `429 Too Many Requests` with a `Retry-After` header. `/health` routes are exempt.

| Scope | Default | Setting |
|---|---|---|
| All other requests | 300/min | `RateLimiting:GeneralPerMinute` |
| Sign-in start and callback (`/api/auth/{provider}`, `/api/admin/auth/facebook`, and their callbacks) | 20/min | `RateLimiting:AuthPerMinute` |
| Admin image upload and bike Excel import | 30/min | `RateLimiting:UploadPerMinute` |

Defaults are set in `appsettings.json`; `appsettings.Development.json` raises them so local work and bulk uploads are not throttled. Override in Azure with app settings such as `RateLimiting__AuthPerMinute`. `RateLimiting:Enabled=false` disables limiting. Limits are keyed on the connection's remote IP; behind Azure App Service the client IP is only correct when forwarded headers are processed (`ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`, which App Service Linux sets for .NET by default). Verify after deployment, since otherwise all clients would share one bucket.

### Database Connectivity Test

`TestController` runs a `SELECT ... LIMIT 1` against `bikes` and returns a JSON boolean: `true` when a row was returned, `false` when the table is empty or the query fails (the error is swallowed). Remove or restrict these before production use.

- `GET /api/test/db-anonymous` is anonymous.
- `GET /api/test/db-user` requires the `AuthenticatedUser` policy.
- `GET /api/test/db-admin` requires the `ActiveAdministrator` policy.

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
- `GET /api/user/account/export` returns a versioned JSON export of the active user's account, linked external sign-ins, optional interest counters, bike reviews, and discussion comments. It uses `no-store` and returns `401` without an active account session.
- `DELETE /api/user/account` permanently deletes that active user and all database rows linked through cascading user foreign keys, then clears the `mc_user_session` cookie. Mutations require a configured allowed `Origin` and the `X-Account-Request` header and return `204` on success or `401` for an inactive/missing account.

**Multi-provider account linking**: each external sign-in is stored as a `user_external_logins` row keyed by `(provider, providerUserId)` and linked to one internal `User`. On sign-in the API looks up that exact provider identity first. If it is new, and the provider supplies a **verified** email (Facebook only returns an email for verified accounts; a future Google integration would check its `email_verified` claim), the API links the new provider identity to an existing `User` with that email instead of creating a duplicate account. An unverified or absent email always creates a new `User`. This lets one person sign in with Facebook today and Google (or another provider) later and reach the same account, without ever trusting an unverified email to merge accounts. Adding a provider only requires a new `IExternalAuthProvider` implementation (a Strategy per provider, mirroring `ISpecFilterStrategy`) registered alongside `FacebookExternalAuthProvider`; the controller, session model, and account-linking rule are unchanged.

The public user session (`UserAuth` cookie scheme, `AuthenticatedUser` policy) is entirely separate from the administrator session (`AdminAuth` scheme, `ActiveAdministrator` policy): different cookie names, different claims (`sub` is the internal `User.Id`, not a provider ID), and different expiry. Features requiring a signed-in public user, including bike reviews, authorize with `[Authorize(Policy = "AuthenticatedUser")]`.

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
- `DELETE /api/admin/admin-roles/{id}` permanently deletes an administrator role and returns `204`; a missing role returns `404`.
- All administrator-role endpoints require the active-administrator policy. Duplicate Facebook identities return `409` with `admin_role_exists`.

#### BikeModel Administration

Stage 1 provides typed contracts for:

- BikeModel list, create, edit, and delete operations under `/api/admin/bike-models`;
- Brand list (with `modelCount` and `bikeCount`), create, edit, and delete operations under `/api/admin/brands`; delete returns `409` with code `brand_referenced` when the brand has bike models or bikes;
- Category list (with modelCount and ikeCount), create, edit, and delete operations under /api/admin/categories; delete returns 409 with code category_referenced when the category has bike models or bikes;
- a `409 Conflict` response when a BikeModel is referenced by a bike and cannot be deleted.

BikeModel deletion conflicts return `409` with `bike_model_referenced` and a dependent-bike count. Create/update requests validate brand/category references and the unique `(brandId, name)` pair.

The BikeModel UI loads its dropdown data directly from the API's public `/api/brands` and `/api/categories` endpoints.

Azure Blob image upload/assignment is implemented in Stage 3; spec-group/spec-definition management is described below.

#### Spec Group and Spec Definition Administration

Protected endpoints under `/api/admin/spec-groups` and `/api/admin/spec-definitions` manage the same `SpecGroup`/`SpecDefinition` metadata the public `/api/spec-groups` endpoint renders:

- `GET/POST/PUT/DELETE /api/admin/spec-groups` and `PUT /api/admin/spec-groups/order` (bulk reorder, `{ groupIds: [...] }`).
- `GET/POST/PUT/DELETE /api/admin/spec-definitions` (optionally `?groupId=` to scope the list) and `PUT /api/admin/spec-groups/{groupId}/spec-definitions/order` (bulk reorder within one group, `{ definitionIds: [...] }`).
- `spec_definitions.code` is the literal JSON key used across every `bikes.specs` row and is validated as **globally unique** (case-insensitive, across all groups), not merely unique within one group. Renaming a definition's `code` via `PUT /api/admin/spec-definitions/{id}` renames the matching key across every bike's `specs` in the same database transaction as the definition update — both succeed or neither does. A `dataType` change that is incompatible with any bike's existing stored value is rejected outright (`409 spec_definition_datatype_incompatible` with an affected-bike count); no conversion is attempted.
- Deleting a `SpecGroup` that still has `SpecDefinition` rows returns `409` with `spec_group_referenced`. Deleting a `SpecDefinition` that any bike currently has a non-null value for returns `409` with `spec_definition_referenced`. Duplicate codes return `409` with `spec_group_code_exists`/`spec_definition_code_exists`.
- `isFilterable`/`filterType` consistency is validated dynamically against the currently registered `ISpecFilterStrategy` implementations, so adding a new strategy automatically expands the accepted `filterType` values without an API contract change.

#### Bike (Variant) Administration

Stage 2 provides typed contracts for administering `Bike` (year/trim variant) records under `/api/admin/bikes`:

- `GET /api/admin/bikes?modelId={id}` lists variants, optionally scoped to one BikeModel.
- `GET /api/admin/bikes/{id}` returns one variant's full detail, including current spec values and `specVerifications`, an object keyed by confirmed spec code with `{ sourceUrl, verifiedAt }`.
- `POST /api/admin/bikes` creates a variant under an existing BikeModel; defaults to unpublished.
- `PUT /api/admin/bikes/{id}` edits a variant's core fields and specs, whether or not it is currently published; changes to a published variant are visible on the public catalog immediately. An optional `modelId` moves the variant to another BikeModel (`404` if unknown; `409`-style duplicate check applies against the target model). The slug is unchanged.
- `PATCH /api/admin/bikes/{id}/model` reassigns a variant to an existing BikeModel using `{ modelId }` only. It changes the model association and `UpdatedAt` and clears spec confirmations; returns `204`, `404` if the bike or model is unknown, `400` for an invalid model ID, and `409 bike_exists` if the target model already has that year/variant combination.
- `PATCH /api/admin/bikes/{id}/publish` and `PATCH /api/admin/bikes/{id}/unpublish` toggle public visibility. Publishing a variant missing required core details (year, variant name) returns `400` with `bike_not_publishable`.
- `PATCH /api/admin/bikes/{id}/reviewed` with `{ "isReviewed": true|false }` tags or untags a variant as spec-reviewed and returns the bike detail; this legacy override clears In review. List and detail responses include the shared `reviewStatus` (`notReviewed`, `inReview`, or `reviewed`) and a compatibility `isReviewed` boolean derived from that status, not stored separately.
- `GET /api/admin/bikes/spec-values?specCode={code}[&brandId][&categoryId][&minPrice][&maxPrice]` lists matching variants (all filters optional) with the current value of one specification.
- `GET /api/admin/bikes/spec-grid[?brandId][&categoryId][&minPrice][&maxPrice][&yearMin][&yearMax][&ccMin][&ccMax][&sort][&sortBy][&sortDirection][&reviewStatus][&bikeIds]` returns every matching variant (published or not) with `reviewStatus`, full `specs` and `specVerifications` objects; powers the Bikes screen grid editor. Numeric ranges are inclusive and exclude missing values. `reviewStatus`, when supplied, must be `notReviewed`, `inReview`, or `reviewed`; `bikeIds` is an optional comma-separated list of positive IDs for an exact subset, whose order is preserved when no `sort` is supplied. `sort` is an optional comma-separated ordered list such as `year:desc,brand:asc,spec:cc:asc`; supported fields are `bike`, `brand`, `model`, `variant`, `year`, `category`, `msrp`, `status`, `reviewed`, or `spec:{code}`. Legacy `sortBy` and `sortDirection` (`asc` or `desc`, default `asc`) remain supported when `sort` is omitted. Empty values remain last. The grid displays Category as read-only because it belongs to the shared BikeModel.
- `PUT /api/admin/bikes/spec-grid` accepts `{ changes?: [{ bikeId, specCode, value }], bikeChanges?: [{ bikeId, variantName, year, msrpPrice }], verificationChanges?: [{ bikeId, specCode, isVerified, sourceUrl }], resetVerificationBikeIds?: [bikeId] }`. Resetting removes spec confirmations and clears Reviewed for each specified bike without changing spec values. Reset IDs must be positive and unique; individual verification changes in the same request are applied after the reset, with Reviewed recalculated from the final confirmations. It sets (or clears with `null`) many specifications and updates the Motorcycle (variant name), year, MSRP, and confirmations across many variants in one transaction. Invalid values, duplicate `(bikeId, specCode)` cells or confirmations, duplicate bike rows, or conflicting `(modelId, year, variantName)` values reject the whole batch (`400`); unknown bikes return `404`. Category is not editable in the grid because it belongs to the shared BikeModel. Returns `{ updatedCount }` (distinct bikes addressed, including bikes with no confirmations to reset).
- `GET /api/admin/bikes/export[?brandId][&categoryId][&minPrice][&maxPrice][&yearMin][&yearMax][&ccMin][&ccMax][&sort][&sortBy][&sortDirection][&reviewStatus][&bikeIds]` downloads an `.xlsx` workbook using the same range/review/exact-ID filters and ordered multi-field sorting as the spec grid; sheet `Bikes` (row 1 = spec-group band, row 2 = headers: `Id`, `Brand`, `Model`, `Category`*, `Variant Name`, `Year`, `MSRP Price`, `Published`*, then one `Label [code]` column per specification in group/definition `sortOrder`; row 3 = `TYPE (not data)` and row 4 = `SAMPLE (not data)`, shaded amber and skipped on import; * = reference only; data from row 5) and a `Guide` sheet.
- `POST /api/admin/bikes/import` (multipart field `file`, `.xlsx`, max 5 MB / 5000 rows) upserts from that layout in one transaction. Blank `Id` inserts an unpublished bike (Brand, Model, Variant Name, Year required; Brand+Model must match an existing BikeModel); an existing `Id` updates variant, year, price, model and the specs in the file (blank spec cell clears it). Validation covers ids, lookups, year, price, spec data types (number/boolean/text), unknown spec columns, and duplicate ids or `(model, year, variant)`. Any problem returns `400 { message, errors: [{ row, column, message }] }` with every error and nothing saved; success returns `{ created, updated, unchanged }`.
- `PUT /api/admin/bikes/spec-values` with `{ specCode, values: [{ bikeId, value }] }` sets (or clears with `null`) that one specification across many variants in a single transaction; any invalid value rejects the whole batch (`400`), unknown bikes return `404`. Returns `{ updatedCount }`.
- `DELETE /api/admin/bikes/{id}` permanently deletes a variant. Returns `409` with `bike_referenced` and a dependent image count when the variant has assigned images.
- Create/update requests validate the referenced BikeModel's existence, require year and variant name, enforce a unique `(modelId, year, variantName)` combination (`409` with `bike_exists` on conflict), and validate submitted spec values against the full existing spec-definition set (not filtered by category); unrecognized codes or mismatched types return `400`.

Spec-group/spec-definition management is documented above.

The grid update also accepts `reviewStatusChanges: [{ bikeId, reviewStatus }]`. IDs must be positive and unique and statuses must be one of the values above; unknown bikes return `404` and invalid entries reject the entire batch. Status changes do not clear confirmations. In review is applied before verification recalculation, so verifying every populated spec in the same request completes the review; explicit Not reviewed and Reviewed are manual overrides applied after recalculation. Resetting confirmations also clears In review unless an explicit status change is included.

The bike detail `PUT` also accepts optional `verificationChanges: [{ specCode, isVerified, sourceUrl }]` and `resetVerifications: true` to reset confirmations before applying those changes. A confirmation requires a populated value and an optional absolute HTTP(S) URL of at most 2048 characters. Source URLs are retained in the API for future use but cannot currently be configured in the admin UI. `verifiedAt` is set on confirmation and refreshed when the source changes or a changed value is explicitly reconfirmed. Changing or removing a value clears its confirmation unless explicitly reconfirmed in the same request; changing a model, variant, or year clears all confirmations unless explicitly reconfirmed. Single-spec edits and Excel imports also invalidate changed values. Brand/model identity changes and spec label/unit/type changes invalidate affected confirmations and Reviewed; renaming a spec code preserves them. MSRP changes do not clear them. On changes to specs, confirmations, or bike identity, Reviewed is recalculated: at least one populated spec must exist and every populated spec must be confirmed. Blank specs do not block it. The manual Reviewed endpoint remains an override until a subsequent relevant change. Creating a shared spec definition clears Reviewed for all reviewed bikes without clearing confirmations; a later relevant change can set it again even if the new spec is blank. The API does not independently verify that a URL is official. Confirmations are not exposed by public endpoints.

#### Bike Image Administration

Stage 3 provides protected image management under `/api/admin/bikes/{bikeId}/images`:

- `GET` lists assigned images in `sortOrder` order.
- `POST` accepts a multipart `file` upload (JPEG, PNG, WebP, or GIF; maximum 10 MiB). The API checks the file signature and decoded dimensions, rejects images that are narrower than 1200 pixels or not 4:3 landscape (±2%; the admin SPA crops to 4:3 before upload), then stores the original plus 320/640/1280/2048-pixel-long-edge WebP variants. Sizes larger than the source are written at the source's native size (never upscaled), so every variant is always present for new uploads and backfilled images. Variant metadata is stripped; any failed upload is reported and already-uploaded blobs are cleaned up. The DTO returns original dimensions and nullable URLs for each available variant.
- `PATCH /{imageId}/primary` makes one image primary and clears the primary flag from its siblings.
- `PUT /order` accepts `{ "imageIds": [3, 1, 2] }` and persists the complete image order.
- `DELETE /{imageId}` removes the database assignment and the original and variant Blob objects.

All image endpoints require the `ActiveAdministrator` policy. Storage credentials remain server-side in `Storage:ConnectionString`; the admin browser only receives public image URLs.

Run `dotnet run --project apps/api/Motorcycle.Api -- images backfill-variants` to generate variants for existing images. Images with a longest side under 1200 pixels retain only their original and are marked in admin with their dimensions and missing variants so an administrator can replace them.

#### Administrator audit log

`GET /api/admin/audit-logs?page=1&pageSize=50` returns the newest audit entries first. `page` must be at least 1; `pageSize` must be 1–100. The response is `{ "items": [...], "page": 1, "pageSize": 50, "totalCount": 123 }`. Each entry contains `id`, `occurredAt`, `actorId`, `actorDisplayName`, `action`, `entityType`, `entityKey`, `changedFields`, and `requestId`. It is protected by `ActiveAdministrator`; the API provides no update or delete operation for audit rows.

Every tracked entity created, changed, or deleted while handling an authenticated `/api/admin` request is audited in the same `SaveChanges` transaction. Only changed field names are recorded, not the field values or request body.

#### Admin cookie CSRF protection

Unsafe methods below `/api/admin` require an `Origin` header matching one of the configured `Cors:AllowedOrigins`; otherwise the API returns `403`. This includes sign-out. The check complements the `Secure`, `HttpOnly`, `SameSite=Lax` admin cookie and credentialed CORS. CORS is not treated as the CSRF control.

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
