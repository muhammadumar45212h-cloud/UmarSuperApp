'use client'
import { useState } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [show, setShow] = useState(false)

  return (
    <div style={{minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Arial'}}>
      
      {page === 'home' && <h1 style={{padding: '20px', fontSize: '24px'}}>🏠 Home - Forex Chart yahan aayega</h1>}
      {page === 'profile' && <h1 style={{padding: '20px', fontSize: '24px'}}>👤 Profile Page</h1>}
      {page === 'chat' && <h1 style={{padding: '20px', fontSize: '24px'}}>💬 Chat Page</h1>}
      {page === 'text' && <h1 style={{padding: '20px', fontSize: '24px'}}>📝 Text Feed</h1>}

      {show && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: '#222', padding: '30px', borderRadius: '10px'}}>
            <h2>Post ka Popup!</h2>
            <button onClick={() => setShow(false)} style={{marginTop: '10px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px'}}>Band Karo</button>
          </div>
        </div>
      )}

      {/* 5 Buttons */}
      <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: '#111', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #333'}}>
        <button onClick={() => setPage('home')} style={{fontSize: '30px', background: 'none', border: 'none', color: page==='home'?'blue':'gray'}}>🏠</button>
        <button onClick={() => setPage('profile')} style={{fontSize: '30px', background: 'none', border: 'none', color: page==='profile'?'blue':'gray'}}>👤</button>
        <button onClick={() => setShow(true)} style={{width: '60px', height: '60px', borderRadius: '50%', background: 'blue', color: 'white', fontSize: '35px', border: 'none', marginTop: '-20px'}}>+</button>
        <button onClick={() => setPage('chat')} style={{fontSize: '30px', background: 'none', border: 'none', color: page==='chat'?'blue':'gray'}}>💬</button>
        <button onClick={() => setPage('text')} style={{fontSize: '30px', background: 'none', border: 'none', color: page==='text'?'blue':'gray'}}>📝</button>
      </div>
    </div>
  )
}
