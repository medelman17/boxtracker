---
id: task-58
title: Add CSS reset for react-native-web compatibility
status: To Do
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 21:55'
labels:
  - web
  - css
  - react-native-web
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-55
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add proper CSS reset styles to the web app to ensure react-native-web components render correctly with proper flex layout defaults.

## Background
React Native uses flexbox by default with column direction, while web browsers have different defaults. Without a CSS reset, React Native components rendered via react-native-web may have unexpected layouts.

## Required Changes

### apps/web/app/globals.css
Add to existing file:
```css
/* React Native Web compatibility reset */
html, body, #__next {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#__next {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Prevent text size adjustment on orientation change */
html {
  -webkit-text-size-adjust: 100%;
}

/* Better font rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

## Note on Next.js App Router
With App Router, the root element is different from Pages Router. May need to adjust selectors or use a layout wrapper component.

## Testing
- Verify existing pages still render correctly
- Test with a React Native View component imported from react-native
- Check flex layout behavior matches mobile
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CSS reset added to globals.css
- [ ] #2 Root element has proper flex container setup
- [ ] #3 Existing pages render correctly
- [ ] #4 React Native View components have correct flex behavior
<!-- AC:END -->
