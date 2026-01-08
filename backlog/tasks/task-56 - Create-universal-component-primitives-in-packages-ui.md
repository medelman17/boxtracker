---
id: task-56
title: Create universal component primitives in packages/ui
status: To Do
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 21:55'
labels:
  - ui
  - infrastructure
  - universal
  - monorepo
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-55
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish a pattern for truly universal components in packages/ui that work on both web (Next.js) and mobile (Expo) using React Native primitives with NativeWind styling.

## Current State
- packages/ui has web-centric components (Button, StatusBadge use HTML/Tailwind)
- QRCode already has platform-specific implementations (.web.tsx, .native.tsx)
- Mobile app has its own gluestack components in apps/mobile/components/ui

## Target Architecture
Create base primitives that use React Native components + NativeWind, which render correctly on both platforms via react-native-web.

## Implementation Pattern

### packages/ui/src/primitives/index.tsx
```typescript
import { View as RNView, Text as RNText, Pressable } from "react-native";
import { cssInterop } from "nativewind";

// Wrap RN components for NativeWind className support
export const View = cssInterop(RNView, { className: "style" });
export const Text = cssInterop(RNText, { className: "style" });
export const TouchableOpacity = cssInterop(Pressable, { className: "style" });
```

### Usage Example
```tsx
// packages/ui/src/components/Card.tsx
import { View, Text } from "../primitives";

export function Card({ title, children }) {
  return (
    <View className="bg-white rounded-lg shadow-md p-4">
      <Text className="text-lg font-bold">{title}</Text>
      {children}
    </View>
  );
}
```

## Dependencies Required
- Add nativewind and react-native as dependencies to packages/ui
- Add react-native-css-interop for cssInterop function

## Benefits
- Write once, run on web and mobile
- Consistent styling via Tailwind classes
- No platform-specific file extensions needed for most components
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Primitives (View, Text, Pressable) exported from packages/ui
- [ ] #2 cssInterop properly wraps components for className support
- [ ] #3 At least one universal component created using primitives
- [ ] #4 Component renders correctly in both web and mobile apps
- [ ] #5 TypeScript types work correctly
<!-- AC:END -->
