'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        setStatus('Error: ' + error.message);
      } else {
        setStatus('Connected successfully! Database is working.');
      }
    }
    checkConnection();
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Status: {status}</h1>
    </div>
  );
}
