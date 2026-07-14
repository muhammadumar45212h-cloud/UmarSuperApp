// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfrqoamagezzgdomlmus.supabase.co';
const supabaseKey = 'Sb_publishable_qWJP0WEFBfRKwcbxRcoQCA_bmkpmJyN';


export const supabase = createClient(supabaseUrl, supabaseKey);
