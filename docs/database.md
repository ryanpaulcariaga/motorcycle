# Database Schema

## Tables

### brands
```sql
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_blob_url VARCHAR(2048),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### categories
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
```

### bikes
```sql
CREATE TABLE bikes (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES bike_models(id),
  variant_name VARCHAR(255) NOT NULL,
  year INT NOT NULL DEFAULT 0,
  msrp_price NUMERIC(10, 2),
  slug VARCHAR(512) NOT NULL UNIQUE,
  specs JSONB NOT NULL DEFAULT '{}',  -- { "cc": "399", "horsepower": "45", ... }
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bikes_model_id ON bikes(model_id);
CREATE INDEX idx_bikes_year ON bikes(year);
CREATE INDEX idx_bikes_msrp_price ON bikes(msrp_price);
CREATE INDEX idx_bikes_specs GIN (specs);  -- For JSONB filtering

-- Expression indexes for common filterable specs (added via EF Core migrations)
CREATE INDEX idx_bikes_cc ON bikes (((specs->>'cc')::NUMERIC)) WHERE specs ? 'cc';
CREATE INDEX idx_bikes_horsepower ON bikes (((specs->>'horsepower')::NUMERIC)) WHERE specs ? 'horsepower';
```

### bike_images
```sql
CREATE TABLE bike_images (
  id SERIAL PRIMARY KEY,
  bike_id INT NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  blob_url VARCHAR(2048) NOT NULL,
  sort_order INT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bike_images_bike_id ON bike_images(bike_id);
```

### spec_groups
```sql
CREATE TABLE spec_groups (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  icon_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### bike_models
```sql
CREATE TABLE bike_models (
  id SERIAL PRIMARY KEY,
  brand_id INT NOT NULL REFERENCES brands(id),
  category_id INT NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE INDEX idx_bike_models_brand_id ON bike_models(brand_id);
CREATE INDEX idx_bike_models_category_id ON bike_models(category_id);
```

`bike_models` is the stable product line inferred from related source records, such as `Honda Click` or `Honda ADV`. Each `bikes` row is one comparable variant whose `variant_name` preserves the complete source `Model` value. Year-specific price, specifications, images, slug, and publication state belong to the variant. A year of `0` means the imported source did not identify a model year.

### admin_roles
```sql
CREATE TABLE admin_roles (
  id SERIAL PRIMARY KEY,
  facebook_user_id VARCHAR(255) NOT NULL UNIQUE,
  email_snapshot VARCHAR(320),
  display_name_snapshot VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Stage 1 accepts the `Administrator` role value. Deactivation is a retained state change; role records are not deleted. The operator-only bootstrap command creates the first active record after the migration is applied.

### spec_definitions
```sql
CREATE TABLE spec_definitions (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES spec_groups(id),
  code VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,  -- 'number', 'text', 'boolean', 'enum'
  unit VARCHAR(50),
  sort_order INT NOT NULL DEFAULT 0,
  is_filterable BOOLEAN DEFAULT false,
  filter_type VARCHAR(50),  -- 'range', 'exact', 'multiselect'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, code)
);
```

### Future Tables (Schema Stubs)
```sql
-- Analytics
CREATE TABLE bike_views (
  id SERIAL PRIMARY KEY,
  bike_id INT REFERENCES bikes(id),
  session_hash VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spec_search_log (
  id SERIAL PRIMARY KEY,
  spec_code VARCHAR(255),
  filter_value VARCHAR(255),
  searched_at TIMESTAMP DEFAULT NOW()
);

-- User engagement (requires auth in Phase 5+)
CREATE TABLE bike_votes (
  id SERIAL PRIMARY KEY,
  bike_id INT NOT NULL REFERENCES bikes(id),
  session_or_user_id VARCHAR(255),
  vote_type VARCHAR(50),  -- 'upvote', 'downvote'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bike_comments (
  id SERIAL PRIMARY KEY,
  bike_id INT NOT NULL REFERENCES bikes(id),
  author_name VARCHAR(255),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false
);

-- Surveys
CREATE TABLE survey_responses (
  id SERIAL PRIMARY KEY,
  year INT,
  respondent_ref VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Future Advertising Tables (Design Only)

Advertising is deferred and should not be added to the MVP schema until its commercial and privacy requirements are approved. The expected model is:

- `advertisers`: organization, billing/contact reference, status, and audit timestamps.
- `ad_campaigns`: advertiser, name, start/end dates, budget or delivery limits, status, and targeting rules.
- `ad_creatives`: campaign, asset/text destination, disclosure label, moderation status, and accessibility metadata.
- `ad_placements`: stable placement key, page/context rules, device constraints, and display limits.
- `ad_delivery_events`: campaign/creative/placement reference, event type (`impression` or `click`), timestamp, and a privacy-preserving session or request reference.

Campaign and creative records should be soft-disabled rather than deleted while they are referenced by delivery events. Delivery events should be retained only as long as needed for reporting and fraud review, with aggregation preferred over storing identifiable browsing histories.

### Future Dealer Tables (Design Only)

Dealer links are deferred and should not be added to the MVP schema until verification and ownership rules are approved. The expected model is:

- `dealers`: dealer name, website, contact details, location/service area, status, and audit timestamps.
- `bike_dealer_listings`: bike/dealer relationship, destination URL, optional price and availability, verification status, last-verified timestamp, expiration timestamp, and click/reporting references.

The relationship should support multiple dealers per motorcycle and multiple motorcycle listings per dealer. URLs require validation and moderation; expired or unverified listings are excluded from public responses. Dealer rows must remain distinct from `brands`, even when a dealer sells only one manufacturer.

## Notes

- **JSONB specs**: Bike variants store specs as a flat key-value map. Schema flexibility allows per-variant omissions without schema migration.
- **Primary keys**: `int`/`SERIAL` identity columns (not UUID) — smaller, sequential, and more b-tree/index-friendly at this scale.
- **Naming convention**: all tables/columns/keys/indexes are snake_case (PostgreSQL convention), enforced in `MotorcycleDbContext` rather than hand-annotated per property.
- **Expression Indexes**: Per-spec indexes added via EF Core migrations for filterable numeric specs → fast range queries.
- **GIN Index**: General JSONB filtering via `specs @> ...` or `specs ? 'key'` syntax.
- **No category-spec scoping**: All specs available for all bike variants; admin manages per-variant spec values. Future: add optional `category_id` to `spec_definitions` if needed.
- **Administration writes**: The admin site changes catalog data only through protected API operations. It introduces no separate catalog store; EF Core migrations remain the source of truth for schema changes. BikeModel deletion is checked for dependent `bikes.model_id` references before persistence to prevent the existing cascade from removing variants.
- **Image management**: `bike_images` remains the relationship and ordering source for assigned motorcycle images. The API enforces a single primary image per motorcycle and owns Blob Storage upload access.
- **Advertising is isolated from catalog data**: sponsored placements must not be stored as bike ranking signals or mixed into organic comparison responses. Future advertising tables should reference context and placement keys, not mutate bike specs or search ordering.

See [api.md](api.md) and [architecture.md](architecture.md) for design rationale.
