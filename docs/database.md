# Database Schema

## Tables

### brands
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_blob_url VARCHAR(2048),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
```

### bikes
```sql
CREATE TABLE bikes (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  model_name VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  msrp_price NUMERIC(10, 2),
  slug VARCHAR(512) NOT NULL UNIQUE,
  specs JSONB NOT NULL DEFAULT '{}',  -- { "cc": "399", "horsepower": "45", ... }
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bikes_brand_id ON bikes(brand_id);
CREATE INDEX idx_bikes_category_id ON bikes(category_id);
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
  id UUID PRIMARY KEY,
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  icon_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### spec_definitions
```sql
CREATE TABLE spec_definitions (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES spec_groups(id),
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
  id UUID PRIMARY KEY,
  bike_id UUID REFERENCES bikes(id),
  session_hash VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spec_search_log (
  id UUID PRIMARY KEY,
  spec_code VARCHAR(255),
  filter_value VARCHAR(255),
  searched_at TIMESTAMP DEFAULT NOW()
);

-- User engagement (requires auth in Phase 5+)
CREATE TABLE bike_votes (
  id UUID PRIMARY KEY,
  bike_id UUID NOT NULL REFERENCES bikes(id),
  session_or_user_id VARCHAR(255),
  vote_type VARCHAR(50),  -- 'upvote', 'downvote'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bike_comments (
  id UUID PRIMARY KEY,
  bike_id UUID NOT NULL REFERENCES bikes(id),
  author_name VARCHAR(255),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false
);

-- Surveys
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY,
  year INT,
  respondent_ref VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Notes

- **JSONB specs**: Bikes store specs as a flat key-value map. Schema flexibility allows per-bike omissions without schema migration.
- **Expression Indexes**: Per-spec indexes added via EF Core migrations for filterable numeric specs → fast range queries.
- **GIN Index**: General JSONB filtering via `specs @> ...` or `specs ? 'key'` syntax.
- **No category-spec scoping**: All specs available for all bikes; admin manages per-bike spec values. Future: add optional `category_id` to `spec_definitions` if needed.

See [api.md](api.md) and [architecture.md](architecture.md) for design rationale.
