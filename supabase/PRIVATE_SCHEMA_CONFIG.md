# Private Schema Configuration

## Overview

The `private` schema contains security definer helper functions for RLS policies. This schema **must never be exposed** via the PostgREST API to prevent potential security issues.

## Helper Functions Available

Located in migration `003_create_rls_helper_functions.sql`:

1. **`private.get_user_household_role(household_id, user_id)`**
   - Returns the user's role in a household (owner, admin, member, viewer)
   - Returns NULL if user is not a member

2. **`private.user_has_household_access(household_id, user_id)`**
   - Returns boolean indicating if user is a member of the household
   - Faster than getting the role when you only need existence check

3. **`private.user_has_role(household_id, user_id, required_role)`**
   - Returns boolean indicating if user has the specified role or higher
   - Role hierarchy: owner > admin > member > viewer

4. **`private.get_user_household_ids(user_id)`**
   - Returns all household IDs that the user belongs to
   - Useful for `IN` clauses in RLS policies

## Configuration Required

### Option 1: Supabase Dashboard (Recommended for Cloud Projects)

1. Go to **Settings** > **API** in your Supabase Dashboard
2. Under **Schema** settings, ensure only `public` and `storage` are listed
3. The `private` schema should NOT be in the exposed schemas list

### Option 2: Local Development (supabase/config.toml)

If using Supabase CLI for local development, create or update `supabase/config.toml`:

```toml
[api]
# Only expose these schemas via PostgREST
schemas = ["public", "storage"]

# Explicitly exclude private schema
excluded_schemas = ["private"]
```

### Option 3: Self-Hosted PostgREST

If self-hosting, configure PostgREST directly:

```conf
db-schemas = "public,storage"
# Or explicitly exclude:
db-schemas = "!private"
```

## Security Notes

- **SECURITY DEFINER**: All functions in the private schema use `SECURITY DEFINER` to bypass RLS
- **Search Path**: All functions set `search_path = ''` for security
- **Permissions**: Only `authenticated` and `anon` roles can execute these functions
- **No Public Access**: The private schema is revoked from the `public` role

## Why Use Security Definer Functions?

From Supabase documentation:

> When RLS policies query other tables with RLS enabled, this can cause recursion issues and performance problems. Using `SECURITY DEFINER` functions bypasses RLS checks, preventing recursion and improving performance.

## Usage Example in RLS Policies

Instead of:
```sql
-- ❌ Can cause RLS recursion
CREATE POLICY "Users can view boxes"
  ON boxes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );
```

Use:
```sql
-- ✅ Uses helper function, no recursion
CREATE POLICY "Users can view boxes"
  ON boxes FOR SELECT
  USING (
    private.user_has_household_access(household_id)
  );
```

## Verification

To verify the private schema is properly excluded from your API:

```bash
# Should NOT return any private schema functions
curl https://your-project.supabase.co/rest/v1/
```

Or test in browser:
```
https://your-project.supabase.co/rest/v1/rpc/get_user_household_role
```

Should return: `404 Not Found` or `function not found` (good!)

## Migration Status

- ✅ Migration `003_create_rls_helper_functions.sql` created
- ⏳ Needs to be applied: `supabase db push` or `supabase migration up`
- ⏳ API configuration needs to be updated (see above)
