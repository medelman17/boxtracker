# Security Guidelines for BoxTrack

## ⚠️ IMPORTANT SECURITY NOTICE

**Your Supabase credentials have been exposed in this conversation and should be rotated immediately if this is a production project.**

### Exposed Credentials
- Anon/Publishable Key: `sb_publishable_pHWxWQObksil0opFY4tulw_lnyNBVs1`
- Service Role Key: `sb_secret_gqsz9Wlv4P5ybnVhWqS3OQ_vcapQYjL`

### How to Rotate Keys

1. Go to your Supabase Dashboard: https://app.supabase.com/project/pocilpskaipllqhmznah/settings/api
2. Click "Reset" next to the keys you want to rotate
3. Update your `.env.local` files with the new keys
4. Restart your development servers

---

## Environment Variables Security

### ✅ Safe for Client-Side (NEXT_PUBLIC_ / EXPO_PUBLIC_)
- `NEXT_PUBLIC_SUPABASE_URL` - Public project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/publishable key (safe if RLS is enabled)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 🔒 Server-Side ONLY (Never expose to client)
- `SUPABASE_SERVICE_ROLE_KEY` - **CRITICAL**: Bypasses all RLS policies!

### Key Usage Guidelines

**Anon Key:**
- ✅ Safe to use in browser/mobile apps
- ✅ Respects Row Level Security (RLS) policies
- ✅ User can only access data allowed by RLS policies

**Service Role Key:**
- ❌ NEVER use in browser/mobile code
- ❌ NEVER commit to version control
- ❌ NEVER expose via API responses
- ✅ ONLY use in trusted server-side code (Next.js API routes)
- ⚠️  Bypasses ALL Row Level Security policies

---

## Row Level Security (RLS)

### Why RLS is Critical

Without RLS policies, the anon key can read/write ANY data in your database. Always enable RLS on all tables.

### Enable RLS on All Tables

```sql
-- Enable RLS on a table
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies

```sql
-- Users can only see boxes in their household
CREATE POLICY "Users can view their household's boxes"
ON boxes
FOR SELECT
USING (
  household_id IN (
    SELECT household_id
    FROM user_households
    WHERE user_id = auth.uid()
  )
);

-- Users can only insert boxes for their household
CREATE POLICY "Users can create boxes in their household"
ON boxes
FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id
    FROM user_households
    WHERE user_id = auth.uid()
  )
);

-- Users can only update their household's boxes
CREATE POLICY "Users can update their household's boxes"
ON boxes
FOR UPDATE
USING (
  household_id IN (
    SELECT household_id
    FROM user_households
    WHERE user_id = auth.uid()
  )
);

-- Users can only delete their household's boxes
CREATE POLICY "Users can delete their household's boxes"
ON boxes
FOR DELETE
USING (
  household_id IN (
    SELECT household_id
    FROM user_households
    WHERE user_id = auth.uid()
  )
);
```

---

## Storage Security

### Bucket Policies

Configure Supabase Storage bucket policies to restrict access:

```sql
-- Allow authenticated users to upload to their household folder
CREATE POLICY "Users can upload to their household folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'box-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT household_id::text
    FROM user_households
    WHERE user_id = auth.uid()
  )
);

-- Allow users to view their household's photos
CREATE POLICY "Users can view their household photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'box-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT household_id::text
    FROM user_households
    WHERE user_id = auth.uid()
  )
);
```

---

## Code Security Best Practices

### 1. Never Use Service Role Key Client-Side

**❌ WRONG:**
```typescript
// client-side component
import { createServiceRoleClient } from '@/lib/supabase-server';
const supabase = createServiceRoleClient(); // NEVER DO THIS!
```

**✅ CORRECT:**
```typescript
// API route (server-side)
import { createServiceRoleClient } from '@/lib/supabase-server';
export async function POST(request: Request) {
  const supabase = createServiceRoleClient(); // OK - server-side only
  // ...
}
```

### 2. Always Verify Authentication

```typescript
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Proceed with authenticated user
}
```

### 3. Validate User Access to Resources

```typescript
// Before allowing access to a box, verify user owns it
const { data: box } = await supabase
  .from('boxes')
  .select('household_id')
  .eq('id', boxId)
  .single();

const { data: membership } = await supabase
  .from('user_households')
  .select('household_id')
  .eq('user_id', session.user.id)
  .eq('household_id', box.household_id)
  .single();

if (!membership) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

### 4. Sanitize User Input

Always validate and sanitize user input using Zod schemas:

```typescript
import { boxInsertSchema } from '@boxtrack/shared';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate with Zod
  const result = boxInsertSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: "Validation failed",
      details: result.error
    }, { status: 400 });
  }

  // Use validated data
  const validatedBox = result.data;
}
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Rotate all Supabase keys
- [ ] Enable RLS on ALL database tables
- [ ] Test RLS policies thoroughly
- [ ] Configure Storage bucket policies
- [ ] Set up proper authentication flows
- [ ] Never commit `.env.local` files
- [ ] Use environment variables in CI/CD (Vercel, etc.)
- [ ] Enable Supabase database backups
- [ ] Set up monitoring and alerts
- [ ] Review and test all API endpoints for proper authorization
- [ ] Implement rate limiting on API routes
- [ ] Enable HTTPS only in production

---

## Vercel Deployment

When deploying to Vercel:

1. Add environment variables in Vercel dashboard
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
3. Use Vercel's environment variable encryption
4. Never expose service role key in client-side bundles

---

## Monitoring

- Enable Supabase logs and monitoring
- Set up alerts for failed authentication attempts
- Monitor unusual data access patterns
- Regularly audit RLS policies

---

## Questions?

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
