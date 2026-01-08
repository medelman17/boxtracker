import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@boxtrack/shared";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Create Supabase client for Server Components and Route Handlers
 * Uses cookies for session management (SSR-compatible)
 *
 * This client respects RLS and operates as the authenticated user.
 * For admin operations that bypass RLS, use createServiceRoleClient instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component - ignore for read-only operations
            // Route Handlers can set cookies, Server Components cannot
          }
        },
      },
    }
  );
}
