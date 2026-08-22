import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";

function isValidHttpUrl(stringVal: string): boolean {
  if (!stringVal || typeof stringVal !== "string") return false;
  try {
    const url = new URL(stringVal);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

const mockAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => {}
      }
    }
  }),
  signInWithOAuth: async () => ({ error: new Error("Supabase environment variables not configured") }),
  signOut: async () => ({ error: null })
};

const mockClient = {
  auth: mockAuth,
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      })
    }),
    upsert: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null })
  })
};

let supabaseClient: any;

if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
  // Graceful fallback when Supabase is not configured or URL is invalid
  supabaseClient = mockClient;
} else {
  try {
    const rawClient = createClient(supabaseUrl, supabaseAnonKey);
    const originalGetSession = rawClient.auth.getSession.bind(rawClient.auth);
    rawClient.auth.getSession = async () => {
      try {
        return await originalGetSession();
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    };
    supabaseClient = rawClient;
  } catch (err) {
    console.warn("Could not initialize Supabase client, falling back to mock client:", err);
    supabaseClient = mockClient;
  }
}

export const supabase = supabaseClient;


