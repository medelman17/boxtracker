---
id: task-23
title: Set up RLS policy testing infrastructure
status: To Do
assignee: []
created_date: '2026-01-08 03:08'
labels:
  - testing
  - security
  - database
  - rls
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement comprehensive testing for all RLS policies using pgTAP and Supabase test helpers.

Testing setup needed:
1. Install pgTAP extension and basejump-supabase_test_helpers
2. Create test helper setup file (000-setup-tests-hooks.sql)
3. Create test users with different roles (owner, admin, member, viewer)
4. Create test households and relationships
5. Write test cases for each table's RLS policies
6. Test cross-household isolation
7. Test role-based access control
8. Test edge cases (last owner, soft deletes, cascades)

Testing approach from research:
- Use tests.create_supabase_user() to create test users
- Use tests.authenticate_as() to switch user context
- Use tests.rls_enabled() to verify RLS is enabled
- Test positive cases (should allow) and negative cases (should deny)
- Test all four operations per table
- Run tests in CI/CD pipeline
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pgTAP extension installed
- [ ] #2 basejump-supabase_test_helpers extension installed
- [ ] #3 Test setup file created and runs successfully
- [ ] #4 Test users created with all role types
- [ ] #5 All tables have comprehensive test coverage
- [ ] #6 Cross-household isolation verified
- [ ] #7 Role hierarchy tested thoroughly
- [ ] #8 Edge cases covered (last owner, soft deletes)
- [ ] #9 Tests run in CI pipeline
- [ ] #10 Test documentation created
- [ ] #11 All tests passing
<!-- AC:END -->
