import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars aren't set yet, supabase will be null and the app
// falls back to localStorage-only mode gracefully.
export const supabase = (url && key) ? createClient(url, key) : null;

export const hasSupabase = () => !!supabase;
