# ADR 001: Tailwind CSS Version Strategy for Web and Mobile

**Status:** Accepted
**Date:** 2026-01-08
**Decision Makers:** Development Team

## Context

BoxTrack is a monorepo with both a Next.js web app and an Expo mobile app. Both apps use Tailwind CSS for styling, but with different requirements:

- **Web app (apps/web):** Uses Tailwind CSS v4.1.0 with the modern CSS-first `@import "tailwindcss"` syntax
- **Mobile app (apps/mobile):** Uses Tailwind CSS v3.4.19 with NativeWind v4.2.1 for React Native styling

This version mismatch raised questions about whether we should align versions for better code sharing, particularly for universal components in `packages/ui`.

### Options Considered

1. **Keep Tailwind v4 on web, v3 on mobile (current setup)**
2. **Downgrade web to Tailwind v3** for maximum compatibility
3. **Upgrade mobile to NativeWind v5** (preview) which supports Tailwind v4

## Decision

**We will keep the current setup: Tailwind v4 on web, Tailwind v3 on mobile.**

## Rationale

### NativeWind Compatibility

- **NativeWind v4** (stable, production-ready) requires Tailwind CSS v3.4+
- **NativeWind v5** supports Tailwind v4 but is still in preview (released Sept 2025) and not recommended for production

### Architectural Isolation

The version mismatch does not create practical problems because:

1. **Separate configurations:** Web and mobile apps have isolated Tailwind configurations with no shared `tailwind.config.js`

2. **Universal components use gluestack-ui:** Shared components in `packages/ui` will use gluestack-ui primitives (`View`, `Text`, `Pressable`) which abstract away Tailwind version differences

3. **Platform-specific styling is OK:** Each app can optimize its styling approach for its platform without compromise

### Current packages/ui State

Existing shared components (Button, StatusBadge, LocationDisplay) use raw HTML elements and are web-only. The QRCode component already demonstrates the correct pattern with platform-specific implementations (`.web.tsx` and `.native.tsx`).

## Consequences

### Positive

- No migration work required
- Web app retains Tailwind v4 features (CSS-first config, better performance)
- Mobile app uses stable, production-ready NativeWind v4
- Clear path to unified Tailwind v4 when NativeWind v5 stabilizes

### Negative

- Cannot share `tailwind.config.js` between apps
- Must maintain awareness of which Tailwind classes work on each platform
- Theme tokens (colors, spacing) defined separately in each app

### Neutral

- Universal components must use gluestack-ui primitives, not raw HTML (this was already the plan)

## Future Migration Path

When NativeWind v5 becomes stable (estimated Q2 2026):

1. Upgrade mobile to NativeWind v5 + Tailwind v4
2. Align CSS syntax between apps (`@import` style)
3. Consider extracting shared Tailwind theme tokens to `packages/shared`

## References

- [NativeWind v4 to v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4)
- [NativeWind Tailwind v4 Discussion #1422](https://github.com/nativewind/nativewind/discussions/1422)
- [Expo Tailwind CSS Guide](https://docs.expo.dev/guides/tailwind/)
- Task-61 analysis in backlog
