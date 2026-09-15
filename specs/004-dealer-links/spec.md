# Dealer Links

## Status

Future feature. Not included in the MVP and not currently implemented.

## Overview

Let users discover approved dealers or dealer listings for a specific motorcycle. Dealer links are external destinations and must remain separate from manufacturer brands, organic search ranking, and comparison results.

## Goals

- Associate one motorcycle with multiple dealers and one dealer with multiple motorcycles.
- Show useful dealer context such as name, service area, price or availability when verified, and last-verified time.
- Send users only to validated, approved, and currently active external URLs.
- Give operators workflows to verify, expire, remove, and report dealer listings.
- Keep the bike detail experience useful when no dealer listing is available.

## Functional Requirements (Future)

- Dealer records are distinct from manufacturer brand records.
- A bike may have zero, one, or many dealer listings.
- A dealer may have listings for many bikes.
- Listings support destination URL, optional price, optional availability, service area, verification state, last-verified timestamp, and expiration timestamp.
- Public API responses include only approved, non-expired listings.
- Bike detail pages show dealer links in a separate section with clear external-link labeling.
- Invalid, broken, unverified, or expired listings can be hidden without changing bike data.
- No dealer listing changes organic search ordering, filtering, specifications, or comparison calculations.
- Click reporting is optional and must follow the application's privacy and retention rules.

## Trust and Moderation Requirements

- Validate destination URLs and reject unsupported or unsafe schemes.
- Require operator approval before a listing becomes public.
- Display when price or availability was last verified; do not present stale values as current.
- Support immediate disabling and an audit trail for removals or moderation decisions.
- Treat dealer links as external content and avoid implying endorsement beyond the approved listing context.

## Out of Scope for Initial Release

- In-app dealer checkout or inventory synchronization.
- User-submitted dealer listings without moderation.
- Dealer accounts or self-service billing.
- Allowing dealer sponsorship to alter organic bike rankings or comparison output.

## Suggested Delivery Phases

1. Define dealer verification, ownership, geographic coverage, and link policy.
2. Add dealer and bike-dealer-listing models through EF Core migrations.
3. Extend the protected administration site defined in [005-admin-catalog-management](../005-admin-catalog-management/spec.md) with operator workflows for creating, approving, verifying, expiring, and disabling listings.
4. Add a cacheable read-only dealer endpoint and no-listings response.
5. Add the dealer section to bike detail pages and test stale, broken, blocked, and unavailable states.
6. Add privacy-reviewed click reporting only if it provides clear product value.

## Success Criteria

- Users can find a relevant dealer link from a motorcycle detail page without confusing it with the motorcycle's manufacturer.
- Public responses never include unapproved or expired listings.
- A missing or broken dealer link does not block the detail page.
- Operators can remove a listing without a code deployment.
- Organic search and comparison behavior is unchanged when dealer listings are added or removed.
