import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Normalize environment variables with support for standard Vercel and Supabase naming
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://qxyanvmriugmmbjygcmr.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

let cachedPublicClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Standard Supabase client using Anon/Publishable key.
 * Used for public read queries (e.g. public verification lookup) where RLS is enforced.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Client] Missing Supabase URL or Anon key in environment variables.");
    return null;
  }

  if (!cachedPublicClient) {
    cachedPublicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedPublicClient;
}

/**
 * Privileged Supabase Admin client for server-side operations (App Router API routes / server actions).
 * Uses SUPABASE_SERVICE_ROLE_KEY to safely bypass RLS on private buckets and protected tables.
 * If SUPABASE_SERVICE_ROLE_KEY is not configured, it gracefully falls back to the Anon key and logs a warning.
 *
 * IMPORTANT: NEVER import or call this function in client components.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const activeKey = supabaseServiceRoleKey || supabaseAnonKey;

  if (!supabaseUrl || !activeKey) {
    console.error("[Supabase Admin] Missing Supabase URL or access key in environment variables.");
    return null;
  }

  if (!supabaseServiceRoleKey) {
    console.warn(
      "[Supabase Admin] Notice: SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables. Falling back to ANON key. For full production security and storage management, configure SUPABASE_SERVICE_ROLE_KEY in Vercel and .env.local."
    );
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}

/**
 * Check if the Service Role key is configured in the environment.
 */
export function hasServiceRoleKey(): boolean {
  return Boolean(supabaseServiceRoleKey);
}

export { supabaseUrl, supabaseAnonKey };
