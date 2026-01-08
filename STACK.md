# BoxTrack Technology Stack

**Last Updated:** January 7, 2026

This document provides detailed version information, key features, and migration notes for all core dependencies in the BoxTrack project.

## Quick Reference

| Category | Package | Version | Status |
|----------|---------|---------|--------|
| Web Framework | Next.js | 16.1.1 | ✅ Stable |
| Mobile Framework | Expo SDK | 54 | ✅ Stable (55 soon) |
| Mobile Framework | React Native | 0.83.1 | ✅ Stable |
| Mobile Router | Expo Router | 6.0.21 | ✅ Stable |
| Package Manager | pnpm | 10.27.0 | ✅ Stable |
| Build Tool | Turborepo | 2.7.3 | ✅ Stable |
| Language | TypeScript | 5.8/5.9 | ✅ Stable |
| Validation | Zod | 4.3.5 | ✅ Stable |
| Styling (Web) | Tailwind CSS | 4.1 | ✅ Stable |
| Styling (Mobile) | NativeWind | 4.2.1 | ✅ Stable |
| Testing | Vitest | 4.0.16 | ✅ Stable |
| Testing | React Testing Library | 16.3.1 | ✅ Stable |
| Backend | Supabase JS | 2.89.0 | ✅ Stable |

---

## Core Frameworks

### Next.js 16.1.1

**npm:** `next@16.1.1`

**Major Features:**
- ✨ **Turbopack File System Caching** - Now stable and on by default, significantly faster dev server restarts
- 🎯 **"use cache" Directive** - Cache pages, components, and functions declaratively
- ⚛️ **React 19.2 Support** - View Transitions, useEffectEvent, and Activity APIs
- 🚀 **Routing Overhaul** - Complete redesign for faster, leaner page transitions
- 🔄 **React Compiler** - Built-in stable support for automatic component memoization

**Breaking Changes:**
- Review [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)

**Installation:**
```bash
pnpm add next@16.1.1 react@latest react-dom@latest
```

**Resources:**
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)
- [Next.js 16.1 Release Notes](https://nextjs.org/blog/next-16-1)

---

### Expo SDK 54 (SDK 55 Coming January 2026)

**npm:** `expo@54.0.30`

**Current Stable Features:**
- React Native 0.81
- React 19.1 support
- Minimum Node version: 20.19.4+
- Expo Router 6 with iOS 26 bottom tabs UI

**Upcoming SDK 55 (January 2026):**
- React Native 0.83
- React 19.2
- No breaking changes (first RN release with zero breaking changes!)
- Enhanced DevTools with network inspection and performance tracing

**Migration Strategy:**
1. Start with SDK 54 for immediate development
2. Upgrade to SDK 55 when released (expected mid-January 2026)
3. Follow [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)

**Installation:**
```bash
pnpm add expo@54.0.30
```

**Resources:**
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo Documentation](https://docs.expo.dev/)

---

### React Native 0.83.1

**npm:** `react-native@0.83.1`

**Major Features:**
- ⚛️ **React 19.2** - Full support for latest React features
- 🔧 **Enhanced DevTools** - Network inspection, performance tracing, new bundled desktop app
- 🎯 **Web Performance APIs** - Support for Web Performance and Intersection Observer (Canary)
- ✅ **No Breaking Changes** - First React Native release with zero user-facing breaking changes!

**New Architecture:**
- TurboModules for improved module system
- Fabric Renderer for better UI performance
- JSI (JavaScript Interface) for near-native performance

**Installation:**
```bash
# Included with Expo SDK, or for bare React Native:
pnpm add react-native@0.83.1
```

**Resources:**
- [React Native 0.83 Blog Post](https://reactnative.dev/blog/2025/12/10/react-native-0.83)

---

### Expo Router 6.0.21

**npm:** `expo-router@6.0.21`

**Features:**
- File-based routing for React Native
- iOS 26 bottom tabs UI
- Deep linking support
- Type-safe navigation

**Installation:**
```bash
pnpm add expo-router@6.0.21
npx expo install react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

**Resources:**
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

---

## Build Tools & Package Management

### pnpm 10.27.0

**Installation:**
```bash
npm install -g pnpm@10.27.0
# or use corepack
corepack prepare pnpm@10.27.0 --activate
```

**Features:**
- Fast, disk space efficient package manager
- Excellent monorepo support
- Strict dependency resolution

**Resources:**
- [pnpm Documentation](https://pnpm.io/)

---

### Turborepo 2.7.3

**npm:** `turbo@2.7.3`

**New in 2.7:**
- 📊 **Visual DevTools** - Run `turbo devtools` to explore Package/Task graphs with hot-reloading
- 🔧 **Package Configurations** - Write config once, share anywhere in repository
- 📦 **Yarn Catalogs Support** - Updated lockfile parser

**Installation:**
```bash
pnpm add -D turbo@2.7.3
```

**Upgrade:**
```bash
pnpm dlx @turbo/codemod migrate
```

**Resources:**
- [Turborepo 2.7 Blog Post](https://turborepo.com/blog/turbo-2-7)
- [Turborepo Documentation](https://turborepo.com/)

---

### TypeScript 5.8/5.9

**npm:** `typescript@latest`

**Current Stable:** 5.8 or 5.9 (both stable as of January 2026)

**TypeScript 7.0 Preview Available:**
- Native port (Project Corsa) offers ~10x speedup
- Not recommended for production yet
- TypeScript 6.0 will be a bridge release

**Installation:**
```bash
pnpm add -D typescript@latest
```

**Resources:**
- [TypeScript 5.8 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html)
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)

---

## Validation & Styling

### Zod 4.3.5 🚀

**npm:** `zod@4.3.5`

**MAJOR VERSION UPGRADE - Huge Performance Improvements!**

**Performance Gains:**
- 🚀 **14x faster** string parsing
- 🚀 **7x faster** array parsing
- 🚀 **6.5x faster** object parsing
- 📦 **57% smaller** bundle size
- ⚡ **20x reduction** in TypeScript compiler instantiations

**New Features:**
- Built-in JSON Schema conversion (no external tools needed)
- New tree-shakable `@zod/mini` package
- Entirely new internal architecture

**Breaking Changes:**
- Review [Zod v4 migration guide](https://zod.dev/v4)

**Installation:**
```bash
pnpm add zod@4.3.5
```

**Resources:**
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Zod Documentation](https://zod.dev/)

---

### Tailwind CSS v4.1 🎨

**npm:** `tailwindcss@4.1`

**MAJOR VERSION UPGRADE - Complete Redesign!**

**Performance:**
- 🚀 **5x faster** full builds
- ⚡ **100x faster** incremental builds

**Major Changes:**
- 🎯 **CSS-based Configuration** - No more `tailwind.config.js`!
- 🔍 **Automatic Content Detection** - No manual content paths needed
- 🏗️ **Modern CSS Features** - Built on cascade layers, @property, color-mix()
- 📦 **Fewer Dependencies** - Simplified installation

**Browser Requirements:**
- Safari 16.4+
- Chrome 111+
- Firefox 128+

⚠️ **Important:** If you need older browser support, stay on Tailwind CSS v3.4

**Installation:**
```bash
pnpm add tailwindcss@4.1
```

**Migration:**
- Configuration moves from JavaScript to CSS
- Review [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)

**Resources:**
- [Tailwind CSS v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

### NativeWind 4.2.1

**npm:** `nativewind@4.2.1`

**Status:** Stable for production

**NativeWind v5 Preview:**
- Available but NOT production-ready
- Use v4.2.1 for BoxTrack

**Features:**
- Tailwind CSS utilities for React Native
- Compatible with Expo
- Fast Refresh support
- Enhanced animations and transitions (experimental in v4.1+)

**Installation:**
```bash
pnpm add nativewind@4.2.1
```

**Resources:**
- [NativeWind Documentation](https://www.nativewind.dev/)
- [NativeWind v4.1 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4-1)

---

## Testing

### Vitest 4.0.16 ✅

**npm:** `vitest@4.0.16`

**MAJOR VERSION - Stable Browser Mode!**

**Major Features:**
- 🌐 **Stable Browser Mode** - Test in real browsers (Chrome, Firefox, Safari) instead of JSDOM
- 📸 **Visual Regression Testing** - `toMatchScreenshot()` assertion for UI testing
- 🎭 **Playwright Traces** - Enhanced debugging with Playwright trace support
- ⚡ **Performance** - Continued speed improvements

**Growth:** 7M → 17M weekly downloads in past year

**Breaking Changes:**
- Review [Vitest 4 migration guide](https://vitest.dev/guide/migration.html)

**Installation:**
```bash
pnpm add -D vitest@4.0.16
```

**Resources:**
- [Vitest 4.0 Blog Post](https://vitest.dev/blog/vitest-4)
- [Vitest Documentation](https://vitest.dev/)

---

### React Testing Library 16.3.1

**npm:** `@testing-library/react@16.3.1`

**Important Change in v16:**
- Now requires `@testing-library/dom` as a peer dependency

**Requirements:**
- React 18+
- @testing-library/dom (peer dependency)

**Installation:**
```bash
pnpm add -D @testing-library/react@16.3.1 @testing-library/dom
```

**Resources:**
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)

---

## Backend

### Supabase JavaScript Client 2.89.0

**npm:** `@supabase/supabase-js@2.89.0`

**Features:**
- Isomorphic JavaScript client for Supabase
- Database queries, realtime subscriptions
- File upload/download
- RPC and Edge Functions
- pgvector support

**Important Note:**
- Node.js 18 support dropped in v2.79.0
- Requires Node.js 20+

**Installation:**
```bash
pnpm add @supabase/supabase-js@2.89.0
```

**Resources:**
- [Supabase JS Documentation](https://supabase.com/docs/reference/javascript/v1)
- [Supabase Releases](https://github.com/supabase/supabase-js/releases)

---

## Recommended Package Versions for BoxTrack

### Root package.json (Monorepo)

```json
{
  "packageManager": "pnpm@10.27.0",
  "engines": {
    "node": ">=20.19.4",
    "pnpm": ">=10.0.0"
  },
  "devDependencies": {
    "turbo": "^2.7.3",
    "typescript": "^5.8.0"
  }
}
```

### apps/web (Next.js)

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.1.0",
    "zod": "^4.3.5",
    "@supabase/supabase-js": "^2.89.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^4.0.16",
    "@testing-library/react": "^16.3.1",
    "@testing-library/dom": "^10.0.0"
  }
}
```

### apps/mobile (Expo)

```json
{
  "dependencies": {
    "expo": "~54.0.30",
    "expo-router": "^6.0.21",
    "react": "^19.1.0",
    "react-native": "^0.83.1",
    "nativewind": "^4.2.1",
    "zod": "^4.3.5",
    "@supabase/supabase-js": "^2.89.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

### packages/shared (Shared Types & Schemas)

```json
{
  "dependencies": {
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^4.0.16"
  }
}
```

---

## Migration Priorities

### High Priority (Breaking Changes)

1. **Zod 3 → 4** - Review schema definitions, major performance wins
2. **Tailwind CSS 3 → 4** - Configuration moves to CSS, check browser requirements
3. **React Testing Library 15 → 16** - Add @testing-library/dom peer dependency

### Medium Priority (Feature Upgrades)

1. **Next.js 14 → 16** - Leverage new caching, React Compiler
2. **Vitest 3 → 4** - Adopt Browser Mode for component tests
3. **Expo SDK 54 → 55** - When SDK 55 releases (January 2026)

### Low Priority (Minor Updates)

1. **Turborepo** - Use `pnpm dlx @turbo/codemod migrate`
2. **TypeScript** - Standard semver upgrade
3. **Supabase JS** - Standard semver upgrade

---

## Version Compatibility Matrix

| Next.js | React | Node.js | TypeScript | Expo SDK | React Native |
|---------|-------|---------|------------|----------|--------------|
| 16.1.1  | 19.2  | 20.19.4+ | 5.8/5.9   | 54       | 0.83.1       |

---

## Additional Resources

- [Next.js](https://nextjs.org/)
- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Supabase](https://supabase.com/)
- [Turborepo](https://turbo.build/)
- [Vitest](https://vitest.dev/)
- [Zod](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NativeWind](https://www.nativewind.dev/)

---

## Update Schedule

This document should be updated:
- When upgrading major dependencies
- When SDK 55 releases (expected January 2026)
- Quarterly for minor version updates
- When encountering breaking changes during development
