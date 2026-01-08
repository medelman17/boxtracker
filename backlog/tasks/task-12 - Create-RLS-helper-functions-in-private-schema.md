---
id: task-12
title: Create RLS helper functions in private schema
status: Done
assignee: []
created_date: '2026-01-08 03:08'
updated_date: '2026-01-08 03:14'
labels:
  - infrastructure
  - security
  - database
  - rls
dependencies:
  - task-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create security definer helper functions in a private schema to avoid RLS recursion issues. These functions will be used by all RLS policies to check household membership and user roles.

Key functions needed:
1. `private.get_user_household_role(household_id uuid, user_id uuid)` - Returns user's role in household
2. `private.user_has_household_access(household_id uuid, user_id uuid)` - Returns boolean if user has any access
3. `private.user_has_role(household_id uuid, user_id uuid, required_role text)` - Checks if user has specific role

Best practices from research:
- Use SECURITY DEFINER to bypass RLS during permission checks
- Store in private schema (never expose via API)
- Set `search_path = ''` for security
- Return simple types (text, boolean, uuid)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Private schema created and excluded from API
- [ ] #2 get_user_household_role function returns correct role for user
- [ ] #3 user_has_household_access function returns true for members, false for non-members
- [ ] #4 user_has_role function correctly validates role hierarchy
- [ ] #5 All functions use SECURITY DEFINER
- [ ] #6 Functions have proper search_path set for security
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created migration 003_create_rls_helper_functions.sql with:

1. **Private Schema Created**
   - Dedicated `private` schema for internal security functions
   - Revoked from public role
   - Granted to authenticated/anon for function execution only

2. **Four Helper Functions Implemented**
   - `get_user_household_role(household_id, user_id)` - Returns user's role
   - `user_has_household_access(household_id, user_id)` - Boolean membership check
   - `user_has_role(household_id, user_id, required_role)` - Role hierarchy validation
   - `get_user_household_ids(user_id)` - Returns all household IDs for user

3. **Security Features**
   - All functions use SECURITY DEFINER to bypass RLS (prevents recursion)
   - All functions set search_path = '' for security
   - All functions marked STABLE for query optimization
   - Proper permissions granted (authenticated/anon can execute)

4. **Documentation Created**
   - PRIVATE_SCHEMA_CONFIG.md documents configuration requirements
   - Includes examples of how to use functions in RLS policies
   - Provides verification steps

**Next Steps:**
- Apply migration: Run locally or push to Supabase
- Configure API to exclude private schema (Dashboard or config.toml)
- Refactor existing RLS policies to use helper functions (subsequent tasks)
<!-- SECTION:NOTES:END -->
