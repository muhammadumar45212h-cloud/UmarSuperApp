'use client'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [showPost, setShowPost] = useState(false)
  const [subs, setSubs] = useState(1250)
  const [likes, setLikes] = useState(34200)
  const [photo, setPhoto] = useState(null)

  return (
    <div className="bg-black text-white min-h-screen pb-20 font-sans">

      {/* Pages */}
      {page === 'home' && <ForexChart />}
      {page === 'profile' && <Profile photo={photo} setPhoto={setPhoto} subs={subs} likes={likes} />}
      {page === 'chat' && <Chat />}
      {page === 'text' && <TextFeed />}

      {/* Post Popup */}
      {showPost && <PostModal onClose={() => setShowPost(false)} />}

      {/* Bottom Nav - 5 Buttons */}
      <div className="fixed bottom-0 w-full h-16 bg-gray-900 flex justify-around items-center border-t border-gray-800">
        <button onClick={() => setPage('home')} className={page==='home'? 'text-blue-500 text-2xl' : 'text-gray-400 text-2xl'}>🏠</button>
        <button onClick={() => setPage('profile')} className={page==='profile'? 'text-blue-500 text-2xl' : 'text-gray-400 text-2xl'}>👤</button>
        <button onClick={() => setShowPost(true)} className="bg-blue-600 w-14 h-14 rounded-full text-3xl font-bold -mt-4 shadow-lg">+</button>
        <button onClick={() => setPage('chat')} className={page==='chat'? 'text-blue-500 text-2xl' : 'text-gray-400 text-2xl'}>💬</button>
        <button onClick={() => setPage('text')} className={page==='text'? 'text-blue-500 text-2xl' : 'text-gray-400 text-2xl'}>📝</button>
      </div>
    </div>
  )
}

function ForexChart() {
  const ref = useRef(null)
  useEffect(() => {
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
          hide_side_toolbar: true,
          hide_top_toolbar: false
        })
      }
      ref.current.id = 'tv_' + Date.now()
      ref.current.appendChild(s)
    }
  }, [])
  return (
    <div>
      <h2 className="p-4 text-xl font-bold border-b border-gray-800">Forex Live Market</h2>
      <div ref={ref} className="w-full h-[450px]" />
      <p className="p-4 text-sm text-gray-400">EUR/USD 1 Minute Chart - Live</p>
    </div>
  )
}

function Chat() {
  const [msgs, setMsgs] = useState([
    {text: 'Salam bhai, market kaisa hai?', me: false},
    {text: 'Walekum salam, EURUSD buy zone me hai', me: true}
  ])
  const [input, setInput] = useState('')
  const send = () => {
    if(input.trim()) {
      setMsgs([...msgs, {text: input, me: true}])
      setInput('')
    }
  }
  return (
    <div className="h-screen flex-col">
      <h2 className="p-4 text-xl font-bold border-b border-gray-800">Messages</h2>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map((m,i) => (
          <div key={i} className={m.me? 'text-right' : 'text-left'}>
            <span className={m.me? 'bg-green-600 p-2 rounded-lg inline-block max-w-[70%]' : 'bg-gray-800 p-2 rounded-lg inline-block max-w-[70%]'}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex p-3 bg-gray-900 border-t border-gray-800">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key==='Enter' && send()} placeholder="Message likho..." className="flex-1 bg-gray-800 rounded px-3 py-2 text-white outline-none" />
        <button onClick={send} className="ml-2 bg-green-600 px-4 py-2 rounded font-bold">Send</button>
      </div>
    </div>
  )
}

function PostModal({ onClose }) {
  const [type, setType] = useState('video')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [desc, setDesc] = useState('')

  const post = () => {
    alert(type + ' post ho gaya!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-5 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Naya Post</h2>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setType('video')} className={type==='video'? 'flex-1 bg-blue-600 py-2 rounded font-bold' : 'flex-1 bg-gray-700 py-2 rounded'}>Video</button>
          <button onClick={() => setType('text')} className={type==='text'? 'flex-1 bg-blue-600 py-2 rounded font-bold' : 'flex-1 bg-gray-700 py-2 rounded'}>Text</button>
        </div>

        {type === 'video' && (
          <>
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} className="w-full mb-3 text-sm text-white file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1" />
            <input placeholder="Description likho..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-gray-800 p-2 rounded mb-3 text-white outline-none" />
          </>
        )}

        {type === 'text' && (
          <textarea placeholder="Kya likhna hai..." value={text} onChange={e => setText(e.target.value)} className="w-full h-24 bg-gray-800 p-2 rounded mb-3 text-white outline-none" />
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded font-bold">Cancel</button>
          <button onClick={post} className="flex-1 bg-blue-600 py-2 rounded font-bold">Post</button>
        </div>
      </div>
    </div>
  )
}

function Profile({ photo, setPhoto, subs, likes }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">Profile</h2>
      <div className="flex flex-col items-center">
        <label className="cursor-pointer">
          <img src={photo || 'https://i.pravatar.cc/150?u=umar'} className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover" alt="profile" />
          <input type="file" accept="image/*" onChange={e => setPhoto(URL.createObjectURL(e.target.files[0]))} className="hidden" />
        </label>
        <h3 className="mt-3 text-xl font-bold">Umar Boss</h3>
        <p className="text-gray-400 text-sm">@umarboss</p>

        <div className="flex gap-10 mt-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{subs}</p>
            <p className="text-gray-400 text-sm">Subscribers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{likes}</p>
            <p className="text-gray-400 text-sm">Likes</p>
          </div>
        </div>

        <button className="mt-8 bg-blue-600 px-8 py-3 rounded-full font-bold">Edit Profile</button>
      </div>
    </div>
  )
}

function TextFeed() {
  const posts = [
    {user: 'AliTrader', text: 'EURUSD buy 1.0850, SL 1.0800, TP 1.0950', likes: 234, time: '2h'},
    {user: 'KhanFX', text: 'Market garam hai aaj. GBPUSD short karo', likes: 89, time: '4h'},
    {user: 'ForexKing', text: 'NFP news ke baad dollar strong', likes: 412, time: '6h'}
  ]
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-3">Text Posts</h2>
      {posts.map((p,i) => (
        <div key={i} className="bg-gray-900 p-4 rounded-lg mb-3 border-gray-800">
          <div className="flex justify-between mb-2">
            <p className="text-blue-400 font-bold">@{p.user}</p>
            <p className="text-gray-500 text-sm">{p.time}</p>
          </div>
          <p className="my-2">{p.text}</p>
          <p className="text-sm text-gray-400">❤️ {p.likes} likes</p>
        </div>
      ))}
    </div>
  )
}
