---
id: task-9
title: Add offline support for mobile app
status: To Do
assignee: []
created_date: '2026-01-08 02:50'
labels:
  - feature
  - mobile
  - offline
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement local SQLite cache using expo-sqlite for box metadata. Queue photo uploads when offline and sync when connection restored. Show sync status indicator in UI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Box metadata cached locally in SQLite
- [ ] #2 App functional offline for viewing cached boxes
- [ ] #3 Photo uploads queued when offline
- [ ] #4 Auto-sync when connection restored
- [ ] #5 Sync status indicator visible
- [ ] #6 Conflict resolution for data modified offline
- [ ] #7 Handle sync failures gracefully
<!-- AC:END -->
