"use client"
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Messages() {
  const [chats, setChats] = useState([
    {id:1, name:"Ali Khan", avatar:"A", lastMsg:"Bhai video dekhi?", time:"11:15", unread:2},
    {id:2, name:"Ahmed", avatar:"Ah", lastMsg:"Market kaisa chal raha?", time:"10:30", unread:0},
    {id:3, name:"Sana", avatar:"S", lastMsg:"Text post mast hai!", time:"Yesterday", unread:1}
  ]);
  const [openChat, setOpenChat] = useState(null);
  const [msgs, setMsgs] = useState({
    1: [
      {text:"Assalam o Alaikum", me:false, time:"11:10"},
      {text:"Walaikum Salam bhai", me:true, time:"11:12"},
      {text:"Bhai video dekhi?", me:false, time:"11:15"}
    ],
    2: [
      {text:"Market kaisa chal raha?", me:false, time:"10:30"}
    ],
    3: [
      {text:"Text post mast hai!", me:false, time:"Yesterday"}
    ]
  });
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  const sendMsg = () => {
    if(newMsg.trim()=="") return;
    const time = new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
    setMsgs({...msgs, [openChat]: [...(msgs[openChat]||[]), {text:newMsg, me:true, time}]});

    // Chat list ka last message update karo
    setChats(chats.map(c => c.id==openChat? {...c, lastMsg:newMsg, time:"now"} : c));
    setNewMsg("");
  }

  // Auto scroll neeche
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [msgs, openChat]);

  // CHAT WINDOW
  if(openChat) {
    const chat = chats.find(c=>c.id==openChat);
    return (
      <div style={{background:"#e5ddd5", minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"Arial"}}>
        {/* Header */}
        <div style={{background:"#075e54", color:"white", padding:"12px 15px", display:"flex", alignItems:"center", gap:"12px", position:"sticky", top:0, zIndex:10}}>
          <button onClick={()=>setOpenChat(null)} style={{background:"none", border:"none", color:"white", fontSize:"22px", cursor:"pointer"}}>←</button>
          <div style={{width:"40px", height:"40px", borderRadius:"50%", background:"#128C7E", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:"bold"}}>{chat.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:"16px", fontWeight:"500"}}>{chat.name}</div>
            <div style={{fontSize:"12px", opacity:0.8}}>online</div>
          </div>
          <div style={{fontSize:"20px"}}>⋮</div>
        </div>

        {/* Messages */}
        <div style={{flex:1, padding:"15px", overflowY:"auto", backgroundImage:"url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')"}}>
          {(msgs[openChat]||[]).map((m,i)=>(
            <div key={i} style={{display:"flex", justifyContent:m.me?"flex-end":"flex-start", marginBottom:"8px"}}>
              <div style={{
                background:m.me?"#dcf8c6":"white",
                padding:"8px 12px",
                borderRadius:"8px",
                maxWidth:"70%",
                boxShadow:"0 1px 0.5px rgba(0,0,0,0.13)",
                position:"relative"
              }}>
                <div style={{fontSize:"15px", marginBottom:"3px", wordWrap:"break-word"}}>{m.text}</div>
                <div style={{fontSize:"11px", color:"#667781", textAlign:"right"}}>{m.time} {m.me && "✓"}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{background:"#f0f0f0", padding:"8px", display:"flex", gap:"8px", alignItems:"center"}}>
          <input
            value={newMsg}
            onChange={e=>setNewMsg(e.target.value)}
            onKeyPress={e=>e.key=="Enter" && sendMsg()}
            placeholder="Message..."
            style={{flex:1, padding:"12px 15px", borderRadius:"20px", border:"none", outline:"none", fontSize:"15px"}}
          />
          <button
            onClick={sendMsg}
            style={{background:"#25D366", color:"white", border:"none", width:"45px", height:"45px", borderRadius:"50%", fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}
          >➤</button>
        </div>
      </div>
    );
  }

  // CHAT LIST
  return (
    <div style={{background:"#fff", minHeight:"100vh", paddingBottom:"60px", fontFamily:"Arial"}}>
      <div style={{background:"#075e54", color:"white", padding:"15px 16px", position:"sticky", top:0, zIndex:10}}>
        <b style={{fontSize:"20px"}}>Messages</b>
      </div>

      {chats.map(c=>(
        <div key={c.id} onClick={()=>setOpenChat(c.id)} style={{
          padding:"12px 16px",
          borderBottom:"1px solid #f5f5f5",
          cursor:"pointer",
          display:"flex",
          gap:"12px",
          background:c.unread>0?"#f0f8ff":"white"
        }}>
          <div style={{width:"50px", height:"50px", borderRadius:"50%", background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"18px", fontWeight:"bold", flexShrink:0}}>
            {c.avatar}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"3px"}}>
              <div style={{fontWeight:"500", fontSize:"16px"}}>{c.name}</div>
              <div style={{color:"#999", fontSize:"12px"}}>{c.time}</div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{color:"#667781", fontSize:"14px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>{c.lastMsg}</div>
              {c.unread>0 && <div style={{background:"#25D366", color:"white", borderRadius:"50%", width:"20px", height:"20px", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:"8px"}}>{c.unread}</div>}
            </div>
          </div>
        </div>
      ))}

      {/* Bottom Nav */}
      <div style={{position:"fixed", bottom:0, width:"100%", background:"white", borderTop:"1px solid #e5e5e5", display:"flex", justifyContent:"space-around", padding:"6px 0"}}>
        <Link href="/" style={{textAlign:"center", fontSize:"12px", color:"#606060", textDecoration:"none"}}>🏠<br/>Home</Link>
        <Link href="/chat" style={{textAlign:"center", fontSize:"12px", color:"#606060", textDecoration:"none"}}>📈<br/>Market</Link>
        <Link href="/profile" style={{textAlign:"center", fontSize:"12px", color:"#606060", textDecoration:"none"}}>👤<br/>Profile</Link>
      </div>
    </div>
  );
}
