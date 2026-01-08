# Supabase Usage Audit Report

**Date:** January 8, 2026
**Status:** Audit Complete - Box Creation Migrated to API Route

## Executive Summary

This audit reviewed Supabase usage patterns across the BoxTrack monorepo (web and mobile apps). The codebase follows many best practices but has opportunities for improvement, particularly around **client-side mutations** and **type safety**.

### Key Findings

| Category | Status | Notes |
|----------|--------|-------|
| Client/Server Separation | GOOD | Proper use of anon vs service role keys |
| Row Level Security (RLS) | GOOD | All queries scoped by household_id |
| Auth Implementation | GOOD | Proper session handling with cookies |
| Server-side Data Fetching | GOOD | Server Components fetch data correctly |
| **Client-side Mutations** | FIXED | Box creation moved to API route |
| Type Safety | NEEDS WORK | Multiple `as any` casts in query results |
| API Route Coverage | STARTED | POST /api/boxes now available |

### Changes Made

1. **Created `POST /api/boxes` API route** - Server-side box creation with:
   - Zod validation
   - User authentication via `getUser()`
   - RLS-enforced household membership
   - Proper error handling

2. **Updated `BoxForm` component** - Now calls API route instead of direct Supabase

3. **Fixed status enum** - Aligned form with database enum values

---

## 1. Client Configuration Analysis

### Web App (`apps/web/lib/`)

**`supabase.ts` - Browser Client**
- Uses `@supabase/ssr` `createBrowserClient()`
- Properly uses `NEXT_PUBLIC_*` env vars (safe for client)
- Respects RLS via anon key

**`supabase-ssr.ts` - Server Client**
- Uses `@supabase/ssr` `createServerClient()`
- Proper cookie management for SSR
- Handles read-only Server Component contexts

**`supabase-server.ts` - Service Role Client**
- Uses service role key (bypasses RLS)
- Correctly disabled `autoRefreshToken` and `persistSession`
- **Warning comment** properly documented

### Mobile App (`apps/mobile/lib/`)

**`supabase.ts` - Mobile Client**
- Uses `@supabase/supabase-js` with secure storage
- `ExpoSecureStoreAdapter` for token persistence (Keychain/Keystore)
- Proper auth configuration for mobile

**Assessment:** Client configuration follows best practices.

---

## 2. Identified Issues

### Issue #1: Client-Side Database Mutations (HIGH)

**Location:** `apps/web/components/box-form.tsx:55`

```typescript
// Current pattern - Direct client-side INSERT
const { data: box, error: insertError } = await supabase
  .from("boxes")
  .insert({
    household_id: householdId,
    label: label.trim(),
    // ...
  })
```

**Why This Matters:**
- Exposes database schema to client bundle
- No server-side validation layer
- Cannot add rate limiting, logging, or additional security checks
- Makes future migrations more difficult

**Best Practice (Supabase + Next.js):**
Use Server Actions or API Routes for mutations:

```typescript
// Recommended: Server Action
"use server";
export async function createBox(formData: FormData) {
  const supabase = await createClient();
  // Server-side validation, logging, rate limiting possible
  return supabase.from("boxes").insert({...});
}
```

### Issue #2: Type Safety with `as any` Casts (MEDIUM)

**Locations:**
- `apps/web/app/dashboard/boxes/page.tsx:26`
- `apps/web/app/dashboard/boxes/[id]/page.tsx:51`
- `apps/web/lib/auth-context.tsx:58`

```typescript
// Current pattern
const userHouseholds = userHouseholdsData as any;
const box = boxData as any;
```

**Impact:**
- Loses TypeScript type checking on query results
- Potential runtime errors from unexpected data shapes
- Harder to refactor

**Recommendation:** Create typed query result interfaces or use Supabase's generated types with proper generics.

### Issue #3: Unprotected Test Endpoint (LOW)

**Location:** `apps/web/app/api/test-supabase/route.ts`

- Uses service role client to query database
- No authentication check
- Should be removed or protected in production

### Issue #4: Template Literals in Query Filters (LOW)

**Location:** `apps/web/app/dashboard/boxes/new/page.tsx:41`

```typescript
.or(`household_id.eq.${householdId},household_id.is.null`)
```

**Note:** Currently safe because `householdId` comes from authenticated session. However, parameterized queries are preferred when available.

---

## 3. Current Architecture Patterns

### Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                         WEB APP                              │
├─────────────────────────────────────────────────────────────┤
│  Server Components (boxes/page.tsx, etc.)                   │
│  └─ Use SSR client → Fetch via RLS (anon key)               │
│                                                             │
│  Client Components (box-form.tsx)                           │
│  └─ Use browser client → Direct mutations (CONCERN)         │
│                                                             │
│  Auth Context (auth-context.tsx)                            │
│  └─ Use browser client → Auth + user_households SELECT      │
│                                                             │
│  API Routes                                                 │
│  └─ Only test/health endpoints exist (NO CRUD)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        MOBILE APP                            │
├─────────────────────────────────────────────────────────────┤
│  All operations use client-side Supabase                    │
│  └─ This is ACCEPTABLE for mobile apps with RLS             │
└─────────────────────────────────────────────────────────────┘
```

### What's Working Well

1. **Server Components fetch data correctly** - Data is fetched server-side in `boxes/page.tsx`, `boxes/[id]/page.tsx`

2. **RLS is consistently applied** - All queries filter by `household_id` or `user_id`

3. **Auth session management** - Proper cookie-based session handling with `@supabase/ssr`

4. **Middleware protection** - Routes properly protected via `middleware.ts`

5. **Mobile secure storage** - Tokens stored in Keychain/Keystore, not AsyncStorage

---

## 4. Recommendations

### Priority 1: Move Mutations to Server Actions

**For Next.js App Router**, convert client-side mutations to Server Actions:

```typescript
// apps/web/app/actions/boxes.ts
"use server";

import { createClient } from "@/lib/supabase-ssr";
import { boxInsertSchema } from "@boxtrack/shared";
import { revalidatePath } from "next/cache";

export async function createBox(input: unknown) {
  const supabase = await createClient();

  // Validate user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Validate input with Zod
  const parsed = boxInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  // Insert with server-side client
  const { data, error } = await supabase
    .from("boxes")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/boxes");
  return { data };
}
```

### Priority 2: Create API Routes for CRUD Operations

For operations that need more control (rate limiting, logging, etc.):

```
apps/web/app/api/
├── boxes/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── photos/
│   └── route.ts          # POST (upload)
└── households/
    └── route.ts          # GET, POST
```

### Priority 3: Improve Type Safety

Create proper types for nested query results:

```typescript
// packages/shared/src/query-types.ts
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

export type BoxWithRelations = Tables["boxes"]["Row"] & {
  categories: Tables["categories"]["Row"] | null;
  box_types: Tables["box_types"]["Row"] | null;
  photos: Tables["photos"]["Row"][];
};

export type UserHouseholdWithDetails = {
  role: string;
  joined_at: string;
  household: Tables["households"]["Row"];
};
```

### Priority 4: Remove or Protect Test Endpoint

Either:
- Remove `apps/web/app/api/test-supabase/route.ts` before production
- Add authentication check and restrict to admin users

---

## 5. Mobile App Considerations

**Current approach is acceptable** for mobile:
- Mobile apps commonly use direct client-side Supabase calls
- RLS provides security at the database level
- No sensitive server-side operations to protect

**However, consider:**
- Adding input validation with Zod before mutations
- Implementing offline queue for mutations (already planned per CLAUDE.md)
- Rate limiting at the database/Supabase level

---

## 6. Security Assessment

### Secure Patterns in Use

| Pattern | Implementation |
|---------|----------------|
| Service role key isolation | Only in server-side files |
| Anon key for client code | All client code uses public keys |
| RLS enforcement | All tables use household_id scoping |
| Session validation | Middleware checks on protected routes |
| Secure mobile storage | expo-secure-store for tokens |

### Recommendations for Enhanced Security

1. **Use `getUser()` not `getSession()` on server** - Per Supabase docs, `getSession()` doesn't validate the JWT signature server-side

2. **Add rate limiting** - Consider Supabase Edge Functions or Vercel middleware for rate limiting mutations

3. **Audit RLS policies** - Ensure INSERT/UPDATE/DELETE policies are as restrictive as SELECT

4. **Enable Supabase Auth logs** - Monitor for suspicious authentication patterns

---

## 7. Summary of Action Items

| Priority | Action | Effort | Status |
|----------|--------|--------|--------|
| HIGH | Convert box creation to API route | 1-2 hours | DONE |
| HIGH | Add proper types for nested queries | 2-3 hours | TODO |
| MEDIUM | Create API routes for future CRUD | 4-6 hours | TODO |
| MEDIUM | Replace `getSession()` with `getUser()` on server | 1 hour | TODO |
| LOW | Remove/protect test-supabase endpoint | 15 min | TODO |
| LOW | Document RLS policies | 1-2 hours | TODO |

---

## References

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR Client Guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing Your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Browser vs Server Client](https://medium.com/@heejljoseph/supabase-browser-client-vs-supabase-server-client-7ed4651a5c6e)
