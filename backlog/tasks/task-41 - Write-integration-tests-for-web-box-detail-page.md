---
id: task-41
title: Write integration tests for web box detail page
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - web
  - testing
  - integration
  - box-detail
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create integration tests for web box detail page at `apps/web/app/dashboard/boxes/[id]/page.test.tsx`.

Tests should cover:
- Page renders box data fetched from Supabase
- Displays all box fields (label, status, category, type, location, description)
- QR code renders with correct value (box.qr_code or generated)
- Photos gallery displays when photos exist
- Metadata section shows created/updated/closed dates
- Redirects to login when not authenticated
- Shows not found for invalid box IDs
- Shows not found for boxes user doesn't have access to (RLS)
- Handles Supabase fetch errors gracefully
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test file created with 9+ test cases
- [ ] #2 All tests pass with pnpm test
- [ ] #3 Mocks Supabase client and session
- [ ] #4 Tests Server Component behavior
- [ ] #5 Covers authentication and authorization scenarios
<!-- AC:END -->
