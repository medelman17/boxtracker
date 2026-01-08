# QR Code Implementation Research
## Task-6: Implement QR Code Generation for Boxes

**Date:** 2026-01-08
**Status:** Research Complete - Awaiting Implementation Decisions
**Priority:** High

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Library Research & Recommendations](#library-research--recommendations)
3. [Deep Linking Strategy](#deep-linking-strategy)
4. [Error Correction & Scanability](#error-correction--scanability)
5. [Generation Strategy: Static vs Dynamic](#generation-strategy-static-vs-dynamic)
6. [Design Considerations](#design-considerations)
7. [Implementation Paths](#implementation-paths)
8. [Storage vs On-Demand Generation](#storage-vs-on-demand-generation)
9. [Decision Matrix](#decision-matrix)
10. [Open Questions](#open-questions)
11. [References](#references)

---

## Current State Analysis

### ✅ What's Already Done

**Database Schema:**
- `boxes.qr_code VARCHAR(255) UNIQUE` column exists
- Indexed with `idx_boxes_qr_code` (filtered for non-deleted)
- Auto-generation trigger: `generate_box_qr_code`
- Trigger function: `generate_qr_code()` creates `boxtrack://box/{id}` on INSERT

**Shared Package:**
- Zod schema includes `qrCode: z.string().nullable()`
- TypeScript types generated from Supabase
- Deep link scheme documented in CLAUDE.md: `boxtrack://`

**Architecture:**
- Monorepo setup with `packages/ui` for shared components
- Next.js 16 (web) + Expo SDK 54 (mobile)
- Tailwind v4 (web) + NativeWind v4 (mobile)

### ❌ What's Missing

**Frontend Components:**
- QR code visualization component (web)
- QR code visualization component (mobile)
- Box detail page integration
- Label preview functionality

**Deep Linking:**
- Expo Router deep link configuration
- Universal Links setup (iOS/Android)
- Deep link testing infrastructure

**Design System:**
- Dark/light mode QR variants
- Category color integration
- QR code styling guidelines

**Print/Export:**
- Label generation with QR codes (Avery 5164 format - task-7)
- QR code export as image
- Bulk QR generation

---

## Library Research & Recommendations

### Web (Next.js) Libraries

#### Option 1: `@lglab/react-qr-code` ⭐ RECOMMENDED

**Metrics:**
- Benchmark Score: **90.9** (highest)
- Code Snippets: 5
- Source Reputation: High

**Pros:**
- Extensive customization: 12+ module styles (`square`, `rounded`, `circle`, `diamond`, `heart`, `leaf`, etc.)
- Gradient support (linear & radial)
- Embedded logos/images with excavation
- Error correction levels: L, M, Q, H
- Export formats: SVG, PNG, JPEG
- Imperative API via refs (`download()` method)
- Fine-grained control: data modules, finder patterns, background

**Cons:**
- Newer library (less community adoption than zpao/qrcode.react)
- Larger bundle size due to features

**Best For:** Production-grade labels with branding, category colors, and advanced styling

**Example:**
```tsx
import { ReactQRCode } from '@lglab/react-qr-code';

<ReactQRCode
  value="boxtrack://box/550e8400-e29b-41d4-a716-446655440000"
  size={256}
  level="M" // 15% error correction
  dataModulesSettings={{
    style: 'rounded',
    color: '#2563eb' // Category color
  }}
  finderPatternOuterSettings={{
    style: 'rounded-lg'
  }}
  imageSettings={{
    src: '/logo.png',
    width: 40,
    height: 40,
    excavate: true
  }}
/>
```

#### Option 2: `reactqrcode.com` library

**Metrics:**
- Benchmark Score: **80.4**
- Code Snippets: 41
- Source Reputation: High

**Pros:**
- Highly documented (41 code snippets)
- Performance-optimized
- Active development

**Cons:**
- Feature parity with lglab unclear
- Less detailed API documentation in search results

**Best For:** Standard use cases with good documentation

#### Option 3: `qrcode.react` (zpao)

**Metrics:**
- Code Snippets: 4
- Source Reputation: High
- Most established (original React QR library)

**Pros:**
- Battle-tested, widely adopted
- Simple, stable API
- Smaller bundle size

**Cons:**
- Limited customization options
- Older API design
- No gradient/logo support

**Best For:** Simple, reliable QR codes without advanced styling

---

### Mobile (React Native/Expo) Libraries

#### Option 1: `react-native-qrcode-svg` ⭐ RECOMMENDED

**Maintainer:** Expensify
**Base:** `react-native-svg` + `javascript-qrcode`
**Compatibility:** React Native 0.75+ (Expo SDK 54+)

**Pros:**
- Logo support (base64 & local files)
- `getRef()` API for programmatic access
- `toDataURL()` export to base64
- Backdrop support for logos
- Experimental: Save to device gallery
- Well-maintained by major company (Expensify)

**Cons:**
- Less customization than web libraries (no module styles)
- Basic color options only
- Requires `react-native-svg` peer dependency

**Best For:** Standard mobile QR codes with logo support

**Example:**
```tsx
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value="boxtrack://box/550e8400-e29b-41d4-a716-446655440000"
  size={256}
  color="#000000" // QR code color
  backgroundColor="#FFFFFF"
  logo={require('./assets/logo.png')}
  logoSize={40}
  logoBackgroundColor="transparent"
  getRef={(ref) => setQrRef(ref)}
/>
```

**Resources:**
- [NPM Package](https://www.npmjs.com/package/react-native-qrcode-svg)
- [GitHub Repository](https://github.com/Expensify/react-native-qrcode-svg)
- Example App included in `./Example` directory

#### Option 2: Share Web Library via WebView

**Approach:** Render web QR component in React Native WebView

**Pros:**
- Perfect visual consistency between web and mobile
- Access to full web library features (gradients, styles, etc.)
- Single source of truth for rendering

**Cons:**
- Performance overhead (WebView initialization)
- Additional complexity (WebView bridge)
- Accessibility challenges
- Offline considerations

**Best For:** When visual consistency is critical and performance is acceptable

---

## Deep Linking Strategy

### Current Approach: Custom URL Scheme

**Format:** `boxtrack://box/{id}`

**Pros:**
- ✅ Simple implementation
- ✅ Works internally within app
- ✅ No domain required
- ✅ Already configured in database trigger

**Cons:**
- ❌ No fallback to web if app not installed
- ❌ Interstitial confirmation dialogs on some platforms
- ❌ Less professional user experience
- ❌ Cannot be opened in browser

**Technical Details:**
- Trigger function: `generate_qr_code()` at `/supabase/migrations/001_initial_schema_v2.sql:394-402`
- Creates QR on INSERT: `NEW.qr_code = 'boxtrack://box/' || NEW.id::text;`

---

### Recommended Upgrade: Universal Links

**Format:** `https://boxtrack.app/box/{id}` (requires production domain)

**How It Works:**
1. User scans QR code → opens `https://boxtrack.app/box/{id}`
2. iOS/Android check for associated app via AASA/assetlinks.json
3. If app installed → opens directly in app (no browser flash)
4. If app not installed → opens in browser with "Get the App" prompt

**Setup Requirements:**

#### iOS: Apple App Site Association (AASA)
**File Location:** `https://boxtrack.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.boxtrack.app",
        "paths": ["/box/*"]
      }
    ]
  }
}
```

**Xcode Configuration:**
- Add Associated Domain: `applinks:boxtrack.app`
- Under Signing & Capabilities tab

#### Android: Digital Asset Links
**File Location:** `https://boxtrack.app/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.boxtrack.app",
    "sha256_cert_fingerprints": ["YOUR_CERT_FINGERPRINT"]
  }
}]
```

**AndroidManifest.xml:**
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="boxtrack.app" android:pathPrefix="/box/" />
</intent-filter>
```

#### Expo Router Configuration
**File:** `apps/mobile/app/_layout.tsx`

```tsx
export default function RootLayout() {
  const linking = {
    prefixes: ['boxtrack://', 'https://boxtrack.app'],
    config: {
      screens: {
        'box/[id]': 'box/:id',
      },
    },
  };

  return <NavigationContainer linking={linking}>...</NavigationContainer>;
}
```

**Pros:**
- ✅ Seamless app opening (no interstitials)
- ✅ Web fallback for non-users
- ✅ Professional user experience
- ✅ Works with standard QR scanners
- ✅ Analytics-friendly (can track web visits)

**Cons:**
- ❌ Requires production domain
- ❌ More complex setup (AASA, assetlinks.json)
- ❌ Needs web app to handle `/box/{id}` route
- ❌ HTTPS certificate required

**Best Practices (2026):**
- Never pass sensitive data in URLs (use short-lived tokens if needed)
- Test thoroughly on both iOS and Android
- Monitor for broken links (AASA/assetlinks.json validation)
- Provide clear "Open in App" prompts on web fallback

**References:**
- [Universal Links 2026 Complete Guide](https://prototyp.digital/blog/universal-links-deep-linking-2026)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Expo Linking Documentation](https://docs.expo.dev/linking/into-your-app/)

---

## Error Correction & Scanability

### Four Error Correction Levels

QR codes use Reed-Solomon error correction to recover damaged data.

| Level | Recovery Rate | Use Cases | Density |
|-------|--------------|-----------|---------|
| **L** | 7% | Clean environments, large data payloads | Lowest |
| **M** | 15% | **Standard/Recommended** - Most marketing materials | Medium |
| **Q** | 25% | Outdoor environments, potential wear/damage | High |
| **H** | 30% | Logos, harsh environments, maximum protection | Highest |

### Best Practices by Use Case

**For BoxTrack Printed Labels:**
- **Level M (15%)** recommended for standard label printing
- Clean indoor environment (storage boxes)
- High-quality printer expected (laser/inkjet)
- Adequate for most use cases

**Upgrade to Level Q (25%) if:**
- Labels may get dirty (garage, outdoor storage)
- Long-term durability required (years in storage)
- Lower quality printers used

**Upgrade to Level H (30%) if:**
- Adding BoxTrack logo to QR center
- Category color integration reduces contrast
- Industrial/warehouse environment
- Maximum protection needed

### Trade-offs

**Higher error correction:**
- ✅ More robust to damage, dirt, wear
- ✅ Supports logo embedding (excavates center)
- ✅ Better for low-quality printing
- ❌ Denser QR pattern (smaller modules)
- ❌ Requires larger physical size for scanability
- ❌ Longer scan time (more data to decode)

**Recommended Configuration:**
```tsx
// Standard labels
level: 'M' // 15% error correction

// Labels with logos or category colors
level: 'H' // 30% error correction
```

### Scanability Guidelines

**Minimum Size:**
- **Without logo:** 0.8 inches × 0.8 inches (2cm × 2cm)
- **With logo:** 1.2 inches × 1.2 inches (3cm × 3cm)
- **Avery 5164 label:** 3.33" × 4" (plenty of space for 2" QR)

**Contrast Requirements:**
- Minimum 50% contrast ratio
- Dark on light preferred (standard)
- Light on dark works but less common (dark mode)

**Quiet Zone:**
- Minimum 4 modules of white space around QR
- Libraries handle this automatically

**References:**
- [QR Code Error Correction Guide](https://scanova.io/blog/qr-code-error-correction/)
- [Error Correction Analyzer Tool](https://qr8r.org/tools/error-correction-analyzer)

---

## Generation Strategy: Static vs Dynamic

### Static QR Codes (Current Approach) ⭐ RECOMMENDED

**Definition:** QR code contains final destination URL directly

**BoxTrack Implementation:**
- Database stores: `boxtrack://box/550e8400-e29b-41d4-a716-446655440000`
- QR encodes this URL exactly
- No intermediate redirect

**Pros:**
- ✅ No server dependency - works offline forever
- ✅ Perfect for fixed box IDs (never change)
- ✅ Simpler architecture
- ✅ Lower latency (no redirect hop)
- ✅ Privacy-friendly (no tracking)
- ✅ No subscription/platform lock-in

**Cons:**
- ❌ No scan analytics (location, device, time)
- ❌ Cannot update destination without reprinting
- ❌ No A/B testing capabilities
- ❌ No geo-targeting or conditional redirects

**Best For:**
- ✅ Offline-first applications
- ✅ Permanent, unchanging links
- ✅ User-owned content (boxes)
- ✅ No tracking requirements

---

### Dynamic QR Codes (Alternative)

**Definition:** QR code contains short redirect URL that resolves server-side

**Example Implementation:**
- QR encodes: `https://boxtrack.app/r/a7f9k2` (short code)
- Server redirects: `a7f9k2` → `boxtrack://box/550e8400-...`
- Requires database table: `qr_redirects(short_code, box_id, created_at, scan_count)`

**Pros:**
- ✅ Scan analytics (time, location, device type)
- ✅ Update destination without reprinting
- ✅ A/B testing different app screens
- ✅ Geo-targeted experiences
- ✅ Deactivation capability (if box deleted)

**Cons:**
- ❌ Server dependency (fails if offline)
- ❌ Slower (redirect hop adds latency)
- ❌ Platform lock-in (depends on BoxTrack servers)
- ❌ Privacy concerns (tracking users)
- ❌ Additional infrastructure (redirect service)

**Best For:**
- ✅ Marketing campaigns
- ✅ Analytics-driven products
- ✅ Content that changes frequently
- ✅ Multi-tenant platforms

---

### Recommendation for BoxTrack

**Use Static QR Codes** because:

1. **Box IDs are permanent** - UUIDs never change
2. **Offline-first design** - Mobile app should work without internet
3. **User-owned content** - Users scan their own boxes (no analytics needed)
4. **Simplicity** - No redirect service infrastructure required
5. **Privacy** - No tracking of user scans
6. **Reliability** - QR codes work forever, even if BoxTrack servers go down

**Exception:** Consider dynamic QR for marketing materials (e.g., "Try BoxTrack" posters), but not for box labels.

**References:**
- [Static vs Dynamic QR Codes 2026](https://scanova.io/blog/static-vs-dynamic-qr-codes/)
- [System Design: QR Code Generation](https://medium.com/@krutilin.sergey.ks/system-design-qr-code-generation-37c4262bbc55)

---

## Design Considerations

### Category Color Integration

**Database Schema:**
- `categories.color VARCHAR(7)` - hex color (e.g., `#2563eb`)
- Each box has optional `category_id`

**Integration Options:**

#### Option A: Colored Background
```tsx
<div style={{ backgroundColor: categoryColor, padding: '16px' }}>
  <ReactQRCode value={url} backgroundColor="white" />
</div>
```
**Pros:** High contrast, scannable, clear visual hierarchy
**Cons:** Uses more ink, larger label footprint

#### Option B: Colored QR Modules
```tsx
<ReactQRCode
  value={url}
  dataModulesSettings={{ color: categoryColor }}
  backgroundColor="white"
/>
```
**Pros:** Compact, modern aesthetic
**Cons:** Low contrast if color is light, less scannable

#### Option C: Colored Border/Frame
```tsx
<div style={{ border: `4px solid ${categoryColor}`, padding: '8px' }}>
  <ReactQRCode value={url} />
</div>
```
**Pros:** Best of both worlds, high scanability
**Cons:** Slightly more complex layout

#### Option D: No Color Integration
```tsx
<ReactQRCode value={url} />
```
**Pros:** Maximum scanability, ink-efficient
**Cons:** Misses branding opportunity

**Recommendation:** **Option C (Colored Border)** for best balance of aesthetics and scanability.

---

### Dark/Light Mode Variants

#### Light Mode (Standard)
```tsx
<ReactQRCode
  value={url}
  dataModulesSettings={{ color: '#000000' }} // Black modules
  backgroundColor="#FFFFFF" // White background
/>
```
**Best For:** Printing on white labels, web light mode

#### Dark Mode (Inverted)
```tsx
<ReactQRCode
  value={url}
  dataModulesSettings={{ color: '#FFFFFF' }} // White modules
  backgroundColor="#1F2937" // Dark background
/>
```
**Best For:** Dark mode UI, OLED screens, premium aesthetic

**Implementation:**
```tsx
const isDark = useColorScheme() === 'dark';

<ReactQRCode
  value={url}
  dataModulesSettings={{
    color: isDark ? '#FFFFFF' : '#000000'
  }}
  backgroundColor={isDark ? '#1F2937' : '#FFFFFF'}
/>
```

**Note:** For printing, always use light mode (dark on white) for maximum contrast and ink efficiency.

---

### Module Styles (@lglab/react-qr-code)

**Available Styles:**
- `square` - Standard, highest scanability
- `rounded` - Softer, modern look
- `circle` - Distinctive aesthetic
- `diamond`, `heart`, `star` - Decorative (lower scanability)
- `leaf` - Organic feel
- `pinched-square` - Subtle variation

**Recommendation:**
- **Production:** `square` (maximum scanability)
- **Premium:** `rounded` (modern + scannable)
- **Decorative:** Avoid for functional labels

```tsx
<ReactQRCode
  value={url}
  dataModulesSettings={{ style: 'rounded' }}
/>
```

---

### Logo Embedding

**BoxTrack Logo in QR Center:**
```tsx
<ReactQRCode
  value={url}
  level="H" // 30% error correction required
  imageSettings={{
    src: '/logo.png',
    width: 40,
    height: 40,
    excavate: true // Removes modules behind logo
  }}
/>
```

**Guidelines:**
- Logo should be ≤20% of QR size
- Use `excavate: true` to remove obscured modules
- Requires error correction Level H
- Reduces scanability slightly
- Best for premium/branded labels

**Alternative:** Place logo outside QR code for maximum scanability

---

## Implementation Paths

### Path A: Shared Component with Platform Detection ⭐ RECOMMENDED

**Structure:**
```
packages/ui/src/qr-code.tsx (unified API)
  ├── Uses @lglab/react-qr-code (web)
  └── Uses react-native-qrcode-svg (mobile)
```

**Implementation:**
```tsx
// packages/ui/src/qr-code.tsx
import { Platform } from 'react-native';
import { ReactQRCode } from '@lglab/react-qr-code';
import NativeQRCode from 'react-native-qrcode-svg';

export interface QRCodeProps {
  value: string;
  size?: number;
  colorScheme?: 'light' | 'dark';
  categoryColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  logo?: string;
  moduleStyle?: 'square' | 'rounded' | 'circle';
}

export function BoxQRCode({
  value,
  size = 256,
  colorScheme = 'light',
  categoryColor,
  errorCorrectionLevel = 'M',
  logo,
  moduleStyle = 'square',
}: QRCodeProps) {
  const isDark = colorScheme === 'dark';

  if (Platform.OS === 'web') {
    return (
      <ReactQRCode
        value={value}
        size={size}
        level={errorCorrectionLevel}
        dataModulesSettings={{
          color: isDark ? '#FFFFFF' : '#000000',
          style: moduleStyle,
        }}
        backgroundColor={isDark ? '#1F2937' : '#FFFFFF'}
        imageSettings={logo ? {
          src: logo,
          width: size * 0.2,
          height: size * 0.2,
          excavate: true,
        } : undefined}
      />
    );
  }

  // React Native
  return (
    <NativeQRCode
      value={value}
      size={size}
      color={isDark ? '#FFFFFF' : '#000000'}
      backgroundColor={isDark ? '#1F2937' : '#FFFFFF'}
      logo={logo ? { uri: logo } : undefined}
      logoSize={size * 0.2}
    />
  );
}
```

**Pros:**
- ✅ Single API across platforms
- ✅ Shared props interface
- ✅ Maintainable (one source of truth)
- ✅ Type-safe with TypeScript

**Cons:**
- ❌ Platform detection adds complexity
- ❌ Limited to common feature subset
- ❌ Web features (gradients) not available on mobile

---

### Path B: Separate Components

**Structure:**
```
packages/ui/src/qr-code.web.tsx    (Next.js)
packages/ui/src/qr-code.native.tsx (React Native)
packages/ui/src/qr-code.types.ts   (shared types)
```

**Implementation:**
```tsx
// packages/ui/src/qr-code.web.tsx
import { ReactQRCode } from '@lglab/react-qr-code';
import type { QRCodeProps } from './qr-code.types';

export function BoxQRCode(props: QRCodeProps) {
  // Web-specific implementation with full @lglab features
}

// packages/ui/src/qr-code.native.tsx
import NativeQRCode from 'react-native-qrcode-svg';
import type { QRCodeProps } from './qr-code.types';

export function BoxQRCode(props: QRCodeProps) {
  // Mobile-specific implementation
}
```

**Metro/Next.js Resolution:**
- Automatically picks `.web.tsx` for Next.js
- Automatically picks `.native.tsx` for React Native

**Pros:**
- ✅ Clear platform separation
- ✅ Platform-specific optimizations
- ✅ No runtime platform detection
- ✅ Full access to platform features

**Cons:**
- ❌ API drift risk (must keep in sync manually)
- ❌ Duplicate code patterns
- ❌ More files to maintain

---

### Path C: Server-Side Generation (API Route)

**Approach:** Generate QR codes on Next.js API, serve as images

**API Route:**
```tsx
// apps/web/app/api/qr/route.ts
import { NextRequest } from 'next/server';
import QRCode from 'qrcode'; // node-qrcode

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const boxId = searchParams.get('boxId');
  const color = searchParams.get('color') || '#000000';

  const url = `boxtrack://box/${boxId}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'M',
    color: { dark: color, light: '#FFFFFF' },
    width: 256,
  });

  return new Response(qrBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

**Usage:**
```tsx
// Web or Mobile
<Image
  src={`https://boxtrack.app/api/qr?boxId=${box.id}&color=${category.color}`}
  width={256}
  height={256}
  alt="Box QR Code"
/>
```

**Pros:**
- ✅ Consistent rendering across platforms
- ✅ Cacheable (CDN-friendly)
- ✅ No client-side dependencies
- ✅ Simple client implementation

**Cons:**
- ❌ Network dependency (requires internet)
- ❌ Latency (API call required)
- ❌ Server load (CPU for generation)
- ❌ Extra API endpoint to maintain

**Best For:** Print/export features where consistency > performance

---

## Storage vs On-Demand Generation

### Option 1: Generate On-Demand (Client-Side) ⭐ RECOMMENDED

**Approach:** Render QR codes when viewing box details

**Implementation:**
```tsx
// Box detail page
import { BoxQRCode } from '@/components/qr-code';

<BoxQRCode
  value={box.qr_code} // boxtrack://box/{id}
  size={200}
  categoryColor={box.category?.color}
/>
```

**Pros:**
- ✅ No storage cost (QR generated on demand)
- ✅ Always up-to-date with URL scheme changes
- ✅ Smaller database (only stores URL, not image)
- ✅ Flexible (can change size, color dynamically)
- ✅ Fast enough (~5-10ms generation time)

**Cons:**
- ❌ CPU cost on render (negligible on modern devices)
- ❌ Cannot cache between sessions (regenerates each time)

**Performance:**
- QR generation: 5-10ms (imperceptible)
- SVG rendering: instant
- Total overhead: <15ms

**Recommendation:** **Use this approach** - performance cost is negligible compared to storage overhead.

---

### Option 2: Pre-Generate and Store as Base64

**Approach:** Generate QR as base64, store in database

**Schema Changes:**
```sql
ALTER TABLE boxes ADD COLUMN qr_code_image TEXT;

CREATE OR REPLACE FUNCTION generate_qr_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate QR as base64 (requires pg extension or external service)
  NEW.qr_code_image := generate_base64_qr(NEW.qr_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
```tsx
<Image src={box.qr_code_image} width={200} height={200} />
```

**Pros:**
- ✅ Faster render (no generation CPU)
- ✅ Can cache between sessions

**Cons:**
- ❌ Database bloat (~5-10KB per box)
- ❌ Stale if URL scheme changes (requires migration)
- ❌ Inflexible (fixed size, color)
- ❌ Requires pg extension or external service
- ❌ More complex migrations

**Not Recommended:** Storage cost outweighs minimal performance gain.

---

### Option 3: Store in Supabase Storage

**Approach:** Generate QR as PNG/SVG, upload to Storage bucket

**Schema:**
```sql
ALTER TABLE boxes ADD COLUMN qr_code_storage_path TEXT;
-- Example: qr-codes/550e8400-e29b-41d4-a716-446655440000.png
```

**Generation (Server-Side):**
```tsx
// On box creation
const qrBuffer = await QRCode.toBuffer(box.qr_code);
const path = `qr-codes/${box.id}.png`;

await supabase.storage
  .from('box-qr-codes')
  .upload(path, qrBuffer, { contentType: 'image/png' });

await supabase
  .from('boxes')
  .update({ qr_code_storage_path: path })
  .eq('id', box.id);
```

**Usage:**
```tsx
const { data } = await supabase.storage
  .from('box-qr-codes')
  .getPublicUrl(box.qr_code_storage_path);

<Image src={data.publicUrl} />
```

**Pros:**
- ✅ Offload database (smaller row size)
- ✅ CDN caching (Supabase serves via CDN)
- ✅ Faster than database TEXT column

**Cons:**
- ❌ Storage costs ($0.021/GB/month)
- ❌ Additional complexity (upload/download)
- ❌ Stale if URL scheme changes
- ❌ Requires RLS policies on storage bucket

**Best For:** High-traffic apps with thousands of concurrent users. **Not needed for BoxTrack.**

---

## Decision Matrix

### Quick Reference Table

| Aspect | Recommended Choice | Alternative | Rationale |
|--------|-------------------|-------------|-----------|
| **Web Library** | `@lglab/react-qr-code` | `qrcode.react` | Best customization, future-proof |
| **Mobile Library** | `react-native-qrcode-svg` | WebView approach | Native performance, Expo-compatible |
| **URL Scheme** | `boxtrack://box/{id}` (short-term) | Universal Links (long-term) | Start simple, upgrade later |
| **Error Correction** | Level M (15%) | Level H (30%) if logos | Balance of robustness and size |
| **QR Strategy** | Static QR codes | Dynamic QR | Offline-first, no tracking needed |
| **Generation** | On-demand client-side | Server API | No storage overhead, flexible |
| **Component Structure** | Path A (Shared component) | Path B (Separate files) | Single API, maintainable |
| **Category Colors** | Colored border (Option C) | Colored background | Scanability + aesthetics |
| **Module Style** | `rounded` | `square` | Modern look, still scannable |
| **Dark Mode** | Support via `colorScheme` prop | Light only | Better UX, minimal effort |

---

## Open Questions

### 1. Deep Linking Strategy
**Question:** Should we stick with `boxtrack://box/{id}` (custom scheme) or upgrade to Universal Links (`https://boxtrack.app/box/{id}`)?

**Options:**
- **A)** Keep `boxtrack://` (simpler, works now)
- **B)** Migrate to Universal Links (better UX, requires domain)
- **C)** Support both (fallback pattern)

**Context:** Universal Links require production domain and AASA/assetlinks.json setup.

---

### 2. Category Color Integration
**Question:** How should category colors appear on QR codes?

**Options:**
- **A)** Colored background behind QR code
- **B)** Colored QR modules (less scannable)
- **C)** Colored border/frame around QR (recommended)
- **D)** No color integration (just dark/light mode)

**Visual Mock-ups Needed:** Yes

---

### 3. Library Preference
**Question:** Confirm library selections

**Web:**
- **A)** `@lglab/react-qr-code` (most features, highest score)
- **B)** `qrcode.react` (simpler, established)

**Mobile:**
- **A)** `react-native-qrcode-svg` (standard choice)
- **B)** Share web library via WebView (perfect consistency)

---

### 4. QR Code Features Priority
**Question:** Rank these features by implementation priority (1=highest):

- [ ] Basic QR code display in box detail view
- [ ] Dark/light mode support
- [ ] Category color theming
- [ ] Logo embedding (BoxTrack logo in center)
- [ ] Export/download QR as image
- [ ] Print-ready label generation (Avery 5164 - task-7)

---

### 5. Error Correction Level
**Question:** Confirm error correction level

**Options:**
- **A)** Level M (15%) for standard labels (recommended)
- **B)** Level H (30%) if adding logos/heavy branding
- **C)** Make it configurable (user preference)

---

### 6. Where Should QR Codes Appear?
**Question:** Which views should display QR codes?

**Options:**
- [ ] Box detail page (view mode)
- [ ] Box edit form (preview while editing)
- [ ] Label printing view (dedicated print page)
- [ ] Bulk export (generate multiple QR codes at once)
- [ ] All of the above

---

### 7. Do You Have a Production Domain?
**Question:** Is there a domain for Universal Links?

**Options:**
- **A)** Yes, we own `boxtrack.app` (or similar)
- **B)** No, using custom scheme only
- **C)** Will acquire domain later (start with custom scheme)

**Impact:** Required for Universal Links setup.

---

## References

### Documentation
- [react-native-qrcode-svg NPM](https://www.npmjs.com/package/react-native-qrcode-svg)
- [react-native-qrcode-svg GitHub](https://github.com/Expensify/react-native-qrcode-svg)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Expo Linking Documentation](https://docs.expo.dev/linking/into-your-app/)

### Best Practices & Guides
- [Universal Links 2026 Complete Guide](https://prototyp.digital/blog/universal-links-deep-linking-2026)
- [QR Code Error Correction Guide](https://scanova.io/blog/qr-code-error-correction/)
- [Static vs Dynamic QR Codes 2026](https://scanova.io/blog/static-vs-dynamic-qr-codes/)
- [System Design: QR Code Generation](https://medium.com/@krutilin.sergey.ks/system-design-qr-code-generation-37c4262bbc55)

### Tools
- [Error Correction Analyzer](https://qr8r.org/tools/error-correction-analyzer)
- [QRCode.react Demo](https://zpao.github.io/qrcode.react/)

---

## Next Steps

1. **Answer Open Questions** (interview with user)
2. **Create Implementation Plan** based on decisions
3. **Set up dev dependencies** (`@lglab/react-qr-code`, `react-native-qrcode-svg`)
4. **Build shared QR component** (`packages/ui/src/qr-code.tsx`)
5. **Integrate into box detail view** (web + mobile)
6. **Add category color styling**
7. **Implement dark mode support**
8. **Test scanability** with real devices
9. **Document usage examples** for other developers

---

**Research Completed:** 2026-01-08
**Ready for Implementation:** Pending user decisions on open questions
