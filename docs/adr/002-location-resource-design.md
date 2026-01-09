# ADR 002: Location Resource Design

**Status:** Draft
**Date:** 2026-01-09
**Decision Makers:** Development Team
**Author:** Claude Code

## Executive Summary

This document outlines the design and implementation plan for a new "Location" resource in BoxTrack. A Location represents a physical storage space (e.g., a self-storage unit, warehouse bay, or garage) within which pallets are organized. This addition creates a four-level hierarchy: **Household → Location → Pallet → Rows/Positions → Boxes**.

---

## Context

### Current State

BoxTrack currently models storage with a three-level physical hierarchy:

```
Household
└── Pallets (with warehouse_zone, location_description fields)
    └── Pallet Rows
        └── Row Positions
            └── Boxes
```

Pallets have two location-related text fields that are underutilized:
- `warehouse_zone`: Free-text zone identifier
- `location_description`: Free-text description

### Problem Statement

Users with multiple storage units (common in moving scenarios) cannot:
1. Organize pallets by physical storage location
2. Filter/search boxes by storage unit
3. Track capacity utilization per storage unit
4. Store facility-specific access information (codes, hours)

### Goals

1. Enable users to define discrete storage locations
2. Associate pallets with specific locations
3. Provide location-level capacity tracking and filtering
4. Store practical location metadata (access codes, addresses)
5. Maintain backward compatibility with existing data

---

## Decision

**Introduce a `locations` table as a first-class resource, positioned between Household and Pallet in the entity hierarchy.**

### New Hierarchy

```
Household
└── Location (Storage Unit/Facility Space)
    └── Pallets
        └── Pallet Rows
            └── Row Positions
                └── Boxes
```

---

## Detailed Design

### 1. Database Schema

#### 1.1 New `locations` Table

```sql
CREATE TABLE locations (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant isolation
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

    -- Core identity
    name VARCHAR(100) NOT NULL,              -- e.g., "Unit 142", "Garage"
    code VARCHAR(20),                         -- Short code for labels, e.g., "U142"

    -- Facility information
    facility_name VARCHAR(200),               -- e.g., "Public Storage - Main St"
    facility_address TEXT,                    -- Full address

    -- Dimensions (nullable - not all users will measure)
    width_feet DECIMAL(6,2),
    depth_feet DECIMAL(6,2),
    height_feet DECIMAL(6,2),
    square_feet DECIMAL(8,2),                 -- Can be computed or manually entered

    -- Access information
    access_code VARCHAR(100),                 -- Gate/unit codes (encrypted at rest)
    access_hours VARCHAR(200),                -- e.g., "6am-10pm daily"

    -- Metadata
    notes TEXT,
    color VARCHAR(7),                         -- Hex color for UI
    icon VARCHAR(50),                         -- Icon identifier

    -- Status and ordering
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,                   -- Soft delete

    -- Constraints
    CONSTRAINT locations_name_length CHECK (char_length(name) >= 1),
    CONSTRAINT locations_one_default_per_household
        EXCLUDE (household_id WITH =) WHERE (is_default = true AND deleted_at IS NULL)
);

-- Indexes
CREATE INDEX idx_locations_household ON locations(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_active ON locations(household_id, is_active) WHERE deleted_at IS NULL;
```

#### 1.2 Modify `pallets` Table

```sql
-- Add foreign key to locations
ALTER TABLE pallets
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Index for efficient joins
CREATE INDEX idx_pallets_location ON pallets(location_id) WHERE deleted_at IS NULL;

-- Note: Keep warehouse_zone and location_description temporarily for migration
-- These will be deprecated after migration is complete
```

#### 1.3 Row Level Security

```sql
-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access locations in their households
CREATE POLICY locations_household_access ON locations
    FOR ALL
    USING (
        household_id IN (
            SELECT household_id FROM user_households
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only owners/admins can create/modify locations
CREATE POLICY locations_admin_modify ON locations
    FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM user_households
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );
```

### 2. Zod Schemas

Add to `packages/shared/src/schemas.ts`:

```typescript
// =============================================================================
// Location Schemas
// =============================================================================

export const locationSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),

  // Core identity
  name: z.string().min(1).max(100),
  code: z.string().max(20).nullable(),

  // Facility information
  facilityName: z.string().max(200).nullable(),
  facilityAddress: z.string().max(500).nullable(),

  // Dimensions
  widthFeet: z.number().positive().nullable(),
  depthFeet: z.number().positive().nullable(),
  heightFeet: z.number().positive().nullable(),
  squareFeet: z.number().positive().nullable(),

  // Access information
  accessCode: z.string().max(100).nullable(),
  accessHours: z.string().max(200).nullable(),

  // Metadata
  notes: z.string().max(2000).nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  icon: z.string().max(50).nullable(),

  // Status
  isActive: z.boolean(),
  isDefault: z.boolean(),
  displayOrder: z.number().int().min(0),

  // Audit
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const locationInsertSchema = locationSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    displayOrder: z.number().int().min(0).default(0),
  });

export const locationUpdateSchema = locationInsertSchema.partial();

// Update palletSchema to include locationId
// (modify existing schema)
export const palletSchema = z.object({
  // ... existing fields ...
  locationId: z.string().uuid().nullable(),
});
```

### 3. TypeScript Types

Add to `packages/shared/src/types.ts`:

```typescript
// =============================================================================
// Location Types
// =============================================================================

export type Location = z.infer<typeof locationSchema>;
export type LocationInsert = z.infer<typeof locationInsertSchema>;
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

// Composite types
export interface LocationWithPallets extends Location {
  pallets: Pallet[];
}

export interface LocationWithCapacity extends Location {
  capacity: LocationCapacity;
}

export interface LocationCapacity {
  locationId: string;
  locationName: string;
  totalPallets: number;
  activePallets: number;
  totalPositions: number;
  occupiedPositions: number;
  availablePositions: number;
  utilizationPercent: number;
}

export interface LocationSummary {
  id: string;
  name: string;
  code: string | null;
  facilityName: string | null;
  color: string | null;
  palletCount: number;
  boxCount: number;
  utilizationPercent: number;
}
```

### 4. Database Views

#### 4.1 Update `v_boxes_with_location`

```sql
-- Drop and recreate with location fields
CREATE OR REPLACE VIEW v_boxes_with_location AS
SELECT
    b.*,
    -- Existing location fields
    p.code as pallet_code,
    p.name as pallet_name,
    p.id as pallet_id,
    pr.row_number,
    rp.position_number,
    rp.id as position_id,

    -- NEW: Location fields
    l.id as location_id,
    l.name as location_name,
    l.code as location_code,
    l.facility_name,
    l.color as location_color,

    -- Updated full location string
    CONCAT(
        COALESCE(l.name || ' > ', ''),
        p.name,
        ' - Row ', pr.row_number,
        ', Position ', rp.position_number
    ) as full_location,

    -- Category and type info
    c.name as category_name,
    bt.code as box_type_code,
    bt.name as box_type_name
FROM boxes b
LEFT JOIN row_positions rp ON b.position_id = rp.id
LEFT JOIN pallet_rows pr ON rp.row_id = pr.id
LEFT JOIN pallets p ON pr.pallet_id = p.id
LEFT JOIN locations l ON p.location_id = l.id  -- NEW JOIN
LEFT JOIN categories c ON b.category_id = c.id
LEFT JOIN box_types bt ON b.box_type_id = bt.id
WHERE b.deleted_at IS NULL;
```

#### 4.2 New `v_location_capacity` View

```sql
CREATE VIEW v_location_capacity AS
SELECT
    l.id as location_id,
    l.household_id,
    l.name as location_name,
    l.code as location_code,
    l.facility_name,
    l.color,
    l.is_active,

    -- Pallet counts
    COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL) as total_pallets,
    COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL AND p.is_active) as active_pallets,

    -- Position counts
    COUNT(DISTINCT rp.id) as total_positions,
    COUNT(DISTINCT rp.id) FILTER (WHERE rp.is_occupied) as occupied_positions,
    COUNT(DISTINCT rp.id) FILTER (WHERE NOT rp.is_occupied AND NOT rp.is_reserved) as available_positions,

    -- Box count
    COUNT(DISTINCT b.id) FILTER (WHERE b.deleted_at IS NULL) as box_count,

    -- Utilization
    CASE
        WHEN COUNT(DISTINCT rp.id) = 0 THEN 0
        ELSE ROUND(
            (COUNT(DISTINCT rp.id) FILTER (WHERE rp.is_occupied)::numeric /
             COUNT(DISTINCT rp.id)::numeric) * 100,
            1
        )
    END as utilization_percent

FROM locations l
LEFT JOIN pallets p ON p.location_id = l.id AND p.deleted_at IS NULL
LEFT JOIN pallet_rows pr ON pr.pallet_id = p.id AND pr.is_active
LEFT JOIN row_positions rp ON rp.row_id = pr.id
LEFT JOIN boxes b ON b.position_id = rp.id AND b.deleted_at IS NULL
WHERE l.deleted_at IS NULL
GROUP BY l.id, l.household_id, l.name, l.code, l.facility_name, l.color, l.is_active;
```

### 5. API Routes

#### 5.1 Location CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/locations` | Create location |
| `GET` | `/api/locations` | List locations (with optional capacity) |
| `GET` | `/api/locations/[id]` | Get location details |
| `PATCH` | `/api/locations/[id]` | Update location |
| `DELETE` | `/api/locations/[id]` | Soft delete location |

#### 5.2 Location Sub-resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations/[id]/pallets` | List pallets in location |
| `GET` | `/api/locations/[id]/capacity` | Get capacity metrics |
| `POST` | `/api/locations/[id]/pallets` | Create pallet in location |

#### 5.3 Example Implementation

```typescript
// apps/web/app/api/locations/route.ts

import { createRouteHandlerClient } from "@/lib/supabase/server";
import { locationInsertSchema } from "@boxtrack/shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();

  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  const body = await request.json();
  const result = locationInsertSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  // Verify household membership
  const { data: membership } = await supabase
    .from("user_households")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("household_id", result.data.householdId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create location
  const { data, error } = await supabase
    .from("locations")
    .insert({
      household_id: result.data.householdId,
      name: result.data.name,
      code: result.data.code,
      facility_name: result.data.facilityName,
      facility_address: result.data.facilityAddress,
      width_feet: result.data.widthFeet,
      depth_feet: result.data.depthFeet,
      height_feet: result.data.heightFeet,
      square_feet: result.data.squareFeet,
      access_code: result.data.accessCode,
      access_hours: result.data.accessHours,
      notes: result.data.notes,
      color: result.data.color,
      icon: result.data.icon,
      is_active: result.data.isActive,
      is_default: result.data.isDefault,
      display_order: result.data.displayOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient();
  const { searchParams } = new URL(request.url);
  const householdId = searchParams.get("householdId");
  const includeCapacity = searchParams.get("includeCapacity") === "true";

  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "householdId is required" },
      { status: 400 }
    );
  }

  // Query based on capacity requirement
  const view = includeCapacity ? "v_location_capacity" : "locations";

  const { data, error } = await supabase
    .from(view)
    .select("*")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### 6. UI Components

#### 6.1 Web Components

| Component | Path | Description |
|-----------|------|-------------|
| `LocationList` | `app/dashboard/locations/page.tsx` | List all locations with capacity |
| `LocationDetail` | `app/dashboard/locations/[id]/page.tsx` | Location details with pallets |
| `LocationForm` | `components/locations/location-form.tsx` | Create/edit form |
| `LocationCard` | `components/locations/location-card.tsx` | Summary card |
| `LocationSelector` | `components/locations/location-selector.tsx` | Dropdown picker |
| `LocationCapacityBar` | `components/locations/capacity-bar.tsx` | Visual utilization |

#### 6.2 Mobile Components

Mirror web components with React Native/NativeWind equivalents:
- `LocationListScreen`
- `LocationDetailScreen`
- `LocationFormSheet` (bottom sheet)
- `LocationPicker` (picker/modal)

### 7. Navigation Updates

#### 7.1 Web Dashboard

```
/dashboard
├── /locations                    # NEW: Location list
│   └── /[id]                    # NEW: Location detail
│       └── /pallets             # Pallets in location
├── /boxes                       # Existing
├── /pallets                     # Existing (add location filter)
└── /settings                    # Existing
```

#### 7.2 Mobile (Expo Router)

```
/(tabs)
├── /locations                   # NEW: Location list
│   └── /[id]                   # NEW: Location detail
├── /boxes                      # Existing
├── /scan                       # Existing
└── /settings                   # Existing
```

---

## Implementation Plan

### Phase 1: Database Foundation (Week 1)

1. **Create migration files**
   - [ ] Create `locations` table
   - [ ] Add `location_id` column to `pallets`
   - [ ] Create indexes
   - [ ] Set up RLS policies

2. **Update Supabase types**
   - [ ] Run `supabase gen types typescript`
   - [ ] Update `packages/shared/src/database.types.ts`

3. **Add Zod schemas and types**
   - [ ] Add location schemas to `schemas.ts`
   - [ ] Add location types to `types.ts`
   - [ ] Update pallet schema with `locationId`

### Phase 2: API Layer (Week 2)

1. **Create API routes**
   - [ ] `POST /api/locations`
   - [ ] `GET /api/locations`
   - [ ] `GET /api/locations/[id]`
   - [ ] `PATCH /api/locations/[id]`
   - [ ] `DELETE /api/locations/[id]`

2. **Create database views**
   - [ ] Update `v_boxes_with_location`
   - [ ] Create `v_location_capacity`
   - [ ] Update `v_available_positions`

3. **Write API tests**
   - [ ] CRUD operation tests
   - [ ] Authorization tests
   - [ ] Validation tests

### Phase 3: Web UI (Week 3)

1. **Location management pages**
   - [ ] Location list page
   - [ ] Location detail page
   - [ ] Location form component

2. **Integration components**
   - [ ] Location selector for pallet forms
   - [ ] Location filter for box search
   - [ ] Location capacity visualization

3. **Update existing pages**
   - [ ] Add location context to pallet pages
   - [ ] Update box detail to show full location path
   - [ ] Add location to dashboard summary

### Phase 4: Mobile UI (Week 4)

1. **Location screens**
   - [ ] Location list screen
   - [ ] Location detail screen
   - [ ] Location form (bottom sheet)

2. **Integration**
   - [ ] Location picker component
   - [ ] Update pallet creation flow
   - [ ] Update box search with location filter

### Phase 5: Data Migration (Week 5)

1. **Migration script**
   - [ ] Create default location per household
   - [ ] Link existing pallets to default location
   - [ ] Parse `warehouse_zone` into locations (optional)

2. **Verification**
   - [ ] Validate all pallets have location
   - [ ] Test existing functionality
   - [ ] Performance testing on views

### Phase 6: Cleanup & Documentation (Week 6)

1. **Deprecation**
   - [ ] Add deprecation warnings for `warehouse_zone`
   - [ ] Update code to prefer `location_id`
   - [ ] Document migration path

2. **Documentation**
   - [ ] Update API documentation
   - [ ] Update user guide
   - [ ] Create location management tutorial

---

## Migration Strategy

### Backward Compatibility

1. **Keep existing fields temporarily**
   - `pallets.warehouse_zone` remains readable
   - `pallets.location_description` remains readable
   - New code writes to `location_id` only

2. **Automatic default location**
   - On first location-aware request, create "Default Location" if none exists
   - Unassigned pallets treated as belonging to default location

3. **Graceful degradation**
   - UI shows "No Location" if `location_id` is null
   - Filters include null location option

### Data Migration Script

```typescript
// scripts/migrate-locations.ts

async function migrateLocations(supabase: SupabaseClient) {
  // Get all households
  const { data: households } = await supabase
    .from("households")
    .select("id, name");

  for (const household of households) {
    // Create default location
    const { data: location } = await supabase
      .from("locations")
      .insert({
        household_id: household.id,
        name: "Primary Storage",
        code: "PRIMARY",
        is_default: true,
        is_active: true,
      })
      .select()
      .single();

    // Link all pallets to default location
    await supabase
      .from("pallets")
      .update({ location_id: location.id })
      .eq("household_id", household.id)
      .is("location_id", null);

    console.log(`Migrated household ${household.id}: ${household.name}`);
  }
}
```

---

## Design Decisions

### D1: Location as Optional vs Required

**Decision:** Location is **optional** on pallets (nullable FK).

**Rationale:**
- Allows incremental adoption
- Supports simple use cases (single storage location)
- Backward compatible with existing data

### D2: One Default Location per Household

**Decision:** Enforce via database constraint (EXCLUDE).

**Rationale:**
- Simplifies pallet creation UX (pre-select default)
- Clear fallback for unassigned pallets
- Prevents ambiguity

### D3: Soft Delete for Locations

**Decision:** Use `deleted_at` pattern consistent with other entities.

**Rationale:**
- Preserves historical data
- Allows restoration
- Maintains referential integrity

### D4: Access Code Storage

**Decision:** Store `access_code` as plain text initially; encrypt at rest via Supabase.

**Rationale:**
- Supabase encrypts data at rest by default
- Application-level encryption adds complexity
- Can add column-level encryption later if needed

---

## Open Questions (Resolved)

### Q1: Multi-facility support?

**Resolution:** Yes, supported by design. Each Location can have different `facility_name` and `facility_address`. Users can create multiple locations across multiple facilities.

### Q2: Location types?

**Resolution:** Deferred. Add `type` enum field later if needed (storage_unit, warehouse, garage, etc.). Current `name` field is flexible enough.

### Q3: Geolocation?

**Resolution:** Deferred. Can add `latitude`/`longitude` fields in future iteration for map features.

### Q4: Cost tracking?

**Resolution:** Out of scope for initial implementation. Consider separate `location_costs` table for rental tracking in future.

---

## Consequences

### Positive

- Clean hierarchical data model
- Better organization for multi-location users
- Foundation for capacity planning features
- Improved box search and filtering
- Natural grouping for label generation

### Negative

- Additional complexity in data model
- Migration required for existing users
- More UI screens to maintain
- Slightly more complex queries

### Neutral

- Views handle join complexity
- Mobile/web parity required

---

## References

- Existing ADRs: `docs/adr/001-tailwind-version-strategy.md`
- Schema definitions: `packages/shared/src/schemas.ts`
- Database types: `packages/shared/src/database.types.ts`
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security

---

## Appendix A: Full Entity Relationship Diagram

```
┌─────────────┐
│  households │
├─────────────┤
│ id (PK)     │
│ name        │
│ slug        │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│    locations    │  ◄── NEW
├─────────────────┤
│ id (PK)         │
│ household_id(FK)│
│ name            │
│ facility_name   │
│ access_code     │
│ ...             │
└────────┬────────┘
         │
         │ 1:N (nullable)
         ▼
┌─────────────────┐
│     pallets     │
├─────────────────┤
│ id (PK)         │
│ household_id(FK)│
│ location_id(FK) │ ◄── NEW
│ code            │
│ name            │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   pallet_rows   │
├─────────────────┤
│ id (PK)         │
│ pallet_id (FK)  │
│ row_number      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│  row_positions  │
├─────────────────┤
│ id (PK)         │
│ row_id (FK)     │
│ position_number │
│ is_occupied     │
└────────┬────────┘
         │
         │ 1:1 (nullable)
         ▼
┌─────────────────┐
│      boxes      │
├─────────────────┤
│ id (PK)         │
│ household_id(FK)│
│ position_id(FK) │
│ label           │
│ status          │
└─────────────────┘
```

## Appendix B: Sample UI Mockups

### Location List (Web)

```
┌────────────────────────────────────────────────────────────────┐
│  Locations                                    [+ New Location] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🏢 Unit 142                              ████████░░ 78%  │  │
│  │    Public Storage - Main St                              │  │
│  │    3 pallets · 47 boxes                    [View →]      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🏠 Garage                                ███░░░░░░░ 32%  │  │
│  │    Home                                                  │  │
│  │    1 pallet · 12 boxes                     [View →]      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Location Detail (Web)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back    Unit 142                      [Edit] [+ Add Pallet] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📍 Public Storage - Main St                                   │
│     123 Main Street, Anytown, ST 12345                        │
│                                                                │
│  🔑 Access: Gate #4521 · Unit Lock: 1234                      │
│  🕐 Hours: 6am - 10pm daily                                   │
│                                                                │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│  Capacity                    Pallets                           │
│  ████████░░ 78%             ┌────────────────────────────────┐ │
│  47/60 positions            │ Pallet A     24 boxes    82%   │ │
│                             │ Pallet B     18 boxes    75%   │ │
│                             │ Pallet C      5 boxes    42%   │ │
│                             └────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```
