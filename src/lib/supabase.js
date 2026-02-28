import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = https://rwbhmfkqcezsfpqsxgun.supabase.co;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YmhtZmtxY2V6c2ZwcXN4Z3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODcwMzUsImV4cCI6MjA4Nzg2MzAzNX0.YhvI5d9kwxbu7deDUWcNw0fNsXPHNGkwVLf3IvbzwAk;  
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


