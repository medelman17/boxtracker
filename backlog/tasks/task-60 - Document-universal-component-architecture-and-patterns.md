---
id: task-60
title: Document universal component architecture and patterns
status: To Do
assignee: []
created_date: '2026-01-08 21:54'
updated_date: '2026-01-08 21:55'
labels:
  - documentation
  - universal
  - architecture
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-56
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create documentation explaining the universal component architecture, including how to create new shared components, platform-specific overrides, and best practices.

## Documentation to Create

### docs/UNIVERSAL_COMPONENTS.md (or in CLAUDE.md)

1. **Architecture Overview**
   - How react-native-web enables code sharing
   - Role of NativeWind for consistent styling
   - gluestack-ui component library usage

2. **Creating Universal Components**
   - Using primitives from packages/ui
   - When to use platform-specific files (.web.tsx, .native.tsx)
   - cssInterop usage for custom components

3. **Styling Guidelines**
   - Tailwind classes that work universally
   - Platform-specific style considerations
   - Design token usage

4. **Common Patterns**
   ```tsx
   // Example: Universal component
   import { View, Text } from "@boxtrack/ui/primitives";
   
   export function Card({ children }) {
     return (
       <View className="bg-white rounded-lg p-4 shadow-md">
         {children}
       </View>
     );
   }
   ```

5. **Troubleshooting**
   - Common issues and solutions
   - Platform-specific debugging tips

## Location Options
- Separate docs/ folder
- Add section to CLAUDE.md
- README in packages/ui
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Documentation created explaining universal component architecture
- [ ] #2 Code examples for creating universal components
- [ ] #3 Platform-specific override pattern documented
- [ ] #4 Troubleshooting section with common issues
- [ ] #5 Documentation is discoverable (linked from README or CLAUDE.md)
<!-- AC:END -->
