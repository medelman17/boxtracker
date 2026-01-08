# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# BoxTrack - Project Rules for Claude Code

## Project Overview

BoxTrack is a box inventory management system for tracking storage boxes during moves. Users photograph box contents, assign locations (pallet/row/position), and generate QR-coded labels for easy retrieval.

**Architecture:** Monorepo with Expo mobile app and NextJS web app sharing types and components.

**Status:** Monorepo initialized and ready for development. All core packages and apps are set up.

## Development Commands

### Installation

```bash
# Install dependencies (requires pnpm 10.27+)
pnpm install
```

### Development Servers

```bash
# Run all apps in dev mode (via Turborepo)
pnpm dev

# Run web app only (Next.js)
pnpm --filter web dev
# Web app runs at http://localhost:3000

# Run mobile app (Expo)
pnpm --filter mobile start

# Mobile specific platforms
pnpm --filter mobile ios        # Run iOS simulator
pnpm --filter mobile android    # Run Android emulator
```

### Building

```bash
# Build all apps
pnpm build

# Build web app only (Next.js production build)
pnpm --filter web build

# Build mobile app (EAS or local build)
pnpm --filter mobile build
pnpm --filter mobile build:ios
pnpm --filter mobile build:android
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter web test:watch
pnpm --filter shared test:watch

# Run specific package tests
pnpm --filter web test           # Web tests
pnpm --filter shared test        # Shared package tests
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Supabase Type Generation

```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id <project-id> > packages/shared/src/database.types.ts
```

### Package Management

```bash
# Add dependency to specific package
pnpm add <package> --filter web
pnpm add <package> --filter mobile
pnpm add <package> --filter shared

# Add dev dependency
pnpm add -D <package> --filter web

# Clean and reinstall
pnpm clean
pnpm install
```

## Tech Stack

**Current versions as of January 2026** (see STACK.md for detailed version info and migration notes)

- **Mobile:** Expo SDK 54 (SDK 55 coming Jan 2026), Expo Router 6, React Native 0.83
- **Web:** Next.js 16 (App Router), hosted on Vercel
- **Database:** Supabase Postgres (@supabase/supabase-js 2.89)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (box photos)
- **Monorepo:** pnpm 10.27 workspaces + Turborepo 2.7
- **Validation:** Zod 4 schemas (shared)
- **Styling:** Tailwind CSS v4 (web), NativeWind v4 (mobile)
- **Testing:** Vitest 4, React Testing Library 16
- **TypeScript:** 5.8/5.9

## Project Structure

```
apps/mobile/       → Expo app
apps/web/          → NextJS app (API + dashboard)
packages/shared/   → Types, Zod schemas, constants
packages/ui/       → Shared presentational components
```

## Code Conventions

### General

- TypeScript strict mode everywhere
- Prefer `type` over `interface` unless extending
- Use named exports, not default exports (except pages/layouts)
- Collocate tests with source files (`*.test.ts`)
- Use absolute imports with `@/` prefix within each app

### Naming

- Files: kebab-case (`box-detail.tsx`, `use-boxes.ts`)
- Components: PascalCase (`BoxCard`, `LabelPreview`)
- Hooks: camelCase with `use` prefix (`useBoxes`, `useAuth`)
- Types: PascalCase with descriptive suffixes (`BoxInsert`, `BoxRow`, `BoxWithPhotos`)
- Zod schemas: camelCase with `Schema` suffix (`boxSchema`, `locationSchema`)

### React/React Native

- Functional components only
- Prefer hooks over HOCs
- Extract custom hooks for reusable stateful logic
- Use `memo()` sparingly and only with measured performance need
- Keep components under 150 lines; extract subcomponents if larger

## Shared Package (`packages/shared`)

All database types and validation live here. Both apps import from `@boxtrack/shared`.

```typescript
// schemas.ts - Zod schemas are source of truth
export const boxSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  label: z.string().min(1).max(100),
  status: z.enum(["open", "closed"]),
  location: locationSchema.nullable(),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
});

// types.ts - Derive types from schemas
export type Box = z.infer<typeof boxSchema>;
export type BoxInsert = Omit<Box, "id" | "createdAt">;
```

## Supabase Patterns

### Database

- Use Supabase generated types: `supabase gen types typescript`
- Row Level Security (RLS) enabled on all tables
- All queries scoped by `household_id`
- Use `select()` with explicit columns, not `*`

### Auth

- Auth state managed via `@supabase/auth-helpers-react` (web) and `@supabase/supabase-js` (mobile)
- Protected routes check session server-side on web, client-side on mobile
- Store `household_id` in user metadata or separate `user_households` junction table

### Storage

- Bucket: `box-photos`
- Path structure: `{household_id}/{box_id}/{uuid}.jpg`
- Always generate signed URLs for display, not public URLs
- Compress images client-side before upload (max 1200px width, 80% quality)

## Next.js (apps/web)

**Version:** Next.js 16 with React 19.2 support

### API Routes

- All API routes under `app/api/`
- Use Route Handlers (not Pages API routes)
- Validate request bodies with Zod 4 schemas from shared package
- Return consistent response shape: `{ data, error }`
- Always verify auth and household membership before data access
- Leverage "use cache" directive for cacheable operations

```typescript
// Example: app/api/boxes/route.ts
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

### Pages

- Use Server Components by default (Next.js 16 default)
- Add `'use client'` only when needed (interactivity, hooks)
- Data fetching in Server Components or Route Handlers, not client-side unless for real-time updates
- Leverage React Compiler optimizations (automatic memoization)

## Expo (apps/mobile)

**Version:** Expo SDK 54 (upgrade to SDK 55 when released in Jan 2026)

### Navigation

- File-based routing with Expo Router 6
- Deep link scheme: `boxtrack://`
- QR codes encode: `boxtrack://box/{id}`
- iOS 26 bottom tabs UI available

### Offline Support

- Local SQLite cache via `expo-sqlite` for box metadata
- Queue photo uploads when offline, sync on reconnect
- Show sync status indicator in UI

### Camera & Photos

- Use `expo-image-picker` for camera access
- Compress before upload using `expo-image-manipulator`
- Store local URI until upload confirmed, then replace with remote URL

### Permissions

- Request camera permission lazily (when user taps capture)
- Handle permission denied gracefully with explanation and settings link

## Label Generation

- Target format: Avery 5164 (3⅓" × 4", 6 per sheet)
- QR codes via `react-qr-code` (web) or `react-native-qrcode-svg` (mobile)
- PDF generation via `@react-pdf/renderer` on web
- Support both dark and light label variants
- Category color coding for visual sorting

## Testing

**Versions:** Vitest 4, React Testing Library 16

- Unit tests: Vitest 4 with stable Browser Mode
- Component tests: React Testing Library 16 (requires @testing-library/dom peer dependency)
- Visual regression: Vitest 4 toMatchScreenshot for UI components
- E2E: Playwright (web), Maestro (mobile) - optional/future
- Test Zod 4 schemas with edge cases
- Mock Supabase client in tests
- Use Vitest Browser Mode for testing in real browsers instead of JSDOM when needed

## Git Conventions

- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- Commit messages: conventional commits (`feat: add box creation flow`)
- PR scope: one feature or fix per PR
- Squash merge to main

## Environment Variables

```
# Shared
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server-side only, never expose

# Web only
NEXT_PUBLIC_APP_URL=

# Mobile only (in app.config.ts)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Common Pitfalls to Avoid

- Don't import from `apps/web` in `apps/mobile` or vice versa; use `packages/shared`
- Don't use Supabase service role key client-side
- Don't store photos as base64 in database; use Storage
- Don't forget RLS policies when adding new tables
- Don't use `any` type; if truly unknown, use `unknown` and narrow
