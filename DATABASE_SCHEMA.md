# BoxTrack Database Schema

**Last Updated:** January 7, 2026
**Database:** Supabase Postgres
**Version:** 1.0.0

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
9. [Example Queries](#example-queries)
10. [Migration Plan](#migration-plan)

---

## Overview

### Core Entities

- **Households** - Groups of users sharing box inventory
- **User Households** - Many-to-many relationship between users and households
- **Boxes** - Physical storage boxes being tracked
- **Photos** - Images of box contents
- **Categories** - Predefined categories for organization (optional table vs enum)

### Design Principles

1. **Multi-tenancy** - All data scoped by `household_id`
2. **Audit Trail** - Track creation and modification timestamps
3. **Soft Deletes** - Use `deleted_at` for important data (boxes, photos)
4. **UUIDs** - All primary keys use UUIDs for distributed systems
5. **Immutable Logs** - Certain audit actions stored in append-only tables

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
│  - created_at          │      │  - updated_at    │
└─────────────────────────┘      └────────┬─────────┘
                                          │
                                          │ one-to-many
                                          │
                                 ┌────────▼──────────┐
                                 │  boxes            │
                                 │  - id (pk)        │
                                 │  - household_id   │
                                 │  - label          │
                                 │  - description    │
                                 │  - status         │
                                 │  - category_id    │──┐
                                 │  - location (json)│  │
                                 │  - qr_code        │  │
                                 │  - created_at     │  │
                                 │  - updated_at     │  │
                                 │  - closed_at      │  │
                                 │  - deleted_at     │  │
                                 └─────────┬─────────┘  │
                                           │            │
                                           │            │
                                           │            │
                                 ┌─────────▼─────────┐  │
                                 │  photos           │  │
                                 │  - id (pk)        │  │
                                 │  - box_id (fk)    │  │
                                 │  - storage_path   │  │
                                 │  - url            │  │
                                 │  - thumbnail_url  │  │
                                 │  - caption        │  │
                                 │  - display_order  │  │
                                 │  - created_at     │  │
                                 │  - deleted_at     │  │
                                 └───────────────────┘  │
                                                        │
                                           ┌────────────▼──────┐
                                           │  categories       │
                                           │  - id (pk)        │
                                           │  - name           │
                                           │  - color          │
                                           │  - icon           │
                                           │  - household_id   │
                                           │  - is_default     │
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
  slug VARCHAR(100) UNIQUE, -- URL-friendly identifier
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
COMMENT ON COLUMN user_households.role IS 'owner: full control, admin: manage users, member: manage boxes, viewer: read-only';
```

**Indexes:**
```sql
CREATE INDEX idx_user_households_user_id ON user_households(user_id);
CREATE INDEX idx_user_households_household_id ON user_households(household_id);
CREATE INDEX idx_user_households_role ON user_households(household_id, role);
```

---

### 3. `categories`

Organizational categories for boxes (Kitchen, Bedroom, etc.)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color
  icon VARCHAR(50), -- Icon name/emoji
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Allow global default categories (household_id NULL) or household-specific
  CONSTRAINT categories_unique_name_per_household UNIQUE(household_id, name),
  CONSTRAINT categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE categories IS 'Box categories for organization and color coding';
COMMENT ON COLUMN categories.household_id IS 'NULL for system defaults, set for household-specific categories';
COMMENT ON COLUMN categories.is_default IS 'System-provided categories that appear for all households';
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

### 4. `boxes`

Core entity representing physical storage boxes.

```sql
CREATE TYPE box_status AS ENUM ('open', 'closed', 'packed');

CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Box Information
  label VARCHAR(100) NOT NULL, -- e.g., "Kitchen #1", "BOX-001"
  description TEXT,
  status box_status NOT NULL DEFAULT 'open',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Location (stored as JSONB for flexibility)
  location JSONB, -- { "pallet": "A", "row": 3, "position": 2 }

  -- QR Code
  qr_code VARCHAR(255) UNIQUE, -- Generated QR content: boxtrack://box/{id}

  -- Metadata
  photo_count INTEGER NOT NULL DEFAULT 0, -- Denormalized for performance
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ, -- When status changed to 'closed' or 'packed'
  deleted_at TIMESTAMPTZ, -- Soft delete

  CONSTRAINT boxes_label_not_empty CHECK (char_length(label) >= 1),
  CONSTRAINT boxes_description_length CHECK (char_length(description) <= 1000),
  CONSTRAINT boxes_location_structure CHECK (
    location IS NULL OR (
      jsonb_typeof(location) = 'object' AND
      location ? 'pallet' AND
      location ? 'row' AND
      location ? 'position'
    )
  )
);

COMMENT ON TABLE boxes IS 'Physical storage boxes being tracked';
COMMENT ON COLUMN boxes.location IS 'Location in storage: {pallet, row, position}';
COMMENT ON COLUMN boxes.qr_code IS 'Unique QR code content for this box';
COMMENT ON COLUMN boxes.photo_count IS 'Cached count of photos for this box';
```

**Indexes:**
```sql
CREATE INDEX idx_boxes_household_id ON boxes(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_status ON boxes(household_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_category_id ON boxes(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_qr_code ON boxes(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_created_at ON boxes(household_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_boxes_label_search ON boxes USING gin(to_tsvector('english', label || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;

-- GIN index for JSONB location queries
CREATE INDEX idx_boxes_location ON boxes USING gin(location) WHERE deleted_at IS NULL;
```

---

### 5. `photos`

Images of box contents for identification.

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,

  -- Storage
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  url TEXT, -- Signed URL (regenerated as needed)
  thumbnail_url TEXT, -- Thumbnail signed URL

  -- Metadata
  caption VARCHAR(200),
  display_order INTEGER NOT NULL DEFAULT 0, -- Order within box
  file_size INTEGER, -- Bytes
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  CONSTRAINT photos_caption_length CHECK (char_length(caption) <= 200),
  CONSTRAINT photos_display_order_positive CHECK (display_order >= 0)
);

COMMENT ON TABLE photos IS 'Photos of box contents for identification';
COMMENT ON COLUMN photos.storage_path IS 'Path in Supabase Storage: household_id/box_id/filename.jpg';
COMMENT ON COLUMN photos.display_order IS 'Order for displaying photos within a box';
```

**Indexes:**
```sql
CREATE INDEX idx_photos_box_id ON photos(box_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_created_at ON photos(box_id, created_at DESC) WHERE deleted_at IS NULL;
```

---

### 6. `activity_log` (Optional - Future Enhancement)

Audit trail for important actions.

```sql
CREATE TYPE activity_type AS ENUM (
  'box_created',
  'box_updated',
  'box_closed',
  'box_deleted',
  'photo_added',
  'photo_deleted',
  'location_changed',
  'status_changed'
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  box_id UUID REFERENCES boxes(id) ON DELETE SET NULL,

  -- Activity
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context

  -- Actor
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_log IS 'Audit trail of important actions';

CREATE INDEX idx_activity_log_household_id ON activity_log(household_id, created_at DESC);
CREATE INDEX idx_activity_log_box_id ON activity_log(box_id, created_at DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id, created_at DESC);
```

---

## Indexes

### Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_boxes_household_status_created ON boxes(household_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_boxes_household_category ON boxes(household_id, category_id)
  WHERE deleted_at IS NULL;

-- Full-text search on box labels and descriptions
CREATE INDEX idx_boxes_fts ON boxes
  USING gin(to_tsvector('english', label || ' ' || COALESCE(description, '')))
  WHERE deleted_at IS NULL;
```

### Partial Indexes

```sql
-- Only index non-deleted boxes (most queries)
CREATE INDEX idx_boxes_active ON boxes(household_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Only index closed/packed boxes
CREATE INDEX idx_boxes_closed ON boxes(household_id, closed_at DESC)
  WHERE status IN ('closed', 'packed') AND deleted_at IS NULL;
```

---

## Row Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### `households`

```sql
-- Users can view households they belong to
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

-- Users can create households (automatically become owner)
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

-- Only owners can update household
CREATE POLICY "Owners can update household"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Only owners can delete household
CREATE POLICY "Owners can delete household"
  ON households FOR DELETE
  USING (
    id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

#### `user_households`

```sql
-- Users can view members of their households
CREATE POLICY "Users can view household members"
  ON user_households FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

-- Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON user_households FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON user_households FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners can remove members, users can remove themselves
CREATE POLICY "Owners can remove members, users can remove themselves"
  ON user_households FOR DELETE
  USING (
    user_id = auth.uid() OR
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

#### `boxes`

```sql
-- Users can view boxes in their households
CREATE POLICY "Users can view household boxes"
  ON boxes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

-- Members and above can create boxes
CREATE POLICY "Members can create boxes"
  ON boxes FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Members and above can update boxes
CREATE POLICY "Members can update boxes"
  ON boxes FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Members and above can delete boxes (soft delete)
CREATE POLICY "Members can delete boxes"
  ON boxes FOR DELETE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );
```

#### `photos`

```sql
-- Users can view photos for boxes in their households
CREATE POLICY "Users can view household box photos"
  ON photos FOR SELECT
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id
        FROM user_households
        WHERE user_id = auth.uid()
      )
    )
  );

-- Members can add photos
CREATE POLICY "Members can add photos"
  ON photos FOR INSERT
  WITH CHECK (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id
        FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- Members can update photos
CREATE POLICY "Members can update photos"
  ON photos FOR UPDATE
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id
        FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- Members can delete photos
CREATE POLICY "Members can delete photos"
  ON photos FOR DELETE
  USING (
    box_id IN (
      SELECT id FROM boxes
      WHERE household_id IN (
        SELECT household_id
        FROM user_households
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );
```

#### `categories`

```sql
-- Everyone can view default categories, users can view household categories
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (
    is_default = true OR
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create household categories
CREATE POLICY "Admins can create categories"
  ON categories FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can update household categories
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete household categories
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

---

## Storage Buckets

### `box-photos`

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('box-photos', 'box-photos', false);
```

### Storage Policies

```sql
-- Users can upload to their household's folder
CREATE POLICY "Users can upload to household folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'box-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT household_id::text
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Users can view their household's photos
CREATE POLICY "Users can view household photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'box-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT household_id::text
      FROM user_households
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete their household's photos
CREATE POLICY "Users can delete household photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'box-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT household_id::text
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );
```

---

## Database Functions

### Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Generate QR Code

```sql
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = 'boxtrack://box/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Update Photo Count

```sql
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

### Create First Household on User Signup

```sql
CREATE OR REPLACE FUNCTION create_default_household()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create default household for new user
  INSERT INTO households (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Household'),
    'household-' || substr(NEW.id::text, 1, 8)
  )
  RETURNING id INTO new_household_id;

  -- Add user as owner
  INSERT INTO user_households (user_id, household_id, role)
  VALUES (NEW.id, new_household_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Triggers

```sql
-- Update timestamps
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
  BEFORE UPDATE ON boxes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate QR codes
CREATE TRIGGER generate_box_qr_code
  BEFORE INSERT ON boxes
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code();

-- Update photo counts
CREATE TRIGGER update_photo_count_on_insert
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_box_photo_count();

CREATE TRIGGER update_photo_count_on_delete
  AFTER DELETE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_box_photo_count();

-- Create default household for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_household();
```

---

## Example Queries

### Get all boxes for a user's household

```sql
SELECT
  b.*,
  c.name as category_name,
  c.color as category_color,
  b.photo_count
FROM boxes b
LEFT JOIN categories c ON b.category_id = c.id
WHERE b.household_id IN (
  SELECT household_id
  FROM user_households
  WHERE user_id = auth.uid()
)
AND b.deleted_at IS NULL
ORDER BY b.created_at DESC;
```

### Search boxes by label or description

```sql
SELECT *
FROM boxes
WHERE household_id = 'xxx'
  AND deleted_at IS NULL
  AND to_tsvector('english', label || ' ' || COALESCE(description, ''))
      @@ plainto_tsquery('english', 'kitchen plates');
```

### Get box with photos

```sql
SELECT
  b.*,
  jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'url', p.url,
      'thumbnail_url', p.thumbnail_url,
      'caption', p.caption,
      'display_order', p.display_order
    ) ORDER BY p.display_order
  ) FILTER (WHERE p.id IS NOT NULL) as photos
FROM boxes b
LEFT JOIN photos p ON b.id = p.box_id AND p.deleted_at IS NULL
WHERE b.id = 'box-uuid'
  AND b.deleted_at IS NULL
GROUP BY b.id;
```

### Get boxes by location

```sql
SELECT *
FROM boxes
WHERE household_id = 'xxx'
  AND deleted_at IS NULL
  AND location->>'pallet' = 'A'
  AND (location->>'row')::int = 3
ORDER BY (location->>'position')::int;
```

### Get household statistics

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'open') as open_boxes,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_boxes,
  COUNT(*) FILTER (WHERE status = 'packed') as packed_boxes,
  SUM(photo_count) as total_photos,
  COUNT(DISTINCT category_id) as categories_used
FROM boxes
WHERE household_id = 'xxx'
  AND deleted_at IS NULL;
```

---

## Migration Plan

### Phase 1: Core Tables

1. Create `households` table
2. Create `user_households` table with RLS
3. Create `categories` table with defaults
4. Create trigger for auto-household creation

### Phase 2: Main Entities

1. Create `boxes` table with indexes
2. Create `photos` table with indexes
3. Set up RLS policies for boxes and photos
4. Create update triggers

### Phase 3: Storage

1. Create `box-photos` storage bucket
2. Configure storage RLS policies
3. Test upload/download flows

### Phase 4: Functions & Triggers

1. Create all helper functions
2. Create all triggers
3. Test automated workflows

### Phase 5: Testing & Validation

1. Test RLS policies with different roles
2. Test soft delete behavior
3. Performance test with sample data
4. Validate all indexes are being used

---

## Design Decisions & Trade-offs

### Location as JSONB vs Separate Table

**Decision:** Use JSONB column

**Rationale:**
- ✅ Flexible schema (can add fields like "notes" later)
- ✅ Simpler queries (no JOIN needed)
- ✅ Easier to update atomically
- ✅ GIN index supports efficient queries
- ❌ Less type safety (mitigated by CHECK constraint)

### Categories as Table vs Enum

**Decision:** Use table with optional household_id

**Rationale:**
- ✅ Users can create custom categories
- ✅ Support default system categories
- ✅ Can add color, icon metadata
- ✅ Can be soft-deleted if needed
- ❌ Requires JOIN (acceptable for small dataset)

### Soft Delete vs Hard Delete

**Decision:** Soft delete for boxes and photos

**Rationale:**
- ✅ Accidental deletion recovery
- ✅ Audit trail preservation
- ✅ Can implement "trash" feature
- ❌ Requires deleted_at in WHERE clauses
- ❌ Indexes include deleted_at filter

### Photo Count Denormalization

**Decision:** Cache photo_count in boxes table

**Rationale:**
- ✅ Avoid COUNT() query on every box list
- ✅ Maintained automatically via triggers
- ✅ Significant performance improvement for lists
- ❌ Slight complexity in triggers

---

## Future Enhancements

- [ ] `activity_log` table for audit trail
- [ ] `box_items` table for itemized contents
- [ ] `locations` table if locations become more complex
- [ ] `labels` table for custom tagging system
- [ ] `search_history` table for user search suggestions
- [ ] Full-text search optimization with materialized views
- [ ] Partitioning for large households (>10k boxes)

---

## TypeScript Type Generation

After creating the schema, generate types:

```bash
npx supabase gen types typescript \
  --project-id pocilpskaipllqhmznah \
  > packages/shared/src/database.types.ts
```

---

## Validation Checklist

- [ ] All tables have primary keys (UUID)
- [ ] All foreign keys have ON DELETE behavior
- [ ] All tables have created_at timestamp
- [ ] Mutable tables have updated_at timestamp
- [ ] RLS enabled on all tables
- [ ] RLS policies cover all CRUD operations
- [ ] Indexes created for foreign keys
- [ ] Indexes created for common query patterns
- [ ] Partial indexes for deleted_at filters
- [ ] Full-text search indexes where needed
- [ ] Storage bucket created and configured
- [ ] Storage RLS policies configured
- [ ] Triggers created for automated tasks
- [ ] Default data inserted (categories)
- [ ] TypeScript types generated
