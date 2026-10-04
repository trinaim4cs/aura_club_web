import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const FALLBACK_SUPABASE_URL = "https://nsssdbepokzmbpeyqsqd.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zc3NkYmVwb2t6bWJwZXlxc3FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTExNjE5OCwiZXhwIjoyMTA2NjkyMTk4fQ.bekQvpvxk-HCcDVGmueQOEUXhdZTn-LgAFvKdxo7Rg8";

/**
 * Server-only Supabase client using the service role key. It bypasses RLS, so it must never be
 * imported from client code.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SUPABASE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const APPLICATIONS_TABLE = "aura_applications";
