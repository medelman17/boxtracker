---
id: task-62
title: Verify Metro monorepo configuration for shared packages
status: To Do
assignee: []
created_date: '2026-01-08 21:55'
updated_date: '2026-01-08 21:55'
labels:
  - mobile
  - infrastructure
  - metro
  - monorepo
milestone: Universal Components & Cross-Platform UI
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify and optimize the Metro bundler configuration for proper monorepo support, ensuring shared packages are resolved and watched correctly.

## Current State (apps/mobile/metro.config.js)
```javascript
const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;
module.exports = withNativeWind(config, { input: "./global.css" });
```

## Verification Checklist
1. Changes in packages/shared trigger hot reload in mobile app
2. Changes in packages/ui trigger hot reload in mobile app
3. No "Unable to resolve module" errors for workspace packages
4. Symlinked packages resolve correctly with pnpm

## Potential Optimizations
- Add extraNodeModules for explicit package resolution
- Configure sourceExts if using platform-specific extensions
- Add blockList for unnecessary folders

## Reference Configuration
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Explicit package resolution for monorepo
config.resolver.extraNodeModules = {
  "@boxtrack/shared": path.resolve(workspaceRoot, "packages/shared"),
  "@boxtrack/ui": path.resolve(workspaceRoot, "packages/ui"),
};

config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: "./global.css" });
```
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hot reload works for changes in packages/shared
- [ ] #2 Hot reload works for changes in packages/ui
- [ ] #3 No module resolution errors during development
- [ ] #4 Build completes successfully with all workspace packages
<!-- AC:END -->
