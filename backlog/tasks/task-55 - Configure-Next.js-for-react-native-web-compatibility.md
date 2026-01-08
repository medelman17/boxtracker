---
id: task-55
title: Configure Next.js for react-native-web compatibility
status: Done
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 22:18'
labels:
  - web
  - infrastructure
  - react-native-web
milestone: Universal Components & Cross-Platform UI
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update Next.js configuration to support react-native-web, enabling future sharing of React Native components between mobile and web apps.

## Current State
- next.config.ts has basic transpilePackages for @boxtrack packages
- No react-native-web alias or NativeWind support
- Web components are web-only (not shareable with mobile)

## Required Changes

### apps/web/next.config.ts
```typescript
import { withExpo } from "@expo/next-adapter";

const nextConfig = withExpo({
  transpilePackages: [
    "@boxtrack/shared",
    "@boxtrack/ui",
    "react-qr-code",
    // ADD for RN-web support:
    "react-native",
    "react-native-web",
    "nativewind",
    "react-native-css-interop",
    "react-native-reanimated",
    "react-native-svg",
  ],
  experimental: {
    forceSwcTransforms: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
    };
    return config;
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
});

export default nextConfig;
```

### Dependencies to Add
```bash
pnpm add react-native-web @expo/next-adapter --filter web
```

## Benefits
- Can import React Native components directly in Next.js
- Enables true universal components in packages/ui
- Foundation for maximum code sharing

## Notes
- NativeWind only works with "use client" routes or /pages router (RSC support in progress)
- May require Tailwind v3 on web if using NativeWind for universal styling
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 @expo/next-adapter and react-native-web installed
- [x] #2 next.config.ts has proper webpack alias for react-native
- [x] #3 All RN packages in transpilePackages array
- [x] #4 Existing web functionality still works
- [x] #5 Can import View/Text from react-native in web app
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Notes

### Dependencies Added
- `react-native-web`: Provides React Native primitives for web
- `@expo/next-adapter`: Expo compatibility for Next.js (though not actively wrapping config due to Turbopack)

### next.config.ts Changes
1. Added `turbopack` config with `resolveAlias` for react-native → react-native-web
2. Added `resolveExtensions` to prefer .web.tsx files over .native.tsx
3. Kept webpack config as fallback for non-Turbopack builds
4. Added transpilePackages for RN and gluestack-ui packages

### Verification
- ✅ TypeScript compilation passes with react-native imports
- ✅ Build succeeds with Turbopack
- ✅ Test component `components/rn-web-test.tsx` uses View, Text, Pressable, StyleSheet

### Important Notes
- `className` prop on RN components requires NativeWind (not installed on web)
- gluestack-ui components abstract this - they use tva() for styling
- Use StyleSheet.create() for direct RN component styling on web without NativeWind
<!-- SECTION:NOTES:END -->
