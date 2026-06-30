'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [page, setPage] = useState('home');

  return (
    <main className="h-screen w-full bg-black text-white">
      {/* Content Area - Yahan page change hoga */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        {page === 'home' && <div className="p-4"><h1>Video Feed Aayegi</h1></div>}
        {page === 'chat' && <div className="p-4"><h1>WhatsApp Style Chat</h1></div>}
        {page === 'market' && <div className="h-full w-full" id="tradingview_widget"></div>}
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 w-full h-16 bg-gray-900 flex justify-around items-center border-t border-gray-800">
        <button onClick={() => setPage('home')}>🏠</button>
        <button onClick={() => setPage('profile')}>👤</button>
        <button className="bg-blue-600 w-12 h-12 rounded-full">+</button>
        <button onClick={() => setPage('chat')}>💬</button>
        <button onClick={() => { setPage('market'); loadTV(); }}>📈</button>
      </nav>
    </main>
  );
}

function loadTV() {
  setTimeout(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => {
      new TradingView.widget({
        container_id: 'tradingview_widget',
        symbol: 'FX:XAUUSD',
        theme: 'dark',
        autosize: true
      });
    };
    document.body.appendChild(script);
  }, 500);
}
