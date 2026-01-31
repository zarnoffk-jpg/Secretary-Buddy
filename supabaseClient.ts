import { createClient } from '@supabase/supabase-js';

// Use process.env as import.meta.env is undefined in this environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to avoid breaking build if keys are missing
export const supabase = createClient(
  supabaseUrl || 'https://owlkfuozoagkogcwgsfq.supabase.co', 
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGtmdW96b2Fna29nY3dnc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NjksImV4cCI6MjA4NTIwNjk2OX0.C8DzahhBMcRd1FYXEH1s675qXIgyzFMfhw_0pvj2RKA'
);