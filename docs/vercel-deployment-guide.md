# Vercel Deployment Best Practices for BoxTrack Web App

This guide covers best practices for deploying the BoxTrack Next.js web application to Vercel, specifically tailored to our monorepo architecture with pnpm and Turborepo.

## Table of Contents

1. [Project Configuration](#project-configuration)
2. [Environment Variables](#environment-variables)
3. [Monorepo Setup](#monorepo-setup)
4. [Caching & Performance](#caching--performance)
5. [Supabase Integration](#supabase-integration)
6. [Security Considerations](#security-considerations)
7. [Deployment Checklist](#deployment-checklist)

---

## Project Configuration

### Current Setup

Our web app uses:
- **Next.js 16.1.1** with App Router and Turbopack
- **React 19.2.0**
- **pnpm 10.27.0** workspaces
- **Turborepo 2.7.3** for build orchestration

### Vercel Project Settings

#### Root Directory

For monorepo deployments, set the **Root Directory** to `apps/web` in Vercel project settings. This ensures:
- Only relevant changes trigger rebuilds
- Build commands run in the correct context
- Vercel correctly detects Next.js framework

#### Framework Preset

Vercel auto-detects Next.js—no manual configuration needed.

#### Build & Output Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm turbo build --filter=web` |
| Install Command | `cd ../.. && pnpm install` |
| Output Directory | `.next` (default) |

#### Node.js Version

Set Node.js version to **22.x** in Project Settings → General → Node.js Version. This is recommended for pnpm 10.27 compatibility and optimal performance.

---

## Environment Variables

### Required Variables

Configure these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Type | Environments | Description |
|----------|------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain | All | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sensitive** | Production, Preview | Server-only service role key |
| `NEXT_PUBLIC_APP_URL` | Plain | All | Full app URL (e.g., `https://boxtrack.app`) |

### Best Practices

1. **Use Sensitive Environment Variables** for secrets like `SUPABASE_SERVICE_ROLE_KEY`:
   - Cannot be decrypted once created
   - Only accessible to server-side code
   - Never exposed in client bundles

2. **Use Different Values Per Environment**:
   ```
   Production: NEXT_PUBLIC_APP_URL = https://boxtrack.app
   Preview:    NEXT_PUBLIC_APP_URL = https://preview.boxtrack.app
   ```

3. **Use Vercel CLI for Adding Secrets**:
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # Prompts securely for value
   ```

4. **Pull Environment Variables Locally**:
   ```bash
   vercel env pull .env.local
   ```

### Variables for Preview Deployments

Consider using test/sandbox credentials for preview environments:
- Use Supabase staging project URL
- Use test Stripe keys (if applicable)
- Use separate OAuth app credentials

---

## Monorepo Setup

### vercel.json Configuration

Create `apps/web/vercel.json` for custom commands:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=web"
}
```

### Turborepo Integration

Our existing `turbo.json` is already configured correctly:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    }
  },
  "globalEnv": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL"
  ]
}
```

**Key Points:**
- `"dependsOn": ["^build"]` ensures shared packages build first
- `globalEnv` lists environment variables that affect cache validity
- `.next/cache/**` is excluded from outputs for remote caching efficiency

### Remote Caching (Optional)

Enable Turborepo Remote Caching for faster CI builds:

```bash
# Link to Vercel for remote caching
npx turbo login
npx turbo link
```

Add to `turbo.json`:
```json
{
  "remoteCache": {
    "enabled": true
  }
}
```

---

## Caching & Performance

### Edge Caching

Vercel automatically caches static assets for 31 days. For dynamic routes, configure caching headers:

```typescript
// app/api/boxes/route.ts
export async function GET() {
  const data = await fetchBoxes();

  return Response.json({ data }, {
    headers: {
      // Cache at edge for 60s, serve stale while revalidating for 120s
      'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
    },
  });
}
```

### Cache-Control Priority

Vercel processes headers in this order:
1. `Vercel-CDN-Cache-Control` (Vercel edge only, not forwarded)
2. `CDN-Cache-Control` (all CDN layers)
3. `Cache-Control` (standard, applies to browsers too)

### Recommended Caching Strategy

| Content Type | Strategy | Headers |
|-------------|----------|---------|
| Static Assets | Aggressive | Default (31 days) |
| API Routes (public) | Short-lived | `s-maxage=60, stale-while-revalidate=120` |
| API Routes (user-specific) | No cache | `private, no-cache` |
| Images (Supabase Storage) | Medium | `s-maxage=3600, stale-while-revalidate=86400` |

### ISR (Incremental Static Regeneration)

For pages with semi-static content:

```typescript
// app/boxes/[id]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BoxPage({ params }) {
  const box = await getBox(params.id);
  return <BoxDetail box={box} />;
}
```

### Next.js 16 Cache Components

Next.js 16 introduces explicit opt-in caching. Use the `"use cache"` directive:

```typescript
// This function's result will be cached
async function getCachedBoxCount() {
  "use cache";
  return await supabase.from('boxes').select('*', { count: 'exact', head: true });
}
```

---

## Supabase Integration

### Middleware Configuration

Our middleware at `apps/web/middleware.ts` handles Supabase auth. Ensure it's compatible with Vercel Edge:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Use @supabase/ssr for Edge Runtime compatibility
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          // Handle cookie setting
        },
      },
    }
  );

  await supabase.auth.getUser();
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Supabase Edge Functions

Supabase Edge Functions run on Deno, not Vercel. Two approaches:

1. **Deploy separately** via Supabase CLI:
   ```bash
   supabase functions deploy
   ```

2. **Exclude from tsconfig** to prevent build errors:
   ```json
   {
     "exclude": ["node_modules", "supabase"]
   }
   ```

### Image Optimization

Our `next.config.ts` already allows Supabase images:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
},
```

---

## Security Considerations

### Environment Variable Security

1. **Never expose service role keys** to the client:
   - No `NEXT_PUBLIC_` prefix
   - Only use in Server Components, Route Handlers, or Server Actions

2. **Validate server-side**:
   ```typescript
   if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
     throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
   }
   ```

### Headers Configuration

Add security headers via `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

### Content Security Policy

Consider adding CSP headers for production:

```typescript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' *.supabase.co data:;"
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass locally (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Environment variables documented and ready

### Vercel Project Setup

- [ ] Create new project from GitHub repository
- [ ] Set Root Directory to `apps/web`
- [ ] Configure Build Command: `cd ../.. && pnpm turbo build --filter=web`
- [ ] Configure Install Command: `cd ../.. && pnpm install`
- [ ] Set Node.js version to 22.x
- [ ] Add all environment variables
- [ ] Enable "Sensitive" for `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configure production domain

### Post-Deployment Verification

- [ ] Home page loads correctly
- [ ] Authentication flow works (login/signup)
- [ ] Protected routes redirect properly
- [ ] API routes respond correctly
- [ ] Images load from Supabase Storage
- [ ] Check Core Web Vitals in Vercel Analytics

### Ongoing Maintenance

- [ ] Monitor build times and cache hit ratios
- [ ] Review Vercel Analytics for performance
- [ ] Keep dependencies updated
- [ ] Rotate secrets periodically
- [ ] Review and update RLS policies as needed

---

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Pull environment variables
vercel env pull .env.local

# View deployment logs
vercel logs <deployment-url>

# Rollback to previous deployment
vercel rollback

# Link local project to Vercel
vercel link
```

---

## Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Turborepo on Vercel](https://vercel.com/docs/monorepos/turborepo)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 16 Caching](https://nextjs.org/docs/app/building-your-application/caching)
