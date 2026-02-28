import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qejdfxiyzxmagykfyduv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlamRmeGl5enhtYWd5a2Z5ZHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDM1MzEsImV4cCI6MjA4NzIxOTUzMX0.ucWsZgwxJZ4l5Hd8e9q7BUIfTbax8lU9Kuhgs693bjc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
