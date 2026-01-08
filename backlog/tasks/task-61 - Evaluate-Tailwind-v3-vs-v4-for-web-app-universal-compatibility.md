---
id: task-61
title: Evaluate Tailwind v3 vs v4 for web app universal compatibility
status: To Do
assignee: []
created_date: '2026-01-08 21:54'
updated_date: '2026-01-08 21:55'
labels:
  - infrastructure
  - tailwind
  - decision
milestone: Universal Components & Cross-Platform UI
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Investigate and decide whether to keep Tailwind v4 on web or downgrade to v3 for maximum compatibility with NativeWind and universal components.

## Current State
- Web app: Tailwind CSS v4 (using @import "tailwindcss" syntax)
- Mobile app: Tailwind CSS v3 (required by NativeWind v4)
- This version mismatch may cause issues with shared components

## Key Considerations

### Keep Tailwind v4 on Web
**Pros:**
- Latest features and performance
- Modern CSS-first configuration
- Better RSC support potentially

**Cons:**
- Different config syntax than mobile
- Cannot share tailwind.config.js
- NativeWind doesn't support v4 yet

### Downgrade Web to Tailwind v3
**Pros:**
- Same version as mobile (NativeWind requirement)
- Can potentially share tailwind.config.js
- Easier universal component development

**Cons:**
- Lose Tailwind v4 features
- Different config syntax (@tailwind directives)
- Migration effort

## Recommendation
If pursuing true universal components with NativeWind on web, downgrade to v3. If keeping gluestack-ui separate on each platform with platform-specific styling, v4 on web is fine.

## Tasks to Complete
1. Test current setup with shared components
2. Document any styling inconsistencies
3. Make final decision based on project goals
4. Implement migration if needed
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Analysis document created comparing v3 vs v4 tradeoffs
- [ ] #2 Decision made and documented
- [ ] #3 If migrating to v3: web app converted to v3 syntax
- [ ] #4 If keeping v4: document how to handle version differences
- [ ] #5 Both apps build successfully after decision
<!-- AC:END -->
