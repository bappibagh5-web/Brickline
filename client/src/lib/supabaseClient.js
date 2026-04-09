import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isPlaceholder =
  !supabaseUrl
  || !supabaseAnonKey
  || String(supabaseUrl).includes('YOUR_PROJECT_REF')
  || String(supabaseAnonKey).includes('YOUR_SUPABASE_ANON_KEY');

if (isPlaceholder) {
  throw new Error(
    'Invalid Supabase env. Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.local or your deployment env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
