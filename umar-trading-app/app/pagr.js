"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(()=>{
    const saved = localStorage.getItem("allPosts");
    if(saved) {
      const data = JSON.parse(saved);
      // purani posts me like, share add karo agar nahi hai
      const updated = data.map(p => ({
       ...p,
        likes: p.likes || 0,
        shares: p.shares || 0,
        liked: p.liked || false
      }));
      setPosts(updated);
    }
    const subs = localStorage.getItem("subs");
    if(subs) setSubscribers(parseInt(subs));
  }, []);

  const handleLike = (id) => {
    const updated = posts.map(p => {
      if(p.id === id) {
        const newLiked =!p.liked;
        return {...p, likes: newLiked? p.likes + 1 : p.likes - 1, liked: newLiked};
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("allPosts", JSON.stringify(updated));
  };

  const handleShare = (id) => {
    const updated = posts.map(p => {
      if(p.id === id) {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copy ho gayi! Friend ko bhej do");
        return {...p, shares: p.shares + 1};
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("allPosts", JSON.stringify(updated));
  };

  const handleComment = (id) => {
    if(!commentText[id]?.trim()) return;
    const newComment = {text: commentText[id], time: new Date().toLocaleTimeString()};
    setComments({...comments, [id]: [...(comments[id] || []), newComment]});
    setCommentText({...commentText, [id]: ""});
  };

  const handleSubscribe = () => {
    const newStatus =!isSubscribed;
    setIsSubscribed(newStatus);
    const newCount = newStatus? subscribers + 1 : subscribers - 1;
    setSubscribers(newCount);
    localStorage.setItem("subs", newCount.toString());
  };

  return (
    <div style={{
      background: "#000",
      color: "white",
      minHeight: "100vh",
      paddingBottom: "100px"
    }}>

      <div style={{padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h1 style={{fontSize: "24px", fontWeight: "bold", color: "#fff"}}>Feed</h1>
        <Link href="/upload" style={{fontSize: "35px", color: "#25D366", textDecoration: "none"}}>+</Link>
      </div>

      {/* Posts */}
      {posts.length === 0? (
        <div style={{textAlign: "center", marginTop: "150px", color: "#555"}}>
          <div style={{fontSize: "70px"}}>📱</div>
          <p>+ dabao pehli post karo</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} style={{
            marginBottom: "30px",
            position: "relative"
          }}>

            {/* 1. Upar Profile + Subscribe Button */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 15px",
              gap: "12px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#667eea,#764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold"
              }}>U</div>
              <div style={{flex: 1}}>
                <p style={{fontWeight: "bold", fontSize: "15px"}}>User</p>
                <p style={{fontSize: "12px", color: "#888"}}>{post.time}</p>
              </div>
              <button onClick={handleSubscribe} style={{
                background: isSubscribed? "#333" : "linear-gradient(135deg,#667eea,#764ba2)",
                border: "none",
                color: "white",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}>
                {!isSubscribed && "+"} {isSubscribed? "Subscribed" : "Subscribe"}
              </button>
            </div>

            {/* 2. Text Post ka nishan */}
            {post.type === "text" && (
              <div style={{
                padding: "0 15px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{fontSize: "14px", background: "#222", padding: "4px 10px", borderRadius: "12px"}}>📝 Text Post</span>
              </div>
            )}

            {/* 3. Video ya Text Content */}
            {post.type === "video"? (
              <video
                src={post.video}
                controls
                style={{
                  width: "100%",
                  maxHeight: "70vh",
                  background: "#111"
                }}
              />
            ) : (
              <div style={{
                padding: "20px 15px",
                fontSize: "18px",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                minHeight: "200px"
              }}>{post.caption}</div>
            )}

            {/* 4. Neeche 4 Line: Like Comment Share Subscribe */}
            <div style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "15px 0",
              borderBottom: "1px solid #222"
            }}>
              <button onClick={() => handleLike(post.id)} style={{
                background: "none",
                border: "none",
                color: post.liked? "#ff3040" : "white",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px"
              }}>
                <div style={{fontSize: "28px"}}>{post.liked? "❤️" : "🤍"}</div>
                <span>{post.likes}</span>
              </button>

              <button onClick={() => {
                const c = document.getElementById("c"+post.id);
                c.style.display = c.style.display === "none"? "block" : "none";
              }} style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px"
              }}>
                <div style={{fontSize: "28px"}}>💬</div>
                <span>{(comments[post.id] || []).length}</span>
              </button>

              <button onClick={() => handleShare(post.id)} style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px"
              }}>
                <div style={{fontSize: "28px"}}>📤</div>
                <span>{post.shares}</span>
              </button>

              <div style={{
                color: "#888",
                fontSize: "13px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px"
              }}>
                <div style={{fontSize: "28px"}}>👥</div>
                <span>{subscribers}</span>
              </div>
            </div>

            {/* Comment Box */}
            <div id={"c"+post.id} style={{display: "none", padding: "15px", background: "#0a0a0a"}}>
              {(comments[post.id] || []).map((c, i) => (
                <p key={i} style={{fontSize: "14px", marginBottom: "8px", color: "#ccc"}}>👤 {c.text}</p>
              ))}
              <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                <input
                  placeholder="Comment likho..."
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText({...commentText, [post.id]: e.target.value})}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#222",
                    border: "none",
                    borderRadius: "20px",
                    color: "white",
                    outline: "none"
                  }}
                />
                <button onClick={() => handleComment(post.id)} style={{
                  background: "#667eea",
                  border: "none",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  cursor: "pointer"
                }}>Send</button>
              </div>
            </div>

          </div>
        ))
      )}

      {/* Bottom Nav same */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "rgba(0,0,0,0.95)",
        borderTop: "1px solid #222",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0",
        backdropFilter: "blur(20px)"
      }}>
        <div style={{color: "#25D366", textAlign: "center", fontSize: "12px"}}>🏠<br/>Home</div>
        <Link href="/chat" style={{color: "#666", textAlign: "center", fontSize: "12px", textDecoration: "none"}}>📈<br/>Market</Link>
        <Link href="/upload" style={{background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", width: "55px", height: "55px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", color: "white", textDecoration: "none", marginTop: "-20px"}}>+</Link>
        <Link href="/messages" style={{color: "#666", textAlign: "center", fontSize: "12px", textDecoration: "none"}}>💬<br/>Chat</Link>
        <Link href="/profile" style={{color: "#666", textAlign: "center", fontSize: "12px", textDecoration: "none"}}>👤<br/>Profile</Link>
      </div>
    </div>
  );
}
