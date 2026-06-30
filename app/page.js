'use client'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [showPost, setShowPost] = useState(false)

  return (
    <div className="bg-black text-white min-h-screen pb-20">
      {page === 'home' && <h2 className="p-4 text-xl font-bold">Forex Live Market</h2>}
      {page === 'profile' && <h2 className="p-4 text-xl font-bold">Profile Page</h2>}
      {page === 'chat' && <h2 className="p-4 text-xl font-bold">Chat Page</h2>}
      {page === 'text' && <h2 className="p-4 text-xl font-bold">Text Feed</h2>}

      {showPost && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
          <div className="bg-gray-900 p-5 rounded-xl">
            <h2 className="text-xl font-bold mb-3">Naya Post</h2>
            <button onClick={() => setShowPost(false)} className="bg-red-600 px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 w-full h-16 bg-gray-900 flex justify-around items-center border-t border-gray-800">
        <button onClick={() => setPage('home')} className="text-2xl">🏠</button>
        <button onClick={() => setPage('profile')} className="text-2xl">👤</button>
        <button onClick={() => setShowPost(true)} className="bg-blue-600 w-14 h-14 rounded-full text-3xl font-bold -mt-4">+</button>
        <button onClick={() => setPage('chat')} className="text-2xl">💬</button>
        <button onClick={() => setPage('text')} className="text-2xl">📝</button>
      </div>
    </div>
  )
}
