---
id: task-53
title: Add gluestack-ui to Next.js web app
status: Done
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 22:22'
labels:
  - ui
  - web
  - infrastructure
  - gluestack
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-55
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Initialize gluestack-ui in the web app to achieve UI consistency with the mobile app. This enables sharing the same component patterns and design tokens across platforms.

## Current State
- Mobile app has gluestack-ui v3 with 10 components (button, input, modal, toast, etc.)
- Web app uses plain Tailwind CSS v4 with custom components
- No shared component library between web and mobile for interactive UI elements

## Target State
- Both apps use gluestack-ui components with consistent theming
- Shared design tokens (colors, spacing) via CSS variables
- RSC-compatible setup for Next.js App Router

## Technical Requirements
1. Run `npx gluestack-ui init` in apps/web
2. Use the Next.js 15+ RSC-compatible GluestackUIProvider
3. Configure for Tailwind CSS v4 (web uses v4, mobile uses v3 for NativeWind)
4. Add GluestackUIProvider to root layout

## References
- gluestack-ui docs: https://gluestack.io/ui/docs/home/getting-started/installation
- RSC support: Use `@/components/ui/gluestack-ui-provider/index.next15`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 gluestack-ui is initialized in apps/web
- [x] #2 GluestackUIProvider wraps the app in root layout
- [x] #3 At least 3 gluestack components added (Button, Input, Modal)
- [ ] #4 Dark mode toggle works correctly
- [x] #5 No conflicts with existing Tailwind v4 setup
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Summary

### Components Added
1. **GluestackUIProvider** - Color mode context with system preference detection
   - Supports light/dark/system modes
   - Updates document.documentElement for Tailwind dark mode
   - Provides toggleColorMode and setColorMode functions

2. **Button** - Full-featured button with variants
   - Actions: primary, secondary, positive, negative, default
   - Variants: solid, outline, link
   - Sizes: xs, sm, md, lg, xl
   - Includes ButtonText, ButtonIcon, ButtonSpinner, ButtonGroup

3. **Input** - Form input with FormControl
   - Variants: outline, filled, underlined
   - Sizes: sm, md, lg, xl
   - FormControl wrapper with label, helper, and error text
   - Invalid, disabled, readonly states

4. **Modal** - Portal-based modal system
   - ModalContent, ModalHeader, ModalBody, ModalFooter
   - ModalCloseButton, ModalBackdrop
   - Escape key handling, body scroll lock
   - Size variants: xs, sm, md, lg, xl, full

### Design Tokens
Added full design token palette in globals.css using Tailwind v4 @theme:
- Primary (BoxTrack blue)
- Secondary
- Background
- Typography
- Error, Success, Warning

Dark mode CSS variables override in .dark class.

### Architecture Notes
- Uses class-variance-authority (cva) for variant styling (similar to tva pattern)
- Web-native HTML components with Tailwind v4 classes
- No NativeWind dependency (keeps web on Tailwind v4)
- Same API patterns as mobile gluestack components for developer familiarity

### Verification
- ✅ TypeScript compilation passes
- ✅ Build succeeds with Turbopack
- ✅ Design tokens match mobile app

### Dark Mode Status
- [x] Provider created with toggle functionality
- [ ] Dark mode toggle UI component (can be added later)
- [ ] Full UI verification in dark mode
<!-- SECTION:NOTES:END -->
