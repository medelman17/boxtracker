import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key
 *
 * WARNING: This client bypasses Row Level Security (RLS)!
 * Only use in trusted server-side code (API routes, server components).
 * NEVER expose this client or the service role key to the client-side.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase environment variables for service role client"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
