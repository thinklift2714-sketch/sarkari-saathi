import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabaseUrl = rawUrl.trim().replace(/\/+$/, "");
const supabaseAnonKey = rawAnonKey.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project") &&
    !supabaseUrl.includes("placeholder")
  );
};

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  anonKeyLength: number;
  expectedCallbackUrl: string;
  error?: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const isConfig = isSupabaseConfigured();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const expectedCallback = `${origin}/auth/callback`;

  let error: string | undefined = undefined;
  if (!supabaseUrl) {
    error = "NEXT_PUBLIC_SUPABASE_URL is missing in frontend/.env.local";
  } else if (!supabaseUrl.startsWith("http")) {
    error = "NEXT_PUBLIC_SUPABASE_URL must start with https://";
  } else if (!supabaseAnonKey) {
    error = "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in frontend/.env.local";
  }

  return {
    isConfigured: isConfig,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 24)}...` : "",
    hasAnonKey: Boolean(supabaseAnonKey),
    anonKeyLength: supabaseAnonKey.length,
    expectedCallbackUrl: expectedCallback,
    error,
  };
};

// Create a single supabase client for interacting with database & auth
// Uses implicit flow for SPAs (avoids PKCE bad_code_verifier cross-tab errors)
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "implicit",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "sarkari_saathi_supabase_auth",
      },
    })
  : (createClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key-for-local-development-mode-sarkari-saathi",
      {
        auth: {
          flowType: "implicit",
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    ) as SupabaseClient);
