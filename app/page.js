'use client'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [showPost, setShowPost] = useState(false)
  const [subs, setSubs] = useState(1250)
  const [likes, setLikes] = useState(34200)
  const [photo, setPhoto] = useState(null)

  return (
    <div className="bg-black text-white min-h-screen pb-20">
      {page === 'home' && <ForexChart />}
      {page === 'profile' && <Profile photo={photo} setPhoto={setPhoto} subs={subs} likes={likes} />}
      {page === 'chat' && <Chat />}
      {page === 'text' && <TextFeed />}
      {showPost && <PostModal onClose={() => setShowPost(false)} />}

      <div className="fixed bottom-0 w-full h-16 bg-gray-900 flex justify-around items-center border-t border-gray-800">
        <button onClick={() => setPage('home')} className={page==='home'? 'text-blue-500 text-2xl' : 'text-2xl'}>🏠</button>
        <button onClick={() => setPage('profile')} className={page==='profile'? 'text-blue-500 text-2xl' : 'text-2xl'}>👤</button>
        <button onClick={() => setShowPost(true)} className="bg-blue-600 w-14 h-14 rounded-full text-3xl font-bold -mt-4">+</button>
        <button onClick={() => setPage('chat')} className={page==='chat'? 'text-blue-500 text-2xl' : 'text-2xl'}>💬</button>
        <button onClick={() => setPage('text')} className={page==='text'? 'text-blue-500 text-2xl' : 'text-2xl'}>📝</button>
      </div>
    </div>
  )
}

function ForexChart() {
  const ref = useRef(null)
  useEffect(() => {
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
  }, [])
  return (
    <div>
      <h2 className="p-4 text-xl font-bold">Forex Live Market</h2>
      <div ref={ref} className="w-full h-[400px]" />
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
    <div className="h-screen flex-col">
      <h2 className="p-4 text-xl font-bold border-b border-gray-800">Messages</h2>
      <div className="flex-1 overflow-y-auto p-4">
        {msgs.map((m,i) => (
          <div key={i} className={m.me? 'text-right mb-2' : 'mb-2'}>
            <span className={m.me? 'bg-green-600 p-2 rounded' : 'bg-gray-800 p-2 rounded'}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex p-3 bg-gray-900">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Message..." className="flex-1 bg-gray-800 rounded px-3 py-2 text-white" />
        <button onClick={send} className="ml-2 bg-green-600 px-4 py-2 rounded">Send</button>
      </div>
    </div>
  )
}

function PostModal({ onClose }) {
  const [type, setType] = useState('video')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [desc, setDesc] = useState('')
  const post = () => { alert(type + ' posted'); onClose() }
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-5 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-3">Naya Post</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setType('video')} className={type==='video'? 'flex-1 bg-blue-600 py-2 rounded' : 'flex-1 bg-gray-700 py-2 rounded'}>Video</button>
          <button onClick={() => setType('text')} className={type==='text'? 'flex-1 bg-blue-600 py-2 rounded' : 'flex-1 bg-gray-700 py-2 rounded'}>Text</button>
        </div>
        {type === 'video' && (
          <>
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} className="w-full mb-2 text-sm text-white" />
            <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-gray-800 p-2 rounded mb-2 text-white" />
          </>
        )}
        {type === 'text' && (
          <textarea placeholder="Kya likhna hai" value={text} onChange={e => setText(e.target.value)} className="w-full h-24 bg-gray-800 p-2 rounded mb-2 text-white" />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded">Cancel</button>
          <button onClick={post} className="flex-1 bg-blue-600 py-2 rounded font-bold">Post</button>
        </div>
      </div>
    </div>
  )
}

function Profile({ photo, setPhoto, subs, likes }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">Profile</h2>
      <div className="flex flex-col items-center">
        <label>
          <img src={photo || 'https://i.pravatar.cc/150'} className="w-24 h-24 rounded-full border-4 border-blue-500" alt="profile" />
          <input type="file" accept="image/*" onChange={e => setPhoto(URL.createObjectURL(e.target.files[0]))} className="hidden" />
        </label>
        <h3 className="mt-3 text-xl font-bold">Umar Boss</h3>
        <div className="flex gap-10 mt-5">
          <div className="text-center"><p className="text-3xl font-bold">{subs}</p><p className="text-gray-400">Subscribers</p></div>
          <div className="text-center"><p className="text-3xl font-bold">{likes}</p><p className="text-gray-400">Likes</p></div>
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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Text Posts</h2>
      {posts.map((p,i) => (
        <div key={i} className="bg-gray-900 p-4 rounded mb-3">
          <p className="text-blue-400 font-bold">@{p.user}</p>
          <p className="my-2">{p.text}</p>
          <p className="text-sm text-gray-400">❤️ {p.likes}</p>
        </div>
      ))}
    </div>
  )
}
