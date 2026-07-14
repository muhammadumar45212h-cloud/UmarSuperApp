import { createClient } from '@supabase/supabase-js';

// Supabase URL jo 17593.png mein dikh raha hai
const SUPABASE_URL = 'https://hfrqoamagezzgdomlmus.supabase.co'; 

// Wo key jo aapne provide ki hai
const SUPABASE_ANON_KEY = 'Sb_publishable_qWJP0WEFBfRKwcbxRcoQCA_bmkpmJyN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
