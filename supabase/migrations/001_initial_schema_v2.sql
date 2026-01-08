-- =====================================================
-- BoxTrack Database Schema V2 - Initial Migration
-- =====================================================
-- Version: 2.0.0
-- Date: 2026-01-07
-- Description: Complete warehouse management schema with
--              physical location tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE box_status AS ENUM ('stored', 'in_transit', 'delivered', 'archived');

-- =====================================================
-- TABLES
-- =====================================================

-- -----------------------------------------------------
-- 1. HOUSEHOLDS
-- -----------------------------------------------------

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,

  -- Settings (FK added later after box_types table)
  default_box_type_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT households_name_check CHECK (char_length(name) >= 1)
);

COMMENT ON TABLE households IS 'Organizations or groups sharing box inventory';
COMMENT ON COLUMN households.slug IS 'URL-friendly unique identifier for household';

CREATE INDEX idx_households_slug ON households(slug);
CREATE INDEX idx_households_created_at ON households(created_at DESC);

-- -----------------------------------------------------
-- 2. USER_HOUSEHOLDS (Many-to-Many with Roles)
-- -----------------------------------------------------

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
COMMENT ON COLUMN user_households.role IS 'owner: full control, admin: manage users, member: manage boxes, viewer: read-only';

CREATE INDEX idx_user_households_user_id ON user_households(user_id);
CREATE INDEX idx_user_households_household_id ON user_households(household_id);
CREATE INDEX idx_user_households_role ON user_households(household_id, role);

-- -----------------------------------------------------
-- 3. BOX_TYPES (Standardized Box Sizes)
-- -----------------------------------------------------

CREATE TABLE box_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,

  -- Type Information
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20),
  description TEXT,

  -- Dimensions (in inches)
  length NUMERIC(6,2),
  width NUMERIC(6,2),
  height NUMERIC(6,2),

  -- Weight and capacity
  weight_limit_lbs NUMERIC(6,2),
  volume_cubic_ft NUMERIC(8,2),

  -- Visual
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),

  -- Meta
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT box_types_unique_per_household UNIQUE(household_id, name),
  CONSTRAINT box_types_dimensions_positive CHECK (
    (length IS NULL OR length > 0) AND
    (width IS NULL OR width > 0) AND
    (height IS NULL OR height > 0)
  )
);

COMMENT ON TABLE box_types IS 'Standardized box sizes with dimensions and specifications';
COMMENT ON COLUMN box_types.household_id IS 'NULL for system defaults, set for household-specific types';

CREATE INDEX idx_box_types_household_id ON box_types(household_id);
CREATE INDEX idx_box_types_active ON box_types(household_id, is_active) WHERE is_active = true;
CREATE INDEX idx_box_types_display_order ON box_types(household_id, display_order);

-- Add FK to households now that box_types exists
ALTER TABLE households
  ADD CONSTRAINT households_default_box_type_fk
  FOREIGN KEY (default_box_type_id) REFERENCES box_types(id) ON DELETE SET NULL;

-- -----------------------------------------------------
-- 4. CATEGORIES (Box Organization)
-- -----------------------------------------------------

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
COMMENT ON COLUMN categories.household_id IS 'NULL for system defaults, set for household-specific categories';

CREATE INDEX idx_categories_household_id ON categories(household_id);
CREATE INDEX idx_categories_display_order ON categories(household_id, display_order);

-- -----------------------------------------------------
-- 5. PALLETS (Physical Storage Platforms)
-- -----------------------------------------------------

CREATE TABLE pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Identification
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  description TEXT,

  -- Physical location
  location_description TEXT,
  warehouse_zone VARCHAR(50),

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

CREATE INDEX idx_pallets_household_id ON pallets(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pallets_code ON pallets(household_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_pallets_active ON pallets(household_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_pallets_display_order ON pallets(household_id, display_order);

-- -----------------------------------------------------
-- 6. PALLET_ROWS (Rows on Each Pallet)
-- -----------------------------------------------------

CREATE TABLE pallet_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,

  -- Row identification
  row_number INTEGER NOT NULL,
  label VARCHAR(50),

  -- Configuration
  max_positions INTEGER NOT NULL DEFAULT 6,
  height_from_ground_inches NUMERIC(6,2),

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

CREATE INDEX idx_pallet_rows_pallet_id ON pallet_rows(pallet_id, row_number);
CREATE INDEX idx_pallet_rows_active ON pallet_rows(pallet_id, is_active) WHERE is_active = true;

-- -----------------------------------------------------
-- 7. ROW_POSITIONS (Storage Slots within Rows)
-- -----------------------------------------------------

CREATE TABLE row_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES pallet_rows(id) ON DELETE CASCADE,

  -- Position identification
  position_number INTEGER NOT NULL,
  label VARCHAR(50),

  -- Constraints
  max_box_type_id UUID REFERENCES box_types(id) ON DELETE SET NULL,

  -- Status
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_reserved BOOLEAN NOT NULL DEFAULT false,
  reserved_for VARCHAR(100),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT row_positions_unique_per_row UNIQUE(row_id, position_number),
  CONSTRAINT row_positions_position_number_positive CHECK (position_number > 0)
);

COMMENT ON TABLE row_positions IS 'Specific storage positions within each row';
COMMENT ON COLUMN row_positions.is_occupied IS 'Automatically updated when box assigned/removed';
COMMENT ON COLUMN row_positions.max_box_type_id IS 'Maximum box size that can fit in this position';

CREATE INDEX idx_row_positions_row_id ON row_positions(row_id, position_number);
CREATE INDEX idx_row_positions_occupied ON row_positions(row_id, is_occupied);
CREATE INDEX idx_row_positions_available ON row_positions(row_id, is_active, is_occupied)
  WHERE is_active = true AND is_occupied = false AND is_reserved = false;

-- -----------------------------------------------------
-- 8. BOXES (Core Entity)
-- -----------------------------------------------------

CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Box Information
  label VARCHAR(100) NOT NULL,
  description TEXT,
  status box_status NOT NULL DEFAULT 'stored',

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
  assigned_to UUID REFERENCES auth.users(id),

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

CREATE INDEX idx_boxes_household_id ON boxes(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_status ON boxes(household_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_position_id ON boxes(position_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_box_type_id ON boxes(box_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_category_id ON boxes(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_qr_code ON boxes(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_created_at ON boxes(household_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_assigned_to ON boxes(assigned_to) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_boxes_label_search ON boxes
  USING gin(to_tsvector('english', label || ' ' || COALESCE(description, '')))
  WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX idx_boxes_household_status_created ON boxes(household_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------
-- 9. PHOTOS (Box Content Images)
-- -----------------------------------------------------

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
COMMENT ON COLUMN photos.storage_path IS 'Path in Supabase Storage: household_id/box_id/filename.jpg';
COMMENT ON COLUMN photos.display_order IS 'Order for displaying photos within a box';

CREATE INDEX idx_photos_box_id ON photos(box_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_created_at ON photos(box_id, created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Update Timestamps
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp';

-- -----------------------------------------------------
-- Generate QR Code
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = 'boxtrack://box/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_qr_code IS 'Auto-generate QR code content for boxes';

-- -----------------------------------------------------
-- Update Photo Count
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_box_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boxes
    SET photo_count = photo_count + 1
    WHERE id = NEW.box_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boxes
    SET photo_count = GREATEST(photo_count - 1, 0)
    WHERE id = OLD.box_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_box_photo_count IS 'Maintain photo_count in boxes table';

-- -----------------------------------------------------
-- Update Position Occupancy
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_position_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  -- When box is assigned to position
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.position_id IS DISTINCT FROM OLD.position_id) THEN
    -- Mark old position as unoccupied
    IF TG_OP = 'UPDATE' AND OLD.position_id IS NOT NULL THEN
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

  -- When box is deleted (soft delete)
  IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE row_positions
    SET is_occupied = false
    WHERE id = NEW.position_id;
  END IF;

  -- When box is hard deleted
  IF TG_OP = 'DELETE' AND OLD.position_id IS NOT NULL THEN
    UPDATE row_positions
    SET is_occupied = false
    WHERE id = OLD.position_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_position_occupancy IS 'Automatically update position occupancy when boxes assigned/removed';

-- -----------------------------------------------------
-- Validate Box Position
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION validate_box_position()
RETURNS TRIGGER AS $$
DECLARE
  position_occupied BOOLEAN;
  position_active BOOLEAN;
  position_reserved BOOLEAN;
BEGIN
  -- Skip if no position assigned
  IF NEW.position_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if position exists and get status
  SELECT is_occupied, is_active, is_reserved
  INTO position_occupied, position_active, position_reserved
  FROM row_positions
  WHERE id = NEW.position_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position does not exist';
  END IF;

  IF NOT position_active THEN
    RAISE EXCEPTION 'Position is not active';
  END IF;

  -- Check if position is already occupied (unless it's an update to the same box)
  IF position_occupied THEN
    -- Allow if this is an update and position hasn't changed
    IF TG_OP = 'UPDATE' AND OLD.position_id = NEW.position_id THEN
      RETURN NEW;
    END IF;

    -- Otherwise, check if another box occupies this position
    IF EXISTS (
      SELECT 1 FROM boxes
      WHERE position_id = NEW.position_id
      AND id != NEW.id
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Position is already occupied by another box';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_box_position IS 'Validate box can be placed in specified position';

-- -----------------------------------------------------
-- Auto-Create Pallet Structure
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION create_pallet_structure()
RETURNS TRIGGER AS $$
DECLARE
  v_row_id UUID;
  v_row_num INTEGER;
  v_pos_num INTEGER;
BEGIN
  -- Create rows for the new pallet
  FOR v_row_num IN 1..NEW.max_rows LOOP
    INSERT INTO pallet_rows (pallet_id, row_number, max_positions)
    VALUES (NEW.id, v_row_num, NEW.default_positions_per_row)
    RETURNING id INTO v_row_id;

    -- Create positions for this row
    FOR v_pos_num IN 1..NEW.default_positions_per_row LOOP
      INSERT INTO row_positions (row_id, position_number)
      VALUES (v_row_id, v_pos_num);
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_pallet_structure IS 'Auto-generate row and position structure for new pallets';

-- -----------------------------------------------------
-- Generate Box Label
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION generate_box_label(
  p_household_id UUID,
  p_prefix TEXT DEFAULT 'BOX'
)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_label TEXT;
BEGIN
  -- Get count of existing boxes (including deleted for sequential numbering)
  SELECT COUNT(*) + 1
  INTO v_count
  FROM boxes
  WHERE household_id = p_household_id;

  -- Generate label with zero-padding
  v_label := p_prefix || '-' || LPAD(v_count::TEXT, 4, '0');

  -- Ensure uniqueness
  WHILE EXISTS (
    SELECT 1 FROM boxes
    WHERE household_id = p_household_id
    AND label = v_label
  ) LOOP
    v_count := v_count + 1;
    v_label := p_prefix || '-' || LPAD(v_count::TEXT, 4, '0');
  END LOOP;

  RETURN v_label;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_box_label IS 'Generate unique box label (e.g., BOX-0001)';

-- -----------------------------------------------------
-- Create Default Household for New User
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION create_default_household()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Create default household for new user
  INSERT INTO households (name, slug)
  VALUES (
    user_name || '''s Household',
    'household-' || substr(NEW.id::text, 1, 8)
  )
  RETURNING id INTO new_household_id;

  -- Add user as owner
  INSERT INTO user_households (user_id, household_id, role)
  VALUES (NEW.id, new_household_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_household IS 'Auto-create household when user signs up';

-- =====================================================
-- TRIGGERS
-- =====================================================

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
CREATE TRIGGER validate_box_position_before_change
  BEFORE INSERT OR UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION validate_box_position();

CREATE TRIGGER update_position_occupancy_after_box_change
  AFTER INSERT OR UPDATE OR DELETE ON boxes
  FOR EACH ROW EXECUTE FUNCTION update_position_occupancy();

-- Auto-create pallet structure
CREATE TRIGGER create_pallet_structure_after_insert
  AFTER INSERT ON pallets
  FOR EACH ROW EXECUTE FUNCTION create_pallet_structure();

-- Create default household for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_household();

-- =====================================================
-- VIEWS
-- =====================================================

-- -----------------------------------------------------
-- Available Positions View
-- -----------------------------------------------------

CREATE VIEW v_available_positions AS
SELECT
  rp.id as position_id,
  h.id as household_id,
  h.name as household_name,
  p.id as pallet_id,
  p.code as pallet_code,
  p.name as pallet_name,
  p.warehouse_zone,
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

-- -----------------------------------------------------
-- Boxes with Location View
-- -----------------------------------------------------

CREATE VIEW v_boxes_with_location AS
SELECT
  b.id,
  b.household_id,
  b.label,
  b.description,
  b.status,
  b.qr_code,
  b.photo_count,
  b.actual_weight_lbs,

  -- Location
  b.position_id,
  CASE
    WHEN p.code IS NOT NULL THEN CONCAT(p.code, '/', pr.row_number, '/', rp.position_number)
    ELSE NULL
  END as location,
  p.id as pallet_id,
  p.code as pallet_code,
  p.name as pallet_name,
  p.warehouse_zone,
  pr.id as row_id,
  pr.row_number,
  rp.id as position_id_full,
  rp.position_number,

  -- Box Type
  bt.id as box_type_id,
  bt.name as box_type_name,
  bt.code as box_type_code,
  bt.length,
  bt.width,
  bt.height,
  bt.weight_limit_lbs,

  -- Category
  c.id as category_id,
  c.name as category_name,
  c.color as category_color,
  c.icon as category_icon,

  -- Assignments
  b.created_by,
  b.assigned_to,

  -- Timestamps
  b.created_at,
  b.updated_at,
  b.packed_at,
  b.stored_at,
  b.retrieved_at

FROM boxes b
LEFT JOIN row_positions rp ON b.position_id = rp.id
LEFT JOIN pallet_rows pr ON rp.row_id = pr.id
LEFT JOIN pallets p ON pr.pallet_id = p.id
LEFT JOIN box_types bt ON b.box_type_id = bt.id
LEFT JOIN categories c ON b.category_id = c.id
WHERE b.deleted_at IS NULL;

COMMENT ON VIEW v_boxes_with_location IS 'Denormalized boxes with full location and type details';

-- -----------------------------------------------------
-- Pallet Capacity View
-- -----------------------------------------------------

CREATE VIEW v_pallet_capacity AS
SELECT
  p.id as pallet_id,
  p.household_id,
  p.code,
  p.name,
  p.warehouse_zone,
  COUNT(DISTINCT pr.id) as total_rows,
  COUNT(rp.id) as total_positions,
  COUNT(rp.id) FILTER (WHERE rp.is_occupied = true) as occupied_positions,
  COUNT(rp.id) FILTER (WHERE rp.is_occupied = false AND rp.is_active = true AND rp.is_reserved = false) as available_positions,
  COUNT(rp.id) FILTER (WHERE rp.is_reserved = true) as reserved_positions,
  ROUND(
    (COUNT(rp.id) FILTER (WHERE rp.is_occupied = true)::NUMERIC /
     NULLIF(COUNT(rp.id), 0) * 100)::NUMERIC,
    2
  ) as utilization_percent
FROM pallets p
LEFT JOIN pallet_rows pr ON p.id = pr.pallet_id
LEFT JOIN row_positions rp ON pr.id = rp.row_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.household_id, p.code, p.name, p.warehouse_zone
ORDER BY p.display_order;

COMMENT ON VIEW v_pallet_capacity IS 'Capacity and utilization statistics for each pallet';

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- -----------------------------------------------------
-- Default Box Types
-- -----------------------------------------------------

INSERT INTO box_types (household_id, name, code, length, width, height, weight_limit_lbs, volume_cubic_ft, color, icon, is_default, display_order) VALUES
  (NULL, 'Small', 'SM', 16.00, 12.00, 12.00, 35.00, 1.33, '#10B981', '📦', true, 1),
  (NULL, 'Medium', 'MD', 18.00, 14.00, 12.00, 45.00, 1.75, '#3B82F6', '📦', true, 2),
  (NULL, 'Large', 'LG', 20.00, 20.00, 15.00, 65.00, 2.89, '#F59E0B', '📦', true, 3),
  (NULL, 'Extra Large', 'XL', 24.00, 18.00, 18.00, 75.00, 4.50, '#EF4444', '📦', true, 4),
  (NULL, 'Wardrobe', 'WR', 24.00, 24.00, 40.00, 100.00, 13.33, '#8B5CF6', '👔', true, 5),
  (NULL, 'File Box', 'FILE', 15.00, 12.00, 10.00, 30.00, 1.04, '#06B6D4', '📄', true, 6);

-- -----------------------------------------------------
-- Default Categories
-- -----------------------------------------------------

INSERT INTO categories (household_id, name, color, icon, is_default, display_order) VALUES
  (NULL, 'Kitchen', '#EF4444', '🍳', true, 1),
  (NULL, 'Bedroom', '#8B5CF6', '🛏️', true, 2),
  (NULL, 'Bathroom', '#06B6D4', '🚿', true, 3),
  (NULL, 'Office', '#F59E0B', '💼', true, 4),
  (NULL, 'Living Room', '#10B981', '🛋️', true, 5),
  (NULL, 'Garage', '#6B7280', '🔧', true, 6),
  (NULL, 'Other', '#EC4899', '📦', true, 7);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE row_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- HOUSEHOLDS Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can update household"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can delete household"
  ON households FOR DELETE
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- -----------------------------------------------------
-- USER_HOUSEHOLDS Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view household members"
  ON user_households FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON user_households FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON user_households FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can remove members, users can leave"
  ON user_households FOR DELETE
  USING (
    user_id = auth.uid() OR
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- -----------------------------------------------------
-- BOX_TYPES Policies
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- CATEGORIES Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (
    is_default = true OR
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create categories"
  ON categories FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------
-- PALLETS Policies
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- PALLET_ROWS Policies
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- ROW_POSITIONS Policies
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- BOXES Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view household boxes"
  ON boxes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create boxes"
  ON boxes FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can update boxes"
  ON boxes FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can delete boxes"
  ON boxes FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- -----------------------------------------------------
-- PHOTOS Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view household box photos"
  ON photos FOR SELECT
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id FROM user_households WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can add photos"
  ON photos FOR INSERT
  WITH CHECK (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "Members can update photos"
  ON photos FOR UPDATE
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "Members can delete photos"
  ON photos FOR DELETE
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =====================================================
-- STORAGE BUCKET (Execute separately in Supabase Dashboard)
-- =====================================================

-- Create the storage bucket
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('box-photos', 'box-photos', false);

-- Storage RLS Policies (apply after bucket created)
-- CREATE POLICY "Users can upload to household folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'box-photos' AND
--     (storage.foldername(name))[1]::uuid IN (
--       SELECT household_id::text
--       FROM user_households
--       WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
--     )
--   );

-- CREATE POLICY "Users can view household photos"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'box-photos' AND
--     (storage.foldername(name))[1]::uuid IN (
--       SELECT household_id::text
--       FROM user_households
--       WHERE user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can delete household photos"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'box-photos' AND
--     (storage.foldername(name))[1]::uuid IN (
--       SELECT household_id::text
--       FROM user_households
--       WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
--     )
--   );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- You can verify the migration with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM box_types WHERE is_default = true;
-- SELECT * FROM categories WHERE is_default = true;
