'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://hfrqoamagezzgdomlmus.supabase.co',
  'sb_publishable_qWJP0WEFBfRKwcbxRcoQCA_bmkpmJyN'
)

export default function SuperApp() {
  const [videos, setVideos] = useState([])
  const [messages, setMessages] = useState([])
  const [trades, setTrades] = useState([])
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const [symbol, setSymbol] = useState('XAUUSD')
  const [lot, setLot] = useState(0.01)
  const [type, setType] = useState('buy')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadVideos()
    loadMessages()
    loadTrades()
  }, [])

  async function loadVideos() {
    let { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
    setVideos(data || [])
  }

  async function loadMessages() {
    let { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function loadTrades() {
    let { data } = await supabase.from('trades').select('*').order('created_at', { ascending: false })
    setTrades(data || [])
  }

  async function uploadVideo(e) {
    const file = e.target.files[0]
    if (!file ||!title) return alert('Title likho bhai')
    setUploading(true)
    const fileName = Date.now() + '-' + file.name
    await supabase.storage.from('videos').upload(fileName, file)
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)
    await supabase.from('videos').insert({ title, video_url: urlData.publicUrl })
    setTitle(''); setUploading(false); loadVideos()
  }

  async function sendMessage() {
    if (!msg.trim()) return
    await supabase.from('messages').insert({ text: msg })
    setMsg(''); loadMessages()
  }

  async function openTrade() {
    const randomPrice = symbol === 'XAUUSD'? 2650 + Math.random()*50 : 60000 + Math.random()*2000
    await supabase.from('trades').insert({
      symbol, type, lot: parseFloat(lot),
      entry_price: randomPrice.toFixed(2),
      profit_loss: 0, status: 'open'
    })
    loadTrades()
  }

  return (
    <div style={{padding: 20, maxWidth: 1000, margin: 'auto', background: '#0a0a0a', color: 'white', minHeight: '100vh'}}>
      <h1 style={{textAlign: 'center'}}>🔥 Mukamil Trading App</h1>

      <div style={{border: '2px solid gold', padding: 10, marginBottom: 30, borderRadius: 10}}>
        <h2>📊 Live Market - TradingView</h2>
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_abc&symbol=OANDA:${symbol}&interval=5&hidesidetoolbar=1`}
          style={{width: '100%', height: 400, border: 'none', borderRadius: 10}}
        />
      </div>

      <div style={{border: '2px solid #4CAF50', padding: 20, borderRadius: 10, marginBottom: 30}}>
        <h2>💰 Demo Trading - MetaTrader5 Style</h2>
        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{padding: 10, marginRight: 10}}>
          <option value="XAUUSD">XAUUSD Gold</option>
          <option value="BTCUSD">BTCUSD Bitcoin</option>
          <option value="EURUSD">EURUSD</option>
          <option value="GBPUSD">GBPUSD</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} style={{padding: 10, marginRight: 10}}>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
        </select>
        <input type="number" step="0.01" value={lot} onChange={e => setLot(e.target.value)}
          placeholder="Lot" style={{padding: 10, width: 80, marginRight: 10}}/>
        <button onClick={openTrade} style={{padding: '10px 20px', background: type==='buy'?'green':'red', color: 'white', border: 'none', borderRadius: 5}}>
          {type.toUpperCase()} Order
        </button>

        <h3 style={{marginTop: 20}}>📈 Open Trades</h3>
        {trades.map(t => (
          <div key={t.id} style={{border: '1px solid #333', padding: 10, margin: 5, borderRadius: 5, background: '#1a1a1a'}}>
            {t.symbol} | {t.type.toUpperCase()} | Lot: {t.lot} | Entry: ${t.entry_price} | P/L: ${t.profit_loss}
          </div>
        ))}
      </div>

      <div style={{border: '2px solid #2196F3', padding: 20, borderRadius: 10, marginBottom: 30}}>
        <h2>📹 Video Upload</h2>
        <input placeholder="Video title" value={title} onChange={e => setTitle(e.target.value)} style={{width: '100%', padding: 10, marginBottom: 10, background: '#1a1a1a', color: 'white', border: '1px solid #333'}}/>
        <input type="file" accept="video/*" onChange={uploadVideo} disabled={uploading} style={{color: 'white'}}/>
        {uploading && <p>Upload ho raha hai...</p>}
      </div>

      <div>
        <h2>🎬 Sab Videos</h2>
        {videos.map(v => (
          <div key={v.id} style={{marginBottom: 30}}>
            <h3>{v.title}</h3>
            <video width="100%" controls src={v.video_url} style={{borderRadius: 10}}></video>
          </div>
        ))}
      </div>

      <div style={{border: '2px solid #FF5722', padding: 20, borderRadius: 10, marginTop: 40}}>
        <h2>💬 Live Chat Traders</h2>
        <div style={{height: 200, overflowY: 'auto', border: '1px solid #333', padding: 10, marginBottom: 10, background: '#1a1a1a'}}>
          {messages.map(m => <p key={m.id} style={{margin: '5px 0'}}>{m.text}</p>)}
        </div>
        <input placeholder="Market analysis likho..." value={msg} onChange={e => setMsg(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()} style={{width: '70%', padding: 10, background: '#1a1a1a', color: 'white', border: '1px solid #333'}}/>
        <button onClick={sendMessage} style={{padding: 10, marginLeft: 10, background: '#FF5722', color: 'white', border: 'none', borderRadius: 5}}>Bhejo</button>
      </div>
    </div>
  )
}
