# Feature 015: Compared-Bike Tracking and Recommendations

## Goal
Record which bikes are compared together and recommend the most compared bikes on a bike's detail page ("ADV is often compared with NMAX").

## Behavior
- Every `GET /api/bikes/compare` that resolves 2+ published bikes increments a counter per bike pair (any number of bikes). Failures never break the comparison.
- `GET /api/bikes/{slug}/compared-with?limit=` returns published bikes most compared with the bike, ordered by count then recency.
- The public bike detail page shows an "Often compared with" section linking to `/compare?ids={bike},{other}`; hidden when there is no data.
- Admin app: no change (no admin UI in scope).

## Data
`bike_comparisons` (unordered pair stored as `bike_a_id < bike_b_id`, unique, `compare_count`, timestamps). See `docs/database.md`.

## Tasks
- [x] Domain entity, EF mapping, migration `AddBikeComparisons`
- [x] `IBikeComparisonRepository` + atomic upsert implementation
- [x] Tracking in `BikeService.CompareBikesAsync`; `GetMostComparedWithAsync`
- [x] `GET /api/bikes/{slug}/compared-with`
- [x] Web types, API client, detail page section
- [x] Update `docs/api.md` and `docs/database.md`
