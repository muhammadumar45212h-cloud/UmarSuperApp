import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfrqoamagezzgdomlmus.supabase.co';
const supabaseAnonKey = 'sb_publishable_qWJP0WEFBfRKwcbxRcoQCA_bmkpmJyN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
