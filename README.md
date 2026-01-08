# BoxTrack

Box inventory management system for tracking storage boxes during moves. Users photograph box contents, assign locations (pallet/row/position), and generate QR-coded labels for easy retrieval.

## Architecture

Monorepo with Expo mobile app and Next.js web app sharing types and components.

```
apps/
  mobile/       → Expo app (React Native, Expo Router)
  web/          → Next.js app (API + dashboard)
packages/
  shared/       → Types, Zod schemas, constants
  ui/           → Shared presentational components
```

## Tech Stack

- **Mobile:** Expo SDK 54, Expo Router 6, React Native 0.83
- **Web:** Next.js 16, React 19.2, Tailwind CSS v4
- **Database:** Supabase (Postgres, Auth, Storage)
- **Monorepo:** pnpm 10.27 + Turborepo 2.7
- **Validation:** Zod 4
- **Testing:** Vitest 4, React Testing Library 16

See [STACK.md](./STACK.md) for detailed version information and [CLAUDE.md](./CLAUDE.md) for development guidelines.

## Prerequisites

- Node.js 20.19.4 or higher
- pnpm 10.27.0 or higher
- Expo CLI (for mobile development)
- Supabase account and project

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

Create environment files for each app:

**apps/web/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/mobile/.env.local:**
```bash
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Run all apps in dev mode
pnpm dev

# Run web app only
pnpm --filter web dev

# Run mobile app
pnpm --filter mobile start

# Run mobile on iOS simulator
pnpm --filter mobile ios

# Run mobile on Android emulator
pnpm --filter mobile android
```

### Building

```bash
# Build all apps
pnpm build

# Build web app only
pnpm --filter web build

# Build mobile app
pnpm --filter mobile build
```

### Testing

```bash
# Run all tests
pnpm test

# Run web tests
pnpm --filter web test

# Run shared package tests
pnpm --filter shared test
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format code
pnpm format
```

## Project Structure

### apps/web (Next.js)
- Next.js 16 with App Router
- Tailwind CSS v4
- Supabase for backend
- API routes under `app/api/`

### apps/mobile (Expo)
- Expo SDK 54 with Expo Router
- NativeWind v4 for styling
- Offline-first with SQLite cache
- Camera integration for box photos

### packages/shared
- Zod 4 schemas (source of truth)
- TypeScript types derived from schemas
- Shared constants and utilities

### packages/ui
- Shared React components
- Used by both web and mobile apps

## Supabase Setup

Generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id <project-id> > packages/shared/src/database.types.ts
```

## Contributing

See [CLAUDE.md](./CLAUDE.md) for code conventions and development guidelines.

### Git Conventions

- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- Commit messages: conventional commits (`feat: add box creation flow`)
- PR scope: one feature or fix per PR

## License

Private project - All rights reserved
