"use client"
import Link from "next/link";
import { useState } from "react";

export default function Market() {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [lot, setLot] = useState("0.02");
  const [price, setPrice] = useState("4039.730");

  const handleBuy = () => {
    alert(`✅ BUY ${lot} lot @ ${price}\nSymbol: ${symbol}`);
  };
  
  const handleSell = () => {
    alert(`❌ SELL ${lot} lot @ ${price}\nSymbol: ${symbol}`);
  };

  return (
    <div style={{background:"#0b141a", color:"white", minHeight:"100vh", paddingBottom:"80px"}}>
      
      {/* Top Bar */}
      <div style={{padding:"12px", background:"#202c33", position:"sticky", top:0, zIndex:20}}>
        <div style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
          {["XAUUSD","EURUSD","GBPUSD"].map(s=>(
            <button key={s} onClick={()=>setSymbol(s)} style={{
              background: symbol==s? "#25D366":"#2a3942", 
              border:"none", color:"white", padding:"6px 12px", borderRadius:"8px", fontSize:"13px"
            }}>{s}</button>
          ))}
        </div>
        <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
          <span style={{fontSize:"14px"}}>Lot:</span>
          <input type="number" step="0.01" value={lot} onChange={(e)=>setLot(e.target.value)} 
            style={{background:"#111", border:"1px solid #333", color:"white", padding:"5px 10px", borderRadius:"6px", width:"80px"}}/>
          <span style={{color:"#888", fontSize:"13px"}}>Balance: $10,000</span>
        </div>
      </div>

      {/* Chart Container with Buy/Sell overlay */}
      <div style={{position:"relative"}}>
        
        {/* BUY SELL Buttons - Tumhare green circle wali jagah */}
        <div style={{
          position:"absolute", 
          top:"15px", 
          left:"10px", 
          right:"10px", 
          display:"flex", 
          justifyContent:"space-between",
          zIndex:15
        }}>
          <button onClick={handleSell} style={{
            background:"#ef4444", 
            border:"none", 
            color:"white", 
            padding:"8px 20px", 
            borderRadius:"8px", 
            fontWeight:"bold",
            fontSize:"16px",
            boxShadow:"0 4px 12px rgba(239,68,68,0.4)"
          }}>
            SELL<br/>
            <span style={{fontSize:"12px", fontWeight:"normal"}}>{price}</span>
          </button>
          
          <button onClick={handleBuy} style={{
            background:"#22c55e", 
            border:"none", 
            color:"white", 
            padding:"8px 20px", 
            borderRadius:"8px", 
            fontWeight:"bold",
            fontSize:"16px",
            boxShadow:"0 4px 12px rgba(34,197,94,0.4)"
          }}>
            BUY<br/>
            <span style={{fontSize:"12px", fontWeight:"normal"}}>{parseFloat(price)+80.27}</span>
          </button>
        </div>

        {/* TradingView Candlestick Chart */}
        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=FX_IDC:${symbol}&interval=60&theme=dark&style=1&timezone=Asia/Karachi&toolbarbg=rgba(0,0,0,1)`}
          style={{width:"100%", height:"calc(100vh - 220px)", border:"none"}}
        />
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed", bottom:0, width:"100%", background:"#000", borderTop:"1px solid #222", display:"flex", justifyContent:"space-around", alignItems:"center", padding:"8px 0"}}>
        <Link href="/" style={{color:"#666", textAlign:"center", fontSize:"12px", textDecoration:"none"}}>🏠<br/>Home</Link>
        <div style={{color:"#25D366", textAlign:"center", fontSize:"12px"}}>📈<br/>Market</div>
        <Link href="/upload" style={{background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)", width:"55px", height:"55px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"30px", color:"white", textDecoration:"none", marginTop:"-20px"}}>+</Link>
        <Link href="/messages" style={{color:"#666", textAlign:"center", fontSize:"12px", textDecoration:"none"}}>💬<br/>Chat</Link>
        <Link href="/profile" style={{color:"#666", textAlign:"center", fontSize:"12px", textDecoration:"none"}}>👤<br/>Profile</Link>
      </div>
    </div>
  );
}
