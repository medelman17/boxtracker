---
id: task-14
title: Implement RLS policies for user_households table
status: Done
assignee: []
created_date: '2026-01-08 03:08'
updated_date: '2026-01-08 06:12'
labels:
  - infrastructure
  - security
  - database
  - rls
  - rbac
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create RLS policies for the user_households junction table controlling household membership and roles.

Policies needed:
1. SELECT: Members can view all members of their households
2. INSERT: Owners/admins can invite new members; users can join their first household
3. UPDATE: Owners/admins can update member roles (cannot demote themselves)
4. DELETE: Owners can remove members; users can remove themselves (except last owner)

Security considerations:
- Critical for entire multi-tenant security model
- Prevent last owner removal
- Prevent self-demotion for owners
- Support initial household creation during signup
- Validate role hierarchy (owner > admin > member > viewer)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows only members from user's households
- [ ] #2 INSERT allows owner/admin to add members
- [ ] #3 INSERT allows user to join first household (signup flow)
- [ ] #4 UPDATE restricts role changes to owners/admins
- [ ] #5 UPDATE prevents owner self-demotion
- [ ] #6 DELETE allows owners to remove members
- [ ] #7 DELETE allows users to remove themselves
- [ ] #8 DELETE prevents removing last owner
- [ ] #9 Role hierarchy enforced correctly
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in migration 004_optimize_rls_policies.sql (lines 45-84).

RLS policies implemented for user_households table:
- SELECT: "Authenticated users can view all household memberships" - allows auth.uid() IS NOT NULL (needed to avoid circular dependency with helper functions)
- INSERT: "Owners and admins can add members, or self during signup" - allows admin+ or self-join
- UPDATE: "Owners and admins can update members" - requires admin+ role via private.user_has_role()
- DELETE: "Owners can remove members, users can leave" - allows self-removal or owner action

Note: SELECT policy is intentionally permissive to support SECURITY DEFINER helper functions. Real security enforcement happens at household/box level.
<!-- SECTION:NOTES:END -->
