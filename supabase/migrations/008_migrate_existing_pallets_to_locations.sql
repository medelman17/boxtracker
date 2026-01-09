-- =====================================================
-- BoxTrack Database Migration - Migrate Existing Pallets to Locations
-- =====================================================
-- Version: 2.1.1
-- Date: 2026-01-09
-- Description: Creates default locations for existing households
--              and links existing pallets to those locations.
--              This is a data migration following schema changes in 007.
-- =====================================================

-- =====================================================
-- STEP 1: Create default location for each household
--         that doesn't already have one
-- =====================================================

-- First, check if any households have locations already
-- If not, we create a "Primary Storage" default location for each household

-- Insert default locations for households without any location
INSERT INTO locations (
  household_id,
  name,
  code,
  is_default,
  is_active,
  display_order,
  notes
)
SELECT
  h.id as household_id,
  'Primary Storage' as name,
  'PRIMARY' as code,
  true as is_default,
  true as is_active,
  0 as display_order,
  'Auto-created during migration. Edit to customize your storage location.' as notes
FROM households h
WHERE NOT EXISTS (
  SELECT 1 FROM locations l
  WHERE l.household_id = h.id
  AND l.deleted_at IS NULL
);

-- =====================================================
-- STEP 2: Link existing pallets to their household's
--         default location
-- =====================================================

-- Update all pallets that don't have a location_id
-- to use their household's default location
UPDATE pallets p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.household_id = p.household_id
  AND l.is_default = true
  AND l.deleted_at IS NULL
  LIMIT 1
)
WHERE p.location_id IS NULL
AND p.deleted_at IS NULL;

-- =====================================================
-- STEP 3: Optionally migrate warehouse_zone to location
--         if it contains meaningful distinct values
-- =====================================================

-- This creates additional locations based on distinct warehouse_zone values
-- Only runs if there are pallets with non-empty warehouse_zone that differs
-- from the default "Primary Storage"

-- Create locations for each distinct warehouse_zone value
-- (only for zones not matching 'PRIMARY' or empty)
INSERT INTO locations (
  household_id,
  name,
  code,
  is_default,
  is_active,
  display_order,
  notes
)
SELECT DISTINCT
  p.household_id,
  p.warehouse_zone as name,
  UPPER(SUBSTRING(REGEXP_REPLACE(p.warehouse_zone, '[^a-zA-Z0-9]', '', 'g'), 1, 10)) as code,
  false as is_default,
  true as is_active,
  1 as display_order,
  'Migrated from warehouse_zone field' as notes
FROM pallets p
WHERE p.warehouse_zone IS NOT NULL
AND p.warehouse_zone <> ''
AND p.warehouse_zone <> 'PRIMARY'
AND p.deleted_at IS NULL
AND NOT EXISTS (
  -- Don't create duplicate locations with same name for this household
  SELECT 1 FROM locations l
  WHERE l.household_id = p.household_id
  AND LOWER(l.name) = LOWER(p.warehouse_zone)
  AND l.deleted_at IS NULL
);

-- Update pallets to use locations matching their warehouse_zone
-- (for pallets that had a warehouse_zone that became a separate location)
UPDATE pallets p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.household_id = p.household_id
  AND LOWER(l.name) = LOWER(p.warehouse_zone)
  AND l.deleted_at IS NULL
  LIMIT 1
)
WHERE p.warehouse_zone IS NOT NULL
AND p.warehouse_zone <> ''
AND p.warehouse_zone <> 'PRIMARY'
AND p.deleted_at IS NULL
AND EXISTS (
  SELECT 1 FROM locations l
  WHERE l.household_id = p.household_id
  AND LOWER(l.name) = LOWER(p.warehouse_zone)
  AND l.deleted_at IS NULL
);

-- =====================================================
-- STEP 4: Verification queries (run manually to verify)
-- =====================================================

-- Uncomment these to verify migration results:

-- Check all households have at least one location:
-- SELECT h.id, h.name, COUNT(l.id) as location_count
-- FROM households h
-- LEFT JOIN locations l ON l.household_id = h.id AND l.deleted_at IS NULL
-- GROUP BY h.id, h.name;

-- Check all pallets have a location:
-- SELECT COUNT(*) as pallets_without_location
-- FROM pallets
-- WHERE location_id IS NULL AND deleted_at IS NULL;

-- Check location capacity view works:
-- SELECT * FROM v_location_capacity;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary of changes:
-- 1. Created 'Primary Storage' location for each household
-- 2. Linked all existing pallets to their default location
-- 3. Optionally created separate locations from warehouse_zone values
--
-- Note: warehouse_zone and location_description columns remain
-- for backward compatibility. These will be deprecated in a future release.
