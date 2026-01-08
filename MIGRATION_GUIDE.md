# Database Migration Guide - Schema V2

## Overview

This guide walks you through deploying the BoxTrack V2 database schema to your Supabase project.

**Migration File:** `supabase/migrations/001_initial_schema_v2.sql`

---

## Pre-Migration Checklist

- [ ] Backup current database (if applicable)
- [ ] Confirm Supabase project ID: `pocilpskaipllqhmznah`
- [ ] Have Supabase dashboard access
- [ ] Review schema documentation (`DATABASE_SCHEMA_V2.md`)
- [ ] Understand RLS policies (`SECURITY.md`)

---

## Migration Steps

### Step 1: Access Supabase SQL Editor

1. Go to https://app.supabase.com/project/pocilpskaipllqhmznah
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration

**Option A: Copy/Paste (Recommended for first-time)**

1. Open `supabase/migrations/001_initial_schema_v2.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`
5. Wait for completion (should take 10-30 seconds)

**Option B: Using Supabase CLI (Advanced)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref pocilpskaipllqhmznah

# Run migration
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

### Step 3: Verify Migration

Run this verification query in SQL Editor:

```sql
-- Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- boxes
-- box_types
-- categories
-- households
-- pallet_rows
-- pallets
-- photos
-- row_positions
-- user_households
```

Expected result: **9 tables**

### Step 4: Verify Default Data

```sql
-- Check default box types
SELECT name, code, is_default
FROM box_types
WHERE is_default = true
ORDER BY display_order;

-- Expected: 6 box types (Small, Medium, Large, XL, Wardrobe, File Box)

-- Check default categories
SELECT name, is_default
FROM categories
WHERE is_default = true
ORDER BY display_order;

-- Expected: 7 categories (Kitchen, Bedroom, Bathroom, Office, Living Room, Garage, Other)
```

### Step 5: Verify RLS Policies

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All should have rowsecurity = true

-- Check policy count
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

Expected policies:
- `households`: 4 policies
- `user_households`: 4 policies
- `box_types`: 2 policies
- `categories`: 4 policies
- `pallets`: 2 policies
- `pallet_rows`: 2 policies
- `row_positions`: 2 policies
- `boxes`: 4 policies
- `photos`: 4 policies

### Step 6: Create Storage Bucket

**Important:** Storage buckets must be created separately from SQL migrations.

1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `box-photos`
4. Public: **OFF** (unchecked)
5. File size limit: 50 MB (recommended)
6. Allowed MIME types: `image/*` (or specific: `image/jpeg,image/png,image/webp`)
7. Click **Create Bucket**

### Step 7: Apply Storage RLS Policies

Go to **Storage > box-photos > Policies** and create three policies:

**Policy 1: Upload to household folder**
```sql
CREATE POLICY "Users can upload to household folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'box-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT household_id::text
    FROM user_households
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  )
);
```

**Policy 2: View household photos**
```sql
CREATE POLICY "Users can view household photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'box-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT household_id::text
    FROM user_households
    WHERE user_id = auth.uid()
  )
);
```

**Policy 3: Delete household photos**
```sql
CREATE POLICY "Users can delete household photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'box-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT household_id::text
    FROM user_households
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  )
);
```

### Step 8: Test User Creation Trigger

The migration includes a trigger that auto-creates a household when a user signs up.

**Test it:**

1. Create a test user via Supabase Auth or your app
2. Check that a household was created:

```sql
SELECT u.email, h.name, uh.role
FROM auth.users u
JOIN user_households uh ON u.id = uh.user_id
JOIN households h ON uh.household_id = h.id
WHERE u.email = 'test@example.com';
```

Expected: User should be 'owner' of a household named "[User]'s Household"

---

## Post-Migration Tasks

### 1. Generate TypeScript Types

```bash
cd /Users/medelman/GitHub/medelman17/boxtracker

npx supabase gen types typescript \
  --project-id pocilpskaipllqhmznah \
  > packages/shared/src/database.types.ts
```

This creates TypeScript types matching your database schema.

### 2. Update Zod Schemas

Update `packages/shared/src/schemas.ts` to match the new V2 structure:

- Add `box_type_id` to box schemas
- Remove JSONB `location` field
- Add `position_id` field
- Add new schemas for pallets, rows, positions

### 3. Test RLS Policies

Create a test user and verify:
- Can see their household
- Can create boxes in their household
- Cannot see other households' data
- Can upload photos to storage

### 4. Create Initial Warehouse Setup

For each household, create at least one pallet:

```sql
-- This will auto-create rows and positions via trigger
INSERT INTO pallets (household_id, code, name, max_rows, default_positions_per_row)
VALUES
  ('your-household-id', 'A', 'Pallet A', 4, 6);

-- Verify structure was created
SELECT
  p.code,
  COUNT(DISTINCT pr.id) as rows,
  COUNT(rp.id) as positions
FROM pallets p
LEFT JOIN pallet_rows pr ON p.id = pr.pallet_id
LEFT JOIN row_positions rp ON pr.id = rp.row_id
WHERE p.household_id = 'your-household-id'
GROUP BY p.id, p.code;

-- Expected: Pallet A with 4 rows and 24 positions
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Tables already exist from a previous migration

**Solution:**
```sql
-- Drop all tables (WARNING: Deletes all data!)
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS row_positions CASCADE;
DROP TABLE IF EXISTS pallet_rows CASCADE;
DROP TABLE IF EXISTS pallets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS box_types CASCADE;
DROP TABLE IF EXISTS user_households CASCADE;
DROP TABLE IF EXISTS households CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS box_status CASCADE;

-- Then re-run migration
```

### Error: "function already exists"

**Solution:**
```sql
-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS generate_qr_code CASCADE;
DROP FUNCTION IF EXISTS update_box_photo_count CASCADE;
DROP FUNCTION IF EXISTS update_position_occupancy CASCADE;
DROP FUNCTION IF EXISTS validate_box_position CASCADE;
DROP FUNCTION IF EXISTS create_pallet_structure CASCADE;
DROP FUNCTION IF EXISTS generate_box_label CASCADE;
DROP FUNCTION IF EXISTS create_default_household CASCADE;

-- Then re-run migration
```

### Error: "trigger already exists"

Functions and triggers will auto-replace with `CREATE OR REPLACE` and `DROP TRIGGER IF EXISTS`.

### Storage Policy Errors

If storage policies fail, ensure:
1. Bucket `box-photos` exists
2. You're applying policies in Storage UI, not SQL Editor
3. Policies use correct syntax for `storage.objects` table

### RLS Not Working

Verify auth context:
```sql
-- Check current user
SELECT auth.uid(), auth.email();

-- Should return your user ID and email when authenticated
-- Returns NULL if not authenticated
```

---

## Verification Queries

### Test Pallet Creation

```sql
-- Get your household ID
SELECT id, name FROM households WHERE slug LIKE 'household-%' LIMIT 1;

-- Create test pallet (replace household_id)
INSERT INTO pallets (household_id, code, name, max_rows, default_positions_per_row)
VALUES ('your-household-uuid', 'TEST', 'Test Pallet', 3, 4)
RETURNING id;

-- Verify auto-created structure
SELECT * FROM v_pallet_capacity WHERE code = 'TEST';
-- Expected: 3 rows, 12 positions, 0 occupied, 0% utilization
```

### Test Box Assignment

```sql
-- Find available position
SELECT * FROM v_available_positions
WHERE household_id = 'your-household-uuid'
LIMIT 1;

-- Create box (replace IDs)
INSERT INTO boxes (household_id, label, status, position_id)
VALUES (
  'your-household-uuid',
  'TEST-BOX-001',
  'stored',
  'position-uuid-from-above'
);

-- Verify position marked occupied
SELECT is_occupied FROM row_positions WHERE id = 'position-uuid';
-- Expected: true

-- View box with location
SELECT * FROM v_boxes_with_location WHERE label = 'TEST-BOX-001';
-- Should show full location like "TEST/1/1"
```

### Test Photo Count

```sql
-- Add photo to box
INSERT INTO photos (box_id, storage_path)
VALUES ('box-uuid', 'household-id/box-id/photo.jpg');

-- Check photo count updated
SELECT label, photo_count FROM boxes WHERE id = 'box-uuid';
-- Expected: photo_count = 1
```

---

## Rollback Plan

If you need to rollback:

```sql
-- WARNING: This deletes ALL data!

-- Drop all views
DROP VIEW IF EXISTS v_pallet_capacity;
DROP VIEW IF EXISTS v_boxes_with_location;
DROP VIEW IF EXISTS v_available_positions;

-- Drop all triggers (automatic with CASCADE on functions)

-- Drop all functions
DROP FUNCTION IF EXISTS create_default_household CASCADE;
DROP FUNCTION IF EXISTS generate_box_label CASCADE;
DROP FUNCTION IF EXISTS create_pallet_structure CASCADE;
DROP FUNCTION IF EXISTS validate_box_position CASCADE;
DROP FUNCTION IF EXISTS update_position_occupancy CASCADE;
DROP FUNCTION IF EXISTS update_box_photo_count CASCADE;
DROP FUNCTION IF EXISTS generate_qr_code CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS row_positions CASCADE;
DROP TABLE IF EXISTS pallet_rows CASCADE;
DROP TABLE IF EXISTS pallets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS box_types CASCADE;
DROP TABLE IF EXISTS user_households CASCADE;
DROP TABLE IF EXISTS households CASCADE;

-- Drop types
DROP TYPE IF EXISTS box_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
```

---

## Next Steps After Migration

1. ✅ Generate TypeScript types
2. ✅ Update Zod schemas in `packages/shared`
3. ✅ Build warehouse setup UI (create pallets)
4. ✅ Build box assignment UI (assign to positions)
5. ✅ Implement box search and filtering
6. ✅ Build capacity dashboard
7. ✅ Test photo uploads to storage

---

## Support

If you encounter issues:

1. Check Supabase Logs (Dashboard > Logs)
2. Review `DATABASE_SCHEMA_V2.md` for schema details
3. Review `SECURITY.md` for RLS policy explanations
4. Check `SCHEMA_COMPARISON.md` for V1 vs V2 differences

---

## Migration Checklist

- [ ] Run migration SQL
- [ ] Verify 9 tables created
- [ ] Verify default box types (6)
- [ ] Verify default categories (7)
- [ ] Verify RLS enabled on all tables
- [ ] Verify RLS policies created (~28 policies)
- [ ] Create `box-photos` storage bucket
- [ ] Apply storage RLS policies (3 policies)
- [ ] Test user signup trigger
- [ ] Generate TypeScript types
- [ ] Create test pallet
- [ ] Verify auto-structure creation
- [ ] Create test box
- [ ] Verify position occupancy tracking
- [ ] Test photo upload
- [ ] Verify photo count trigger

**Migration Status:** ✅ Ready for Production
