'use client';
import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';

// Tera Firebase config - ye mera ready hai
const firebaseConfig = {
  apiKey: "AIzaSyBx...",
  authDomain: "umar-super-app.firebaseapp.com",
  projectId: "umar-super-app",
  storageBucket: "umar-super-app.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [page, setPage] = useState('home');
  const [showPostMenu, setShowPostMenu] = useState(false);

  return (
    <div className="h-screen bg-black text-white">
      
      {/* PAGE CONTENT */}
      {page === 'home' && <VideoFeed db={db} />}
      {page === 'profile' && <ProfilePage db={db} />}
      {page === 'chat' && <ChatPage db={db} />}
      {page === 'forex' && <ForexChart />}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 w-full flex justify-around py-3 bg-black border-t border-gray-800">
        <button onClick={() => setPage('home')}>🏠</button>
        <button onClick={() => setPage('profile')}>👤</button>
        
        {/* + BUTTON */}
        <button 
          onClick={() => setShowPostMenu(!showPostMenu)}
          className="bg-white text-black w-12 h-12 rounded-full text-2xl"
        >+</button>
        
        <button onClick={() => setPage('chat')}>💬</button>
        <button onClick={() => setPage('forex')}>📈</button>
      </div>

      {/* POST MENU POPUP */}
      {showPostMenu && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 p-4 rounded-xl">
          <button className="block w-full py-2">Video Post</button>
          <button className="block w-full py-2">Text Post</button>
        </div>
      )}
    </div>
  );
}

// Video Feed with Swipe + Real Like
function VideoFeed({ db }) {
  return <div className="h-full flex items-center justify-center">Video Swipe yaha aayega</div>
}

// Profile Page
function ProfilePage({ db }) {
  return <div className="p-4">Teri photo + History yaha aayegi</div>
}

// Chat Page DM
function ChatPage({ db }) {
  return <div className="p-4">DM Chat yaha aayegi</div>
}

// TradingView Forex Chart
function ForexChart() {
  return (
    <iframe 
      src="https://s.tradingview.com/widgetembed/?symbol=FX:EURUSD&interval=1"
      className="w-full h-full border-0"
    />
  );
}
