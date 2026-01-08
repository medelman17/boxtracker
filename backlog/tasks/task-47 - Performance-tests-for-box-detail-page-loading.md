---
id: task-47
title: Performance tests for box detail page loading
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - testing
  - performance
  - web
  - mobile
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create performance tests for box detail page data fetching and rendering.

Measure:
- Time to fetch box data from Supabase
- Time to first render (TTFR)
- Time to interactive (TTI)
- QR code render time
- Photo gallery render time with many images (10+, 50+, 100+)

Test scenarios:
- Box with minimal data (no photos)
- Box with moderate data (5-10 photos)
- Box with heavy data (50+ photos)

Document performance baselines and add performance budget checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Performance test suite created
- [ ] #2 Measures key metrics (fetch time, TTFR, TTI)
- [ ] #3 Tests scenarios with varying data sizes
- [ ] #4 Performance baselines documented
- [ ] #5 Performance budgets defined and enforced
<!-- AC:END -->
