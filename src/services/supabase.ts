import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';

const STORAGE_KEY_URL = 'gymflow_supabase_url';
const STORAGE_KEY_ANON_KEY = 'gymflow_supabase_anon_key';

// Hardware-backed SecureStore Adapter for Supabase Session Persistence
const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore set error:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore delete error:', e);
    }
  },
};

// Baked-in Supabase Project Credentials
export const DEFAULT_SUPABASE_URL = 'https://ezfonvssjqimqlythuly.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Zm9udnNzanFpbXFseXRodWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MzQxMjAsImV4cCI6MjEwMzQxMDEyMH0.ssxGKWGbQTyVzke-iNw1kAbMwvrDYgaP_LYMRpBnG2M';

let supabaseClient: SupabaseClient | null = null;
let currentSupabaseUrl = DEFAULT_SUPABASE_URL;
let currentSupabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is configured (always true with baked-in project)
 */
export const isSupabaseConfigured = async (): Promise<boolean> => {
  return true;
};

/**
 * Initialize and retrieve the Supabase client
 */
export const getSupabaseClient = async (): Promise<SupabaseClient> => {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      storage: SecureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
};

/**
 * Update custom Supabase URL and Anon Key (optional override)
 */
export const setCustomSupabaseConfig = async (
  url: string,
  anonKey: string
): Promise<boolean> => {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, '') || DEFAULT_SUPABASE_URL;
    const cleanKey = anonKey.trim() || DEFAULT_SUPABASE_ANON_KEY;

    await SecureStore.setItemAsync(STORAGE_KEY_URL, cleanUrl);
    await SecureStore.setItemAsync(STORAGE_KEY_ANON_KEY, cleanKey);

    currentSupabaseUrl = cleanUrl;
    currentSupabaseAnonKey = cleanKey;

    supabaseClient = createClient(cleanUrl, cleanKey, {
      auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    return true;
  } catch (err) {
    console.error('Failed to configure Supabase client:', err);
    return false;
  }
};

/**
 * Get current configured Supabase credentials
 */
export const getSupabaseConfig = async (): Promise<{
  url: string;
  anonKey: string;
  isCustom: boolean;
}> => {
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isCustom: true,
  };
};

/**
 * Sign up with Email and Password
 */
export const signUpWithEmail = async (
  email: string,
  pass: string,
  gymName: string
) => {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password: pass,
    options: {
      data: {
        gym_name: gymName.trim(),
      },
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email: string, pass: string) => {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<{
  success: boolean;
  session?: Session | null;
  error?: string;
}> => {
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'gymflow://auth/callback',
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;
    if (data?.url) {
      const canOpen = await Linking.canOpenURL(data.url);
      if (canOpen) {
        await Linking.openURL(data.url);
        return { success: true };
      }
    }

    return { success: false, error: 'Could not open browser for Google authentication.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Google OAuth Sign-In failed.' };
  }
};

/**
 * Send password reset email
 */
export const resetPasswordForEmail = async (email: string) => {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
  return data;
};

/**
 * Sign out of current session
 */
export const signOutSupabase = async () => {
  const client = await getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

/**
 * Get active session
 */
export const getActiveSession = async (): Promise<Session | null> => {
  const client = await getSupabaseClient();
  const { data } = await client.auth.getSession();
  return data?.session || null;
};

/**
 * Get currently authenticated user
 */
export const getActiveUser = async (): Promise<User | null> => {
  const client = await getSupabaseClient();
  const { data } = await client.auth.getUser();
  return data?.user || null;
};
