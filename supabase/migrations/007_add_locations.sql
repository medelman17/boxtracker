-- =====================================================
-- BoxTrack Database Migration - Add Locations
-- =====================================================
-- Version: 2.1.0
-- Date: 2026-01-09
-- Description: Adds locations table to represent storage
--              spaces (storage units, warehouses, etc.)
-- =====================================================

-- =====================================================
-- 1. CREATE LOCATIONS TABLE
-- =====================================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Core identity
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),

  -- Facility information
  facility_name VARCHAR(200),
  facility_address TEXT,

  -- Dimensions (in feet)
  width_feet NUMERIC(6,2),
  depth_feet NUMERIC(6,2),
  height_feet NUMERIC(6,2),
  square_feet NUMERIC(8,2),

  -- Access information
  access_code VARCHAR(100),
  access_hours VARCHAR(200),

  -- Metadata
  notes TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),

  -- Status and ordering
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT locations_name_length CHECK (char_length(name) >= 1),
  CONSTRAINT locations_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT locations_dimensions_positive CHECK (
    (width_feet IS NULL OR width_feet > 0) AND
    (depth_feet IS NULL OR depth_feet > 0) AND
    (height_feet IS NULL OR height_feet > 0) AND
    (square_feet IS NULL OR square_feet > 0)
  )
);

COMMENT ON TABLE locations IS 'Storage locations (units, warehouses, garages) containing pallets';
COMMENT ON COLUMN locations.code IS 'Short code for labels (e.g., U142, GAR)';
COMMENT ON COLUMN locations.facility_name IS 'Name of storage facility (e.g., Public Storage - Main St)';
COMMENT ON COLUMN locations.access_code IS 'Gate/unit access codes';
COMMENT ON COLUMN locations.is_default IS 'Default location for new pallets';

-- Indexes
CREATE INDEX idx_locations_household ON locations(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_active ON locations(household_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_display_order ON locations(household_id, display_order);
CREATE INDEX idx_locations_code ON locations(household_id, code) WHERE deleted_at IS NULL;

-- Unique constraint: only one default per household
CREATE UNIQUE INDEX idx_locations_one_default_per_household
  ON locations(household_id)
  WHERE is_default = true AND deleted_at IS NULL;

-- =====================================================
-- 2. ADD LOCATION_ID TO PALLETS
-- =====================================================

ALTER TABLE pallets
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN pallets.location_id IS 'Storage location containing this pallet';

CREATE INDEX idx_pallets_location ON pallets(location_id) WHERE deleted_at IS NULL;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Update timestamps trigger
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Users can view locations in their households
CREATE POLICY "Users can view household locations"
  ON locations FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

-- Owners and admins can create locations
CREATE POLICY "Admins can create locations"
  ON locations FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update locations
CREATE POLICY "Admins can update locations"
  ON locations FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can delete locations
CREATE POLICY "Admins can delete locations"
  ON locations FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 5. UPDATE VIEWS
-- =====================================================

-- Drop and recreate v_available_positions with location info
DROP VIEW IF EXISTS v_available_positions;

CREATE VIEW v_available_positions AS
SELECT
  rp.id as position_id,
  h.id as household_id,
  h.name as household_name,
  -- Location info (NEW)
  l.id as location_id,
  l.name as location_name,
  l.code as location_code,
  l.facility_name,
  -- Pallet info
  p.id as pallet_id,
  p.code as pallet_code,
  p.name as pallet_name,
  p.warehouse_zone,
  -- Row and position info
  pr.id as row_id,
  pr.row_number,
  rp.position_number,
  -- Full location string (updated to include location)
  CASE
    WHEN l.code IS NOT NULL THEN CONCAT(l.code, ' > ', p.code, '/', pr.row_number, '/', rp.position_number)
    ELSE CONCAT(p.code, '/', pr.row_number, '/', rp.position_number)
  END as full_location,
  bt.name as max_box_type,
  bt.id as max_box_type_id,
  rp.is_reserved,
  rp.reserved_for,
  rp.notes
FROM row_positions rp
JOIN pallet_rows pr ON rp.row_id = pr.id
JOIN pallets p ON pr.pallet_id = p.id
JOIN households h ON p.household_id = h.id
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN box_types bt ON rp.max_box_type_id = bt.id
WHERE rp.is_active = true
  AND rp.is_occupied = false
  AND pr.is_active = true
  AND p.is_active = true
  AND p.deleted_at IS NULL
ORDER BY h.id, COALESCE(l.display_order, 0), p.display_order, pr.row_number, rp.position_number;

COMMENT ON VIEW v_available_positions IS 'All available storage positions with full location details including storage location';

-- Drop and recreate v_boxes_with_location with location info
DROP VIEW IF EXISTS v_boxes_with_location;

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

  -- Storage Location (NEW)
  l.id as location_id,
  l.name as location_name,
  l.code as location_code,
  l.facility_name,
  l.color as location_color,

  -- Pallet Location
  b.position_id,
  CASE
    WHEN p.code IS NOT NULL AND l.code IS NOT NULL THEN CONCAT(l.code, ' > ', p.code, '/', pr.row_number, '/', rp.position_number)
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
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN box_types bt ON b.box_type_id = bt.id
LEFT JOIN categories c ON b.category_id = c.id
WHERE b.deleted_at IS NULL;

COMMENT ON VIEW v_boxes_with_location IS 'Denormalized boxes with full location details including storage location';

-- Drop and recreate v_pallet_capacity with location info
DROP VIEW IF EXISTS v_pallet_capacity;

CREATE VIEW v_pallet_capacity AS
SELECT
  p.id as pallet_id,
  p.household_id,
  p.code,
  p.name,
  p.warehouse_zone,
  -- Location info (NEW)
  l.id as location_id,
  l.name as location_name,
  l.code as location_code,
  -- Capacity stats
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
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN pallet_rows pr ON p.id = pr.pallet_id
LEFT JOIN row_positions rp ON pr.id = rp.row_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.household_id, p.code, p.name, p.warehouse_zone, l.id, l.name, l.code
ORDER BY COALESCE(l.display_order, 0), p.display_order;

COMMENT ON VIEW v_pallet_capacity IS 'Capacity and utilization statistics for each pallet with location info';

-- =====================================================
-- 6. NEW VIEW: LOCATION CAPACITY
-- =====================================================

CREATE VIEW v_location_capacity AS
SELECT
  l.id as location_id,
  l.household_id,
  l.name as location_name,
  l.code as location_code,
  l.facility_name,
  l.color,
  l.is_active,
  l.is_default,

  -- Pallet counts
  COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL) as total_pallets,
  COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL AND p.is_active) as active_pallets,

  -- Position counts (via pallets)
  COUNT(DISTINCT rp.id) as total_positions,
  COUNT(DISTINCT rp.id) FILTER (WHERE rp.is_occupied) as occupied_positions,
  COUNT(DISTINCT rp.id) FILTER (WHERE NOT rp.is_occupied AND rp.is_active AND NOT rp.is_reserved) as available_positions,

  -- Box count
  COUNT(DISTINCT b.id) FILTER (WHERE b.deleted_at IS NULL) as box_count,

  -- Utilization
  CASE
    WHEN COUNT(DISTINCT rp.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT rp.id) FILTER (WHERE rp.is_occupied)::NUMERIC /
       COUNT(DISTINCT rp.id)::NUMERIC) * 100,
      1
    )
  END as utilization_percent

FROM locations l
LEFT JOIN pallets p ON p.location_id = l.id AND p.deleted_at IS NULL
LEFT JOIN pallet_rows pr ON pr.pallet_id = p.id AND pr.is_active
LEFT JOIN row_positions rp ON rp.row_id = pr.id
LEFT JOIN boxes b ON b.position_id = rp.id AND b.deleted_at IS NULL
WHERE l.deleted_at IS NULL
GROUP BY l.id, l.household_id, l.name, l.code, l.facility_name, l.color, l.is_active, l.is_default
ORDER BY l.display_order;

COMMENT ON VIEW v_location_capacity IS 'Capacity and utilization statistics for each storage location';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify with:
-- SELECT * FROM locations;
-- SELECT * FROM v_location_capacity;
-- SELECT location_id FROM pallets LIMIT 5;
