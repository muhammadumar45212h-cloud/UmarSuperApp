import { useState } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [show, setShow] = useState(false)

  return (
    <div style={{background: 'black', color: 'white', minHeight: '100vh', paddingBottom: '80px'}}>
      
      <div style={{padding: '20px'}}>
        {page === 'home' && <h1 style={{fontSize: '24px'}}>🏠 Home - Chal gaya!</h1>}
        {page === 'profile' && <h1 style={{fontSize: '24px'}}>👤 Profile Page</h1>}
        {page === 'chat' && <h1 style={{fontSize: '24px'}}>💬 Chat Page</h1>}
        {page === 'text' && <h1 style={{fontSize: '24px'}}>📝 Text Feed</h1>}
      </div>

      {show && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: '#222', padding: '30px', borderRadius: '10px'}}>
            <h2>Post ka Popup Khul gaya!</h2>
            <button onClick={() => setShow(false)} style={{marginTop: '10px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Band Karo</button>
          </div>
        </div>
      )}

      {/* 5 Buttons */}
      <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: '#111', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '2px solid #333'}}>
        <button onClick={() => setPage('home')} style={{fontSize: '35px', background: 'none', border: 'none', color: page==='home'?'#3b82f6':'gray', cursor: 'pointer'}}>🏠</button>
        <button onClick={() => setPage('profile')} style={{fontSize: '35px', background: 'none', border: 'none', color: page==='profile'?'#3b82f6':'gray', cursor: 'pointer'}}>👤</button>
        <button onClick={() => setShow(true)} style={{width: '60px', height: '60px', borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: '35px', border: 'none', marginTop: '-20px', cursor: 'pointer'}}>+</button>
        <button onClick={() => setPage('chat')} style={{fontSize: '35px', background: 'none', border: 'none', color: page==='chat'?'#3b82f6':'gray', cursor: 'pointer'}}>💬</button>
        <button onClick={() => setPage('text')} style={{fontSize: '35px', background: 'none', border: 'none', color: page==='text'?'#3b82f6':'gray', cursor: 'pointer'}}>📝</button>
      </div>
    </div>
  )
}
