# BoxTrack Database Schema v2.0

**Last Updated:** January 7, 2026
**Database:** Supabase Postgres
**Version:** 2.0.0 (Enhanced with Physical Location Management)

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Storage Buckets](#storage-buckets)
7. [Database Functions](#database-functions)
8. [Triggers](#triggers)
9. [Views](#views)
10. [Example Queries](#example-queries)
11. [Migration Plan](#migration-plan)

---

## Overview

### Core Entities

- **Households** - Groups of users sharing box inventory
- **User Households** - Many-to-many relationship between users and households
- **Storage Locations** - Physical warehouse infrastructure (pallets, rows, positions)
- **Box Types** - Standardized box sizes with dimensions
- **Boxes** - Physical storage boxes being tracked
- **Photos** - Images of box contents
- **Categories** - Organizational categories

### Design Principles

1. **Multi-tenancy** - All data scoped by `household_id`
2. **Physical Location Management** - Track actual warehouse layout
3. **Capacity Planning** - Know what's available vs occupied
4. **Audit Trail** - Track creation and modification timestamps
5. **Soft Deletes** - Use `deleted_at` for important data
6. **UUIDs** - All primary keys use UUIDs
7. **Normalization** - Proper relational structure for locations

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
│  - id (uuid)    │
└────────┬────────┘
         │
         │ many-to-many
         │
┌────────▼────────────────┐      ┌──────────────────┐
│  user_households        │◄─────┤  households      │
│  - user_id (fk)        │      │  - id (pk)       │
│  - household_id (fk)   │      │  - name          │
│  - role                │      │  - created_at    │
└─────────────────────────┘      └────────┬─────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │                     │                      │
                    │                     │                      │
          ┌─────────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
          │  pallets         │  │  box_types       │  │  categories      │
          │  - id (pk)       │  │  - id (pk)       │  │  - id (pk)       │
          │  - household_id  │  │  - household_id  │  │  - household_id  │
          │  - code          │  │  - name          │  │  - name          │
          │  - description   │  │  - length        │  │  - color         │
          │  - location      │  │  - width         │  └──────────────────┘
          │  - is_active     │  │  - height        │
          └────────┬─────────┘  │  - weight_limit  │
                   │            │  - is_default    │
                   │            └──────────────────┘
          ┌────────▼─────────┐
          │  pallet_rows     │
          │  - id (pk)       │
          │  - pallet_id (fk)│
          │  - row_number    │
          │  - max_positions │
          └────────┬─────────┘
                   │
          ┌────────▼─────────┐
          │  row_positions   │
          │  - id (pk)       │
          │  - row_id (fk)   │
          │  - position_num  │
          │  - is_occupied   │
          │  - box_type_id   │──┐
          │  - notes         │  │
          └────────┬─────────┘  │
                   │            │
                   │ one-to-one │
                   │            │
          ┌────────▼─────────┐  │
          │  boxes           │  │
          │  - id (pk)       │  │
          │  - household_id  │◄─┘
          │  - position_id   │
          │  - box_type_id   │
          │  - label         │
          │  - description   │
          │  - status        │
          │  - category_id   │
          │  - qr_code       │
          │  - created_at    │
          │  - closed_at     │
          │  - deleted_at    │
          └─────────┬────────┘
                    │
                    │ one-to-many
                    │
          ┌─────────▼─────────┐
          │  photos           │
          │  - id (pk)        │
          │  - box_id (fk)    │
          │  - storage_path   │
          │  - url            │
          │  - caption        │
          │  - display_order  │
          └───────────────────┘
```

---

## Tables

### 1. `households`

Multi-tenant container for shared box inventory.

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,

  -- Settings
  default_box_type_id UUID, -- Added later as FK

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT households_name_check CHECK (char_length(name) >= 1)
);

COMMENT ON TABLE households IS 'Organizations or groups sharing box inventory';
COMMENT ON COLUMN households.slug IS 'URL-friendly unique identifier for household';
```

**Indexes:**
```sql
CREATE INDEX idx_households_slug ON households(slug);
CREATE INDEX idx_households_created_at ON households(created_at DESC);
```

---

### 2. `user_households`

Junction table linking users to households with roles.

```sql
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE user_households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, household_id)
);

COMMENT ON TABLE user_households IS 'Many-to-many relationship between users and households';
```

**Indexes:**
```sql
CREATE INDEX idx_user_households_user_id ON user_households(user_id);
CREATE INDEX idx_user_households_household_id ON user_households(household_id);
CREATE INDEX idx_user_households_role ON user_households(household_id, role);
```

---

### 3. `box_types`

Standardized box sizes and specifications.

```sql
CREATE TABLE box_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,

  -- Type Information
  name VARCHAR(50) NOT NULL, -- e.g., "Small", "Medium", "Large", "Wardrobe"
  code VARCHAR(20), -- e.g., "SM", "MD", "LG", "XL"
  description TEXT,

  -- Dimensions (in inches or cm, household configurable)
  length NUMERIC(6,2), -- e.g., 16.00
  width NUMERIC(6,2),  -- e.g., 12.00
  height NUMERIC(6,2), -- e.g., 12.00

  -- Weight and capacity
  weight_limit_lbs NUMERIC(6,2), -- Max weight in pounds
  volume_cubic_ft NUMERIC(8,2), -- Calculated or manual

  -- Visual
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
  icon VARCHAR(50), -- Icon name or emoji

  -- Meta
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- NULL household_id = system defaults, otherwise household-specific
  CONSTRAINT box_types_unique_per_household UNIQUE(household_id, name),
  CONSTRAINT box_types_dimensions_positive CHECK (
    (length IS NULL OR length > 0) AND
    (width IS NULL OR width > 0) AND
    (height IS NULL OR height > 0)
  )
);

COMMENT ON TABLE box_types IS 'Standardized box sizes with dimensions and specifications';
COMMENT ON COLUMN box_types.household_id IS 'NULL for system defaults, set for household-specific types';
```

**Indexes:**
```sql
CREATE INDEX idx_box_types_household_id ON box_types(household_id);
CREATE INDEX idx_box_types_active ON box_types(household_id, is_active) WHERE is_active = true;
CREATE INDEX idx_box_types_display_order ON box_types(household_id, display_order);
```

**Default Box Types:**
```sql
INSERT INTO box_types (household_id, name, code, length, width, height, weight_limit_lbs, color, icon, is_default, display_order) VALUES
  (NULL, 'Small', 'SM', 16.00, 12.00, 12.00, 35.00, '#10B981', '📦', true, 1),
  (NULL, 'Medium', 'MD', 18.00, 14.00, 12.00, 45.00, '#3B82F6', '📦', true, 2),
  (NULL, 'Large', 'LG', 20.00, 20.00, 15.00, 65.00, '#F59E0B', '📦', true, 3),
  (NULL, 'Extra Large', 'XL', 24.00, 18.00, 18.00, 75.00, '#EF4444', '📦', true, 4),
  (NULL, 'Wardrobe', 'WR', 24.00, 24.00, 40.00, 100.00, '#8B5CF6', '👔', true, 5),
  (NULL, 'File Box', 'FILE', 15.00, 12.00, 10.00, 30.00, '#06B6D4', '📄', true, 6);
```

---

### 4. `pallets`

Physical storage pallets/platforms in warehouse.

```sql
CREATE TABLE pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Identification
  code VARCHAR(20) NOT NULL, -- e.g., "A", "B", "PALLET-1"
  name VARCHAR(100), -- e.g., "Front Left Pallet"
  description TEXT,

  -- Physical location
  location_description TEXT, -- e.g., "Garage, left wall"
  warehouse_zone VARCHAR(50), -- e.g., "Zone A", "Upstairs"

  -- Configuration
  max_rows INTEGER NOT NULL DEFAULT 4,
  default_positions_per_row INTEGER NOT NULL DEFAULT 6,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Display
  color VARCHAR(7) DEFAULT '#6B7280',
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT pallets_code_unique_per_household UNIQUE(household_id, code),
  CONSTRAINT pallets_max_rows_positive CHECK (max_rows > 0),
  CONSTRAINT pallets_default_positions_positive CHECK (default_positions_per_row > 0)
);

COMMENT ON TABLE pallets IS 'Physical storage pallets/platforms in warehouse';
COMMENT ON COLUMN pallets.code IS 'Short code for quick reference (A, B, 1, 2, etc.)';
COMMENT ON COLUMN pallets.max_rows IS 'Maximum number of rows this pallet can hold';
```

**Indexes:**
```sql
CREATE INDEX idx_pallets_household_id ON pallets(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pallets_code ON pallets(household_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_pallets_active ON pallets(household_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_pallets_display_order ON pallets(household_id, display_order);
```

---

### 5. `pallet_rows`

Rows on each pallet (horizontal levels).

```sql
CREATE TABLE pallet_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,

  -- Row identification
  row_number INTEGER NOT NULL, -- 1, 2, 3, etc. (bottom to top)
  label VARCHAR(50), -- Optional label like "Bottom", "Middle", "Top"

  -- Configuration
  max_positions INTEGER NOT NULL DEFAULT 6,
  height_from_ground_inches NUMERIC(6,2), -- Optional physical height

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pallet_rows_unique_per_pallet UNIQUE(pallet_id, row_number),
  CONSTRAINT pallet_rows_row_number_positive CHECK (row_number > 0),
  CONSTRAINT pallet_rows_max_positions_positive CHECK (max_positions > 0)
);

COMMENT ON TABLE pallet_rows IS 'Rows on each pallet (horizontal levels)';
COMMENT ON COLUMN pallet_rows.row_number IS 'Row number from bottom to top (1 = bottom)';
```

**Indexes:**
```sql
CREATE INDEX idx_pallet_rows_pallet_id ON pallet_rows(pallet_id, row_number);
CREATE INDEX idx_pallet_rows_active ON pallet_rows(pallet_id, is_active) WHERE is_active = true;
```

---

### 6. `row_positions`

Specific positions within each row (storage slots).

```sql
CREATE TABLE row_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES pallet_rows(id) ON DELETE CASCADE,

  -- Position identification
  position_number INTEGER NOT NULL, -- 1, 2, 3, etc. (left to right)
  label VARCHAR(50), -- Optional label

  -- Constraints
  max_box_type_id UUID REFERENCES box_types(id) ON DELETE SET NULL, -- Max box size allowed

  -- Status
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_reserved BOOLEAN NOT NULL DEFAULT false,
  reserved_for VARCHAR(100), -- Optional reservation note
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT row_positions_unique_per_row UNIQUE(row_id, position_number),
  CONSTRAINT row_positions_position_number_positive CHECK (position_number > 0)
);

COMMENT ON TABLE row_positions IS 'Specific storage positions within each row';
COMMENT ON COLUMN row_positions.is_occupied IS 'Automatically updated when box assigned/removed';
COMMENT ON COLUMN row_positions.max_box_type_id IS 'Maximum box size that can fit in this position';
```

**Indexes:**
```sql
CREATE INDEX idx_row_positions_row_id ON row_positions(row_id, position_number);
CREATE INDEX idx_row_positions_occupied ON row_positions(row_id, is_occupied);
CREATE INDEX idx_row_positions_available ON row_positions(row_id, is_active, is_occupied)
  WHERE is_active = true AND is_occupied = false AND is_reserved = false;
```

---

### 7. `categories`

Organizational categories for boxes.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT categories_unique_name_per_household UNIQUE(household_id, name),
  CONSTRAINT categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE categories IS 'Box categories for organization and color coding';
```

**Indexes:**
```sql
CREATE INDEX idx_categories_household_id ON categories(household_id);
CREATE INDEX idx_categories_display_order ON categories(household_id, display_order);
```

**Default Categories:**
```sql
INSERT INTO categories (household_id, name, color, icon, is_default, display_order) VALUES
  (NULL, 'Kitchen', '#EF4444', '🍳', true, 1),
  (NULL, 'Bedroom', '#8B5CF6', '🛏️', true, 2),
  (NULL, 'Bathroom', '#06B6D4', '🚿', true, 3),
  (NULL, 'Office', '#F59E0B', '💼', true, 4),
  (NULL, 'Living Room', '#10B981', '🛋️', true, 5),
  (NULL, 'Garage', '#6B7280', '🔧', true, 6),
  (NULL, 'Other', '#EC4899', '📦', true, 7);
```

---

### 8. `boxes`

Core entity representing physical storage boxes.

```sql
CREATE TYPE box_status AS ENUM ('empty', 'packing', 'packed', 'stored', 'retrieved');

CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Box Information
  label VARCHAR(100) NOT NULL,
  description TEXT,
  status box_status NOT NULL DEFAULT 'empty',

  -- Type and Category
  box_type_id UUID REFERENCES box_types(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Physical Location
  position_id UUID REFERENCES row_positions(id) ON DELETE SET NULL,

  -- QR Code
  qr_code VARCHAR(255) UNIQUE,

  -- Weight
  actual_weight_lbs NUMERIC(6,2),

  -- Metadata
  photo_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id), -- Who's responsible for this box

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  packed_at TIMESTAMPTZ,
  stored_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT boxes_label_not_empty CHECK (char_length(label) >= 1),
  CONSTRAINT boxes_description_length CHECK (char_length(description) <= 1000),
  CONSTRAINT boxes_weight_positive CHECK (actual_weight_lbs IS NULL OR actual_weight_lbs >= 0)
);

COMMENT ON TABLE boxes IS 'Physical storage boxes being tracked';
COMMENT ON COLUMN boxes.position_id IS 'Current physical location in warehouse';
COMMENT ON COLUMN boxes.status IS 'empty: not started, packing: being filled, packed: sealed, stored: on pallet, retrieved: taken out';
```

**Indexes:**
```sql
CREATE INDEX idx_boxes_household_id ON boxes(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_status ON boxes(household_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_position_id ON boxes(position_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_box_type_id ON boxes(box_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_category_id ON boxes(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_qr_code ON boxes(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_created_at ON boxes(household_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_label_search ON boxes USING gin(to_tsvector('english', label || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_assigned_to ON boxes(assigned_to) WHERE deleted_at IS NULL;
```

---

### 9. `photos`

Images of box contents.

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,

  -- Storage
  storage_path TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,

  -- Metadata
  caption VARCHAR(200),
  display_order INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER,
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT photos_caption_length CHECK (char_length(caption) <= 200),
  CONSTRAINT photos_display_order_positive CHECK (display_order >= 0)
);

COMMENT ON TABLE photos IS 'Photos of box contents for identification';
```

**Indexes:**
```sql
CREATE INDEX idx_photos_box_id ON photos(box_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_created_at ON photos(box_id, created_at DESC) WHERE deleted_at IS NULL;
```

---

## Views

### `v_available_positions`

View of all available storage positions with location details.

```sql
CREATE VIEW v_available_positions AS
SELECT
  rp.id as position_id,
  h.id as household_id,
  h.name as household_name,
  p.id as pallet_id,
  p.code as pallet_code,
  p.name as pallet_name,
  pr.id as row_id,
  pr.row_number,
  rp.position_number,
  CONCAT(p.code, '/', pr.row_number, '/', rp.position_number) as full_location,
  bt.name as max_box_type,
  bt.id as max_box_type_id,
  rp.is_reserved,
  rp.reserved_for,
  rp.notes
FROM row_positions rp
JOIN pallet_rows pr ON rp.row_id = pr.id
JOIN pallets p ON pr.pallet_id = p.id
JOIN households h ON p.household_id = h.id
LEFT JOIN box_types bt ON rp.max_box_type_id = bt.id
WHERE rp.is_active = true
  AND rp.is_occupied = false
  AND pr.is_active = true
  AND p.is_active = true
  AND p.deleted_at IS NULL
ORDER BY h.id, p.display_order, pr.row_number, rp.position_number;

COMMENT ON VIEW v_available_positions IS 'All available storage positions with full location details';
```

### `v_boxes_with_location`

Denormalized view of boxes with full location and type information.

```sql
CREATE VIEW v_boxes_with_location AS
SELECT
  b.id,
  b.household_id,
  b.label,
  b.description,
  b.status,
  b.qr_code,
  b.photo_count,

  -- Location
  b.position_id,
  CONCAT(p.code, '/', pr.row_number, '/', rp.position_number) as location,
  p.code as pallet_code,
  p.name as pallet_name,
  pr.row_number,
  rp.position_number,

  -- Type
  bt.name as box_type_name,
  bt.code as box_type_code,
  bt.length,
  bt.width,
  bt.height,

  -- Category
  c.name as category_name,
  c.color as category_color,
  c.icon as category_icon,

  -- Timestamps
  b.created_at,
  b.updated_at,
  b.packed_at,
  b.stored_at

FROM boxes b
LEFT JOIN row_positions rp ON b.position_id = rp.id
LEFT JOIN pallet_rows pr ON rp.row_id = pr.id
LEFT JOIN pallets p ON pr.pallet_id = p.id
LEFT JOIN box_types bt ON b.box_type_id = bt.id
LEFT JOIN categories c ON b.category_id = c.id
WHERE b.deleted_at IS NULL;

COMMENT ON VIEW v_boxes_with_location IS 'Denormalized boxes with full location and type details';
```

### `v_pallet_capacity`

View showing capacity and utilization for each pallet.

```sql
CREATE VIEW v_pallet_capacity AS
SELECT
  p.id as pallet_id,
  p.household_id,
  p.code,
  p.name,
  COUNT(DISTINCT pr.id) as total_rows,
  COUNT(rp.id) as total_positions,
  COUNT(rp.id) FILTER (WHERE rp.is_occupied = true) as occupied_positions,
  COUNT(rp.id) FILTER (WHERE rp.is_occupied = false AND rp.is_active = true) as available_positions,
  ROUND(
    (COUNT(rp.id) FILTER (WHERE rp.is_occupied = true)::NUMERIC /
     NULLIF(COUNT(rp.id), 0) * 100)::NUMERIC,
    2
  ) as utilization_percent
FROM pallets p
LEFT JOIN pallet_rows pr ON p.id = pr.pallet_id
LEFT JOIN row_positions rp ON pr.id = rp.row_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.household_id, p.code, p.name
ORDER BY p.display_order;

COMMENT ON VIEW v_pallet_capacity IS 'Capacity and utilization statistics for each pallet';
```

---

## Database Functions

### Update Position Occupancy

```sql
CREATE OR REPLACE FUNCTION update_position_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  -- When box is assigned to position
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.position_id IS DISTINCT FROM OLD.position_id) THEN
    -- Mark old position as unoccupied
    IF OLD.position_id IS NOT NULL THEN
      UPDATE row_positions
      SET is_occupied = false
      WHERE id = OLD.position_id;
    END IF;

    -- Mark new position as occupied
    IF NEW.position_id IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE row_positions
      SET is_occupied = true
      WHERE id = NEW.position_id;
    END IF;
  END IF;

  -- When box is deleted
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    UPDATE row_positions
    SET is_occupied = false
    WHERE id = COALESCE(OLD.position_id, NEW.position_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_position_occupancy IS 'Automatically update position occupancy when boxes are assigned/removed';
```

### Validate Box Position

```sql
CREATE OR REPLACE FUNCTION validate_box_position()
RETURNS TRIGGER AS $$
DECLARE
  position_occupied BOOLEAN;
  position_active BOOLEAN;
  max_box_type_size NUMERIC;
  box_type_size NUMERIC;
BEGIN
  -- Skip if no position assigned
  IF NEW.position_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if position exists and is active
  SELECT is_occupied, is_active
  INTO position_occupied, position_active
  FROM row_positions
  WHERE id = NEW.position_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position does not exist';
  END IF;

  IF NOT position_active THEN
    RAISE EXCEPTION 'Position is not active';
  END IF;

  -- Check if position is already occupied (unless it's the same box)
  IF position_occupied AND (TG_OP = 'INSERT' OR OLD.position_id IS DISTINCT FROM NEW.position_id) THEN
    -- Allow if the position is occupied by this same box (shouldn't happen but defensive)
    IF NOT EXISTS (
      SELECT 1 FROM boxes
      WHERE position_id = NEW.position_id
      AND id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Position is already occupied';
    END IF;
  END IF;

  -- TODO: Validate box type fits in position (if max_box_type_id is set)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_box_position IS 'Validate that box can be placed in the specified position';
```

### Auto-create Pallet Structure

```sql
CREATE OR REPLACE FUNCTION create_pallet_structure(
  p_pallet_id UUID,
  p_num_rows INTEGER DEFAULT 4,
  p_positions_per_row INTEGER DEFAULT 6
)
RETURNS void AS $$
DECLARE
  v_row_id UUID;
  v_row_num INTEGER;
  v_pos_num INTEGER;
BEGIN
  -- Create rows
  FOR v_row_num IN 1..p_num_rows LOOP
    INSERT INTO pallet_rows (pallet_id, row_number, max_positions)
    VALUES (p_pallet_id, v_row_num, p_positions_per_row)
    RETURNING id INTO v_row_id;

    -- Create positions for this row
    FOR v_pos_num IN 1..p_positions_per_row LOOP
      INSERT INTO row_positions (row_id, position_number)
      VALUES (v_row_id, v_pos_num);
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_pallet_structure IS 'Auto-generate row and position structure for a new pallet';
```

### Generate Box Label

```sql
CREATE OR REPLACE FUNCTION generate_box_label(
  p_household_id UUID,
  p_prefix TEXT DEFAULT 'BOX'
)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_label TEXT;
BEGIN
  -- Get count of existing boxes
  SELECT COUNT(*) + 1
  INTO v_count
  FROM boxes
  WHERE household_id = p_household_id;

  -- Generate label with zero-padding
  v_label := p_prefix || '-' || LPAD(v_count::TEXT, 4, '0');

  -- Check if label already exists, if so increment
  WHILE EXISTS (SELECT 1 FROM boxes WHERE household_id = p_household_id AND label = v_label) LOOP
    v_count := v_count + 1;
    v_label := p_prefix || '-' || LPAD(v_count::TEXT, 4, '0');
  END LOOP;

  RETURN v_label;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_box_label IS 'Generate unique box label for household (e.g., BOX-0001)';
```

### Standard Functions (from v1)

```sql
-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = 'boxtrack://box/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update photo count
CREATE OR REPLACE FUNCTION update_box_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boxes
    SET photo_count = photo_count + 1
    WHERE id = NEW.box_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boxes
    SET photo_count = photo_count - 1
    WHERE id = OLD.box_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

```sql
-- Update timestamps
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pallets_updated_at
  BEFORE UPDATE ON pallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pallet_rows_updated_at
  BEFORE UPDATE ON pallet_rows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_row_positions_updated_at
  BEFORE UPDATE ON row_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
  BEFORE UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_box_types_updated_at
  BEFORE UPDATE ON box_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate QR codes
CREATE TRIGGER generate_box_qr_code
  BEFORE INSERT ON boxes
  FOR EACH ROW EXECUTE FUNCTION generate_qr_code();

-- Update photo counts
CREATE TRIGGER update_photo_count_on_insert
  AFTER INSERT ON photos
  FOR EACH ROW EXECUTE FUNCTION update_box_photo_count();

CREATE TRIGGER update_photo_count_on_delete
  AFTER DELETE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_box_photo_count();

-- Validate and update position occupancy
CREATE TRIGGER validate_box_position_before_insert
  BEFORE INSERT OR UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION validate_box_position();

CREATE TRIGGER update_position_occupancy_after_box_change
  AFTER INSERT OR UPDATE OR DELETE ON boxes
  FOR EACH ROW EXECUTE FUNCTION update_position_occupancy();

-- Auto-create pallet structure
CREATE TRIGGER create_pallet_structure_after_insert
  AFTER INSERT ON pallets
  FOR EACH ROW
  EXECUTE FUNCTION create_pallet_structure(NEW.id, NEW.max_rows, NEW.default_positions_per_row);
```

---

## Example Queries

### Find Available Positions for Box Type

```sql
-- Find available positions that can fit a specific box type
SELECT *
FROM v_available_positions
WHERE household_id = 'xxx'
  AND (
    max_box_type_id IS NULL OR -- No restriction
    max_box_type_id = 'box-type-uuid' OR -- Exact match
    EXISTS ( -- Or box type is smaller
      SELECT 1 FROM box_types bt1
      JOIN box_types bt2 ON bt1.id = max_box_type_id
      WHERE bt1.id = 'box-type-uuid'
      AND bt1.volume_cubic_ft <= bt2.volume_cubic_ft
    )
  )
ORDER BY pallet_code, row_number, position_number
LIMIT 10;
```

### Get Pallet Layout with Boxes

```sql
-- Visual layout of a pallet showing what's in each position
SELECT
  pr.row_number,
  rp.position_number,
  CONCAT(p.code, '/', pr.row_number, '/', rp.position_number) as location,
  rp.is_occupied,
  b.label as box_label,
  b.status as box_status,
  bt.name as box_type,
  c.name as category
FROM pallets p
JOIN pallet_rows pr ON p.id = pr.pallet_id
JOIN row_positions rp ON pr.id = rp.row_id
LEFT JOIN boxes b ON rp.id = b.position_id AND b.deleted_at IS NULL
LEFT JOIN box_types bt ON b.box_type_id = bt.id
LEFT JOIN categories c ON b.category_id = c.id
WHERE p.id = 'pallet-uuid'
ORDER BY pr.row_number DESC, rp.position_number;
```

### Boxes Without Positions (Unassigned)

```sql
SELECT
  b.id,
  b.label,
  b.status,
  bt.name as box_type,
  c.name as category,
  b.created_at
FROM boxes b
LEFT JOIN box_types bt ON b.box_type_id = bt.id
LEFT JOIN categories c ON b.category_id = c.id
WHERE b.household_id = 'xxx'
  AND b.position_id IS NULL
  AND b.deleted_at IS NULL
  AND b.status IN ('packed', 'stored')
ORDER BY b.created_at DESC;
```

### Warehouse Utilization Report

```sql
SELECT
  h.name as household,
  COUNT(DISTINCT p.id) as total_pallets,
  SUM(pc.total_positions) as total_positions,
  SUM(pc.occupied_positions) as occupied_positions,
  SUM(pc.available_positions) as available_positions,
  ROUND(AVG(pc.utilization_percent), 2) as avg_utilization_percent
FROM households h
LEFT JOIN pallets p ON h.id = p.household_id AND p.deleted_at IS NULL
LEFT JOIN v_pallet_capacity pc ON p.id = pc.pallet_id
WHERE h.id = 'xxx'
GROUP BY h.id, h.name;
```

### Box Movement History (requires activity_log)

```sql
-- Track when a box was moved between positions
SELECT
  b.label,
  al.created_at,
  al.description,
  al.metadata->>'old_position' as from_location,
  al.metadata->>'new_position' as to_location,
  u.email as moved_by
FROM activity_log al
JOIN boxes b ON al.box_id = b.id
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.activity_type = 'location_changed'
  AND b.id = 'box-uuid'
ORDER BY al.created_at DESC;
```

---

## Row Level Security (RLS)

### New Tables RLS

#### `box_types`

```sql
ALTER TABLE box_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view box types"
  ON box_types FOR SELECT
  USING (
    is_default = true OR
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage box types"
  ON box_types FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

#### `pallets`

```sql
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household pallets"
  ON pallets FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage pallets"
  ON pallets FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

#### `pallet_rows` & `row_positions`

```sql
ALTER TABLE pallet_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE row_positions ENABLE ROW LEVEL SECURITY;

-- Users can view rows for pallets they have access to
CREATE POLICY "Users can view pallet rows"
  ON pallet_rows FOR SELECT
  USING (
    pallet_id IN (
      SELECT id FROM pallets
      WHERE household_id IN (
        SELECT household_id FROM user_households WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view row positions"
  ON row_positions FOR SELECT
  USING (
    row_id IN (
      SELECT pr.id FROM pallet_rows pr
      JOIN pallets p ON pr.pallet_id = p.id
      WHERE p.household_id IN (
        SELECT household_id FROM user_households WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can manage
CREATE POLICY "Admins can manage rows"
  ON pallet_rows FOR ALL
  USING (
    pallet_id IN (
      SELECT id FROM pallets
      WHERE household_id IN (
        SELECT household_id FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage positions"
  ON row_positions FOR ALL
  USING (
    row_id IN (
      SELECT pr.id FROM pallet_rows pr
      JOIN pallets p ON pr.pallet_id = p.id
      WHERE p.household_id IN (
        SELECT household_id FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );
```

*(Boxes, photos, categories, households, user_households policies remain the same as v1)*

---

## Migration Plan

### Phase 1: Foundation Tables

1. Create `households` table
2. Create `user_households` table with roles
3. Create default household trigger
4. Enable RLS and policies

### Phase 2: Storage Infrastructure

1. Create `box_types` table with defaults
2. Create `pallets` table
3. Create `pallet_rows` table
4. Create `row_positions` table
5. Create auto-structure trigger for pallets
6. Enable RLS on all tables

### Phase 3: Main Entities

1. Create `categories` table with defaults
2. Create `boxes` table (with position_id FK)
3. Create `photos` table
4. Create position validation functions
5. Create position occupancy triggers
6. Enable RLS

### Phase 4: Views & Helpers

1. Create all views (available_positions, boxes_with_location, pallet_capacity)
2. Create helper functions (generate_label, etc.)
3. Create all triggers

### Phase 5: Storage & Testing

1. Create `box-photos` storage bucket
2. Configure storage RLS
3. Test with sample data
4. Validate triggers and functions
5. Performance test queries

---

## Design Decisions & Rationale

### Normalized Locations vs JSONB

**v1:** Used JSONB for location flexibility
**v2:** Full normalization with pallets → rows → positions

**Why the change:**
- ✅ Can validate positions actually exist
- ✅ Track occupancy and availability
- ✅ Support visual warehouse layouts
- ✅ Prevent double-booking positions
- ✅ Enable capacity planning
- ✅ Better queries for "find available space"
- ❌ More complex schema (acceptable trade-off)
- ❌ More JOINs (mitigated by views and indexes)

### Box Types as Table

**Rationale:**
- ✅ Standardize dimensions for consistency
- ✅ Support custom household types
- ✅ Validate box fits in position
- ✅ Calculate capacity by box type
- ✅ Color-code by type in UI

### Auto-Create Pallet Structure

**Rationale:**
- ✅ Reduces manual data entry
- ✅ Ensures consistent structure
- ✅ Can customize per pallet
- ✅ Easy to set up new pallets

### Position Occupancy Triggers

**Rationale:**
- ✅ Automatic consistency
- ✅ Prevent manual errors
- ✅ Real-time availability
- ✅ Reliable capacity tracking

---

## TypeScript Integration

After migration, generate types:

```bash
npx supabase gen types typescript \
  --project-id pocilpskaipllqhmznah \
  > packages/shared/src/database.types.ts
```

Update Zod schemas in `packages/shared/src/schemas.ts` to match new structure.

---

## Next Steps

1. Review and approve v2 schema
2. Decide: Migrate existing v1 implementation or start fresh?
3. Run SQL migration in Supabase
4. Generate TypeScript types
5. Update Zod schemas
6. Implement warehouse management UI
7. Build box assignment workflow
