# API Route Templates

This document provides templates and patterns for creating consistent API routes in the BoxTrack web app.

## Directory Structure

```
apps/web/app/api/
├── [resource]/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET (single), PUT (update), DELETE
```

## Common Patterns

### Response Format

All API routes should return consistent JSON responses:

```typescript
// Success responses
{ data: T }                    // For single item
{ data: T[], count?: number }  // For lists

// Error responses
{ error: string }
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input / validation failed |
| 401 | Unauthorized | No valid session |
| 403 | Forbidden | User lacks permission (RLS violation) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected errors |

### Supabase Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `42501` | RLS policy violation | 403 |
| `23505` | Unique constraint violation | 400 |
| `23503` | Foreign key violation | 400 |
| `PGRST116` | No rows returned | 404 |

---

## Template: Collection Route (`/api/[resource]/route.ts`)

Handles `GET` (list) and `POST` (create) for a resource collection.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for creating a new [Resource]
 * Use snake_case to match database column names
 */
const createSchema = z.object({
  household_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  // Add other fields...
});

/**
 * Schema for query parameters (GET list)
 */
const listQuerySchema = z.object({
  household_id: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  // Add filters...
});

// ============================================================================
// GET /api/[resource] - List resources
// ============================================================================

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = listQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { household_id, limit, offset } = parsed.data;

    // 3. Query database (RLS enforces access control)
    const { data, error, count } = await supabase
      .from("resources")
      .select("*", { count: "exact" })
      .eq("household_id", household_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching resources:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Return response
    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("Unexpected error in GET /api/resources:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/[resource] - Create resource
// ============================================================================

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate body
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // 3. Insert (RLS enforces household membership)
    const { data, error: insertError } = await supabase
      .from("resources")
      .insert({
        ...parsed.data,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating resource:", insertError);

      // Handle specific errors
      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to create this resource" },
          { status: 403 }
        );
      }
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A resource with this name already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 4. Return created resource
    return NextResponse.json({ data: { id: data.id } }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/resources:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
```

---

## Template: Item Route (`/api/[resource]/[id]/route.ts`)

Handles `GET` (single), `PUT` (update), and `DELETE` for a single resource.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a [Resource]
 * All fields optional for partial updates
 */
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  // Add other updatable fields...
});

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/[resource]/[id] - Get single resource
// ============================================================================

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Fetch resource (RLS enforces access)
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching resource:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // 4. Return resource
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in GET /api/resources/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/[resource]/[id] - Update resource
// ============================================================================

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Parse and validate body
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // 4. Check if there's anything to update
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // 5. Update (RLS enforces access)
    const { data, error: updateError } = await supabase
      .from("resources")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating resource:", updateError);

      if (updateError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to update this resource" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // 6. Return updated resource ID
    return NextResponse.json({ data: { id: data.id } });
  } catch (err) {
    console.error("Unexpected error in PUT /api/resources/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/[resource]/[id] - Soft delete resource
// ============================================================================

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Soft delete (set deleted_at timestamp)
    const { data, error: deleteError } = await supabase
      .from("resources")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Error deleting resource:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this resource" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // 4. Return success
    return NextResponse.json({ data: { id: data.id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/resources/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
```

---

## Checklist for New API Routes

When creating a new API route, ensure you:

- [ ] **Authentication**: Use `getUser()` (not `getSession()`) to validate JWT
- [ ] **Validation**: Define Zod schemas for all inputs (body, query params)
- [ ] **Error Handling**: Handle Supabase-specific error codes (42501, 23505, etc.)
- [ ] **Response Format**: Return `{ data }` or `{ error }` consistently
- [ ] **Status Codes**: Use appropriate HTTP status codes
- [ ] **Logging**: Log errors with context (endpoint, error details)
- [ ] **Soft Delete**: Use `deleted_at` timestamps, not hard deletes
- [ ] **RLS**: Rely on Row Level Security for access control
- [ ] **Types**: Add query result types to `@boxtrack/shared` if needed

---

## Example: Complete Box Routes

### `/api/boxes/route.ts` (existing)
- `POST` - Create box ✅

### `/api/boxes/[id]/route.ts` (to implement)
- `GET` - Get single box with relations
- `PUT` - Update box fields
- `DELETE` - Soft delete box

### Usage from Client

```typescript
// Create
const response = await fetch("/api/boxes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ household_id, label, status }),
});

// Get single
const response = await fetch(`/api/boxes/${id}`);

// Update
const response = await fetch(`/api/boxes/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ label: "New Label" }),
});

// Delete
const response = await fetch(`/api/boxes/${id}`, {
  method: "DELETE",
});

// Handle response
const result = await response.json();
if (!response.ok) {
  throw new Error(result.error);
}
return result.data;
```

---

## Helper: API Response Utilities

Consider creating shared utilities for consistent responses:

```typescript
// lib/api-utils.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(error: string, status = 500) {
  return NextResponse.json({ error }, { status });
}

export function validationError(zodError: ZodError) {
  const message = zodError.issues[0]?.message || "Invalid input";
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorizedError() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenError(message = "Permission denied") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFoundError(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}
```
