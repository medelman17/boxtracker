---
id: task-31
title: Create useBox data fetching hook for mobile
status: To Do
assignee: []
created_date: '2026-01-08 06:33'
labels:
  - mobile
  - hooks
  - data-fetching
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `apps/mobile/hooks/use-box.ts` hook for fetching box details with related data.

Hook should:
- Accept box ID parameter
- Fetch box with box_types, categories, photos
- Return data, isLoading, error states
- Use Supabase client
- Type as BoxWithDetails
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 use-box.ts created in apps/mobile/hooks/
- [ ] #2 Fetches box with all related data (types, categories, photos)
- [ ] #3 Returns typed BoxWithDetails data
- [ ] #4 Includes loading and error states
- [ ] #5 Uses useEffect for data fetching
<!-- AC:END -->
