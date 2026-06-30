'use client'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [showPost, setShowPost] = useState(false)

  const btnStyle = (active) => ({
    fontSize: '28px',
    background: 'none',
    border: 'none',
    color: active ? '#3b82f6' : '#9ca3af',
    cursor: 'pointer'
  })

  const centerBtnStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#2563eb',
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    border: 'none',
    marginTop: '-16px',
    cursor: 'pointer'
  }

  return (
    <div style={{background: '#000', color: '#fff', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Arial'}}>

      {/* Pages */}
      {page === 'home' && <ForexChart />}
      {page === 'profile' && <Profile />}
      {page === 'chat' && <Chat />}
      {page === 'text' && <TextFeed />}

      {/* Post Popup */}
      {showPost && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50}}>
          <div style={{background: '#1f2937', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px'}}>
            <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '15px'}}>Naya Post</h2>
            <button onClick={() => setShowPost(false)} style={{background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>Close</button>
          </div>
        </div>
      )}

      {/* Bottom Nav - 5 Buttons */}
      <div style={{position: 'fixed', bottom: 0, width: '100%', height: '64px', background: '#111827', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #374151'}}>
        <button onClick={() => setPage('home')} style={btnStyle(page==='home')}>🏠</button>
        <button onClick={() => setPage('profile')} style={btnStyle(page==='profile')}>👤</button>
        <button onClick={() => setShowPost(true)} style={centerBtnStyle}>+</button>
        <button onClick={() => setPage('chat')} style={btnStyle(page==='chat')}>💬</button>
        <button onClick={() => setPage('text')} style={btnStyle(page==='text')}>📝</button>
      </div>
    </div>
  )
}

function ForexChart() {
  const ref = useRef(null)
  useEffect(() => {
    if(ref.current && window.TradingView) {
      new window.TradingView.widget({
        container_id: ref.current.id,
        symbol: 'FX:EURUSD',
        interval: '1',
        theme: 'dark',
        autosize: true
      })
    }
    if(ref.current) {
      const s = document.createElement('script')
      s.src = 'https://s3.tradingview.com/tv.js'
      s.async = true
      s.onload = () => {
        new window.TradingView.widget({
          container_id: ref.current.id,
          symbol: 'FX:EURUSD',
          interval: '1',
          theme: 'dark',
          autosize: true,
          hide_side_toolbar: true
        })
      }
      ref.current.id = 'tv_' + Date.now()
      ref.current.appendChild(s)
    }
  }, [])
  return (
    <div>
      <h2 style={{padding: '16px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #374151'}}>Forex Live Market</h2>
      <div ref={ref} style={{width: '100%', height: '450px'}} />
    </div>
  )
}

function Chat() {
  const [msgs, setMsgs] = useState([{text: 'Salam bhai', me: false}])
  const [input, setInput] = useState('')
  const send = () => {
    if(input.trim()) {
      setMsgs([...msgs, {text: input, me: true}])
      setInput('')
    }
  }
  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <h2 style={{padding: '16px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #374151'}}>Messages</h2>
      <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {msgs.map((m,i) => (
          <div key={i} style={{textAlign: m.me ? 'right' : 'left', marginBottom: '10px'}}>
            <span style={{background: m.me ? '#16a34a' : '#374151', padding: '8px 12px', borderRadius: '8px', display: 'inline-block'}}>{m.text}</span>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', padding: '12px', background: '#111827', borderTop: '1px solid #374151'}}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Message..." style={{flex: 1, background: '#374151', borderRadius: '8px', padding: '8px 12px', color: 'white', border: 'none', outline: 'none'}} />
        <button onClick={send} style={{marginLeft: '8px', background: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>Send</button>
      </div>
    </div>
  )
}

function Profile() {
  return (
    <div style={{padding: '16px'}}>
      <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '20px'}}>Profile</h2>
      <div style={{textAlign: 'center'}}>
        <img src="https://i.pravatar.cc/150" style={{width: '96px', height: '96px', borderRadius: '50%', border: '4px solid #3b82f6'}} alt="profile" />
        <h3 style={{marginTop: '12px', fontSize: '20px', fontWeight: 'bold'}}>Umar Boss</h3>
        <div style={{display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px'}}>
          <div><p style={{fontSize: '28px', fontWeight: 'bold'}}>1250</p><p style={{color: '#9ca3af'}}>Subscribers</p></div>
          <div><p style={{fontSize: '28px', fontWeight: 'bold'}}>34200</p><p style={{color: '#9ca3af'}}>Likes</p></div>
        </div>
      </div>
    </div>
  )
}

function TextFeed() {
  const posts = [
    {user: 'Ali', text: 'EURUSD buy 1.0850', likes: 234},
    {user: 'Khan', text: 'Market garam hai aaj', likes: 89}
  ]
  return (
    <div style={{padding: '16px'}}>
      <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #374151', paddingBottom: '12px'}}>Text Posts</h2>
      {posts.map((p,i) => (
        <div key={i} style={{background: '#1f2937', padding: '16px', borderRadius: '8px', marginBottom: '12px'}}>
          <p style={{color: '#3b82f6', fontWeight: 'bold'}}>@{p.user}</p>
          <p style={{margin: '8px 0'}}>{p.text}</p>
          <p style={{fontSize: '14px', color: '#9ca3af'}}>❤️ {p.likes}</p>
        </div>
      ))}
    </div>
  )
}
