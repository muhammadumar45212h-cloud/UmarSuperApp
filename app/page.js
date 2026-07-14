// lib/supabaseClient.js mein ye daalein
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// app/login/page.js mein login handle karein
async function handleLogin(phone, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phone, // Aapka number
    password: password,
  });
  if (data) alert("Login Successful!");
}
