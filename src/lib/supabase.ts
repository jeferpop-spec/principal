import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const invalidValues = ['https://SEU_PROJETO_REAL.supabase.co', 'SUA_CHAVE_ANONIMA_AQUI', 'https://temp.supabase.co', 'temp-key'];

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !invalidValues.includes(supabaseUrl) &&
  !invalidValues.includes(supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are not configured correctly. ' +
      'The app will still start, but no data will be loaded. ' +
      'Please update .env with your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://localhost',
  supabaseAnonKey || 'invalid-key'
);
