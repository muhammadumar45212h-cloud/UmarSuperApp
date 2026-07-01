import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './AuthScreen';
import HomeScreen from './HomeScreen'; // Aapki main screen

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check karein kya user pehle se logged-in hai
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Session change hone par update karein
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Agar session hai toh Home dikhao, nahi toh Auth (Login/Signup)
  return session ? <HomeScreen /> : <AuthScreen />;
}
