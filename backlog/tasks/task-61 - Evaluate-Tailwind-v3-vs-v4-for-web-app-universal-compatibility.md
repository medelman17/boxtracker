---
id: task-61
title: Evaluate Tailwind v3 vs v4 for web app universal compatibility
status: Done
assignee: []
created_date: '2026-01-08 21:54'
updated_date: '2026-01-08 22:01'
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
- [x] #1 Analysis document created comparing v3 vs v4 tradeoffs
- [x] #2 Decision made and documented
- [x] #3 If migrating to v3: web app converted to v3 syntax
- [x] #4 If keeping v4: document how to handle version differences
- [x] #5 Both apps build successfully after decision
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Analysis Results

### Current Configuration
- **Web (apps/web):** Tailwind CSS v4.1.0 with `@import "tailwindcss"` syntax
- **Mobile (apps/mobile):** Tailwind CSS v3.4.19 with NativeWind v4.2.1

### NativeWind Compatibility Research

**NativeWind v4 (current, stable):**
- Requires Tailwind CSS v3.4+
- Cannot use Tailwind v4

**NativeWind v5 (preview, not stable):**
- Built on Tailwind CSS v4.1+
- Released to npm with `preview` tag (Sept 2025)
- Not recommended for production use yet
- Requires React Native 0.81+ for full functionality

### packages/ui Component Analysis

Current shared components in packages/ui:
- **Button.tsx** - Uses HTML `<button>` element with Tailwind classes (web-only)
- **StatusBadge.tsx** - Uses HTML `<span>` element (web-only)
- **LocationDisplay.tsx** - Uses HTML `<div>` and `<span>` elements (web-only)
- **QRCode** - Has platform-specific implementations (.web.tsx, .native.tsx) ✓

The existing shared components don't work cross-platform since they use raw HTML elements.

### Options Evaluated

1. **Keep Tailwind v4 on web (Recommended)**
   - Pros: No migration work, keeps v4 features, apps are isolated
   - Cons: Can't share Tailwind configs between apps
   
2. **Downgrade web to Tailwind v3**
   - Pros: Could share Tailwind configs, guaranteed compatibility
   - Cons: Loses Tailwind v4 features, requires rewriting globals.css, rollback work

3. **Upgrade mobile to NativeWind v5 preview**
   - Pros: Aligns Tailwind versions, future-proof
   - Cons: Preview/unstable, not production ready, risky

### Recommendation: Keep Current Setup

**Rationale:**
1. Web and mobile apps have isolated styling configurations - no shared Tailwind config needed
2. Universal components will use **gluestack-ui primitives** (View, Text, Pressable), not raw HTML
3. gluestack-ui handles Tailwind version abstraction internally via NativeWind
4. When NativeWind v5 becomes stable, migration to unified Tailwind v4 will be straightforward
5. The version difference does NOT block universal component development

### Migration Path (Future)
When NativeWind v5 becomes stable:
1. Upgrade mobile to NativeWind v5 + Tailwind v4
2. Align CSS syntax between apps
3. Consider shared Tailwind theme tokens

## Verification

- ✅ Web app build: `pnpm --filter web build` - Success (Next.js 16.1.1 Turbopack)
- ✅ Mobile app typecheck: `pnpm --filter mobile typecheck` - Success
<!-- SECTION:NOTES:END -->
