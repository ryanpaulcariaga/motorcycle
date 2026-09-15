# Advertising Platform

## Status

Future feature. Not included in the MVP and not currently implemented.

## Overview

Provide a privacy-conscious advertising capability through clearly labeled sponsored placements and relevant motorcycle-related campaigns. Advertising must complement the catalog experience without changing the truth or ordering of organic bike data.

## Goals

- Support direct sponsorships from motorcycle brands, dealers, events, gear companies, and related services.
- Deliver approved campaigns to named placements with optional category, brand, and device context.
- Make sponsored content visually distinct and disclose it clearly.
- Measure impressions and clicks without creating an unnecessary identifiable browsing history.
- Keep pages usable when ads are blocked, unavailable, expired, or under review.
- Give operators control over creative moderation, campaign dates, delivery limits, and reporting.

## Functional Requirements (Future)

- Advertisers, campaigns, creatives, and placements are modeled separately from the organic bike catalog.
- Campaigns support start/end dates, active/paused/rejected states, delivery limits, and targeting rules.
- Creatives support image or text assets, destination URLs, disclosure text, alt text, and moderation status.
- Delivery returns only approved creatives from active campaigns eligible for the requested placement and context.
- Sponsored results never modify organic search ranking, filters, bike specifications, or comparison calculations.
- Impressions and clicks are recorded through a privacy-conscious, rate-limited event path.
- No eligible ad is a normal empty result, not a page error.
- Ads meet responsive, keyboard, contrast, and screen-reader expectations.
- Operators can pause a campaign or creative immediately and retain an audit trail for moderation decisions.

## Privacy and Trust Requirements

- Every placement includes a visible `Sponsored` or equivalent disclosure.
- Contextual targeting should be preferred over individual profiling.
- Consent must be obtained where required before non-essential tracking or personalization.
- Do not send internal campaign budgets, private advertiser data, or raw tracking identifiers to the browser.
- Define retention and aggregation rules for delivery events before production launch.
- Destination URLs and creatives require validation and brand-safety review.

## Out of Scope for Initial Release

- User-generated advertising.
- Personalized behavioral profiles built from browsing history.
- Automatic acceptance of arbitrary third-party ad network scripts.
- Ads inside the core comparison matrix if they reduce scanability or make comparisons ambiguous.
- Letting sponsorship influence bike data quality, editorial recommendations, or organic sort order.

## Suggested Delivery Phases

1. Define commercial policy, placement inventory, disclosure language, privacy review, and moderation rules.
2. Add advertiser, campaign, creative, placement, and delivery-event models through EF Core migrations.
3. Extend the protected administration site defined in [005-admin-catalog-management](../005-admin-catalog-management/spec.md) with operator workflows for approval, scheduling, pausing, and reporting.
4. Add a cacheable, context-aware delivery API with empty-inventory behavior.
5. Add accessible responsive ad slots to selected pages and verify blocked, expired, and unavailable states.
6. Measure performance, privacy impact, fraud signals, and user feedback before expanding inventory or considering an external ad network.

## Success Criteria

- Users can distinguish sponsored content from organic motorcycle content at a glance.
- Organic search and comparison responses are independent of campaign eligibility.
- A blocked, missing, or failed ad never prevents the primary page workflow.
- Operators can stop a campaign without a deployment.
- Reporting answers delivery-volume and click-through questions without retaining unnecessary personal data.
