"use client"
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Upload() {
  const [type, setType] = useState("video");
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [textPost, setTextPost] = useState("");
  const router = useRouter();
  const fileRef = useRef();

  const handlePost = () => {
    if(type === "video" &&!video) return alert("Pehle video select karo");
    if(type === "text" &&!textPost.trim()) return alert("Text likho bhai");

    const post = {
      type,
      video: type === "video"? URL.createObjectURL(video) : null,
      caption: type === "video"? caption : textPost,
      time: new Date().toLocaleTimeString(),
      id: Date.now()
    };

    const posts = JSON.parse(localStorage.getItem("allPosts") || "[]");
    posts.unshift(post);
    localStorage.setItem("allPosts", JSON.stringify(posts));

    alert("✅ Post ho gayi!");
    router.push("/");
  };

  return (
    <div style={{
      background: "linear-gradient(180deg, #000 0%, #0f0f23 50%, #000 100%)",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>

      {/* Top Bar */}
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "25px", alignItems: "center"}}>
        <Link href="/" style={{color: "white", fontSize: "28px", textDecoration: "none"}}>×</Link>
        <b style={{fontSize: "20px", background: "linear-gradient(90deg, #667eea, #f093fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>Create Post</b>
        <button onClick={handlePost} style={{
          background: "linear-gradient(135deg,#25D366,#128C7E)",
          border: "none",
          color: "white",
          padding: "10px 24px",
          borderRadius: "25px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
          fontSize: "15px"
        }}>Post</button>
      </div>

      {/* Tab Switch - Bada aur khoobsurat */}
      <div style={{display: "flex", gap: "12px", marginBottom: "25px", background: "rgba(255,255,255,0.05)", padding: "6px", borderRadius: "16px", backdropFilter: "blur(20px)"}}>
        <button onClick={()=>setType("video")} style={{
          flex: 1,
          background: type === "video"? "linear-gradient(135deg,#667eea 0%,#764ba2 100%)" : "transparent",
          border: "none",
          color: "white",
          padding: "14px",
          borderRadius: "12px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "16px",
          transition: "all 0.3s"
        }}>📹 Video Post</button>
        <button onClick={()=>setType("text")} style={{
          flex: 1,
          background: type === "text"? "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)" : "transparent",
          border: "none",
          color: "white",
          padding: "14px",
          borderRadius: "12px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "16px",
          transition: "all 0.3s"
        }}>📝 Text Post</button>
      </div>

      {/* VIDEO POST - Bada box */}
      {type === "video" && (
        <div onClick={()=>fileRef.current.click()} style={{
          border: "3px dashed #444",
          borderRadius: "24px",
          minHeight: "55vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: video? "#111" : "rgba(102,126,234,0.05)",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s",
          padding: "20px"
        }}>
          {video? (
            <video src={URL.createObjectURL(video)} controls style={{width: "100%", maxHeight: "55vh", borderRadius: "18px"}}/>
          ) : (
            <>
              <div style={{fontSize: "80px", marginBottom: "20px", filter: "drop-shadow(0 0 30px #667eea)"}}>📹</div>
              <p style={{color: "#aaa", marginBottom: "25px", fontSize: "18px", textAlign: "center"}}>Tap karke gallery kholo<br/><span style={{fontSize: "13px", color: "#666"}}>Video select karo</span></p>
              <input ref={fileRef} type="file" accept="video/*" onChange={(e)=>setVideo(e.target.files[0])} style={{display: "none"}}/>
              <div style={{
                background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
                padding: "16px 40px",
                borderRadius: "30px",
                fontWeight: "bold",
                color: "white",
                fontSize: "17px",
                boxShadow: "0 8px 25px rgba(102,126,234,0.5)"
              }}>+ Gallery Se Chuno</div>
            </>
          )}
        </div>
      )}

      {/* TEXT POST - Full page jesa bada */}
      {type === "text" && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "2px solid #333",
          borderRadius: "24px",
          padding: "25px",
          minHeight: "55vh",
          backdropFilter: "blur(15px)"
        }}>
          <div style={{fontSize: "50px", textAlign: "center", marginBottom: "20px", opacity: 0.3}}>💭</div>
          <textarea
            placeholder="Dil ki baat likho bhai...&#10;&#10;Kya analysis hai?&#10;Kya signal dena hai?&#10;&#10;#XAUUSD #Forex #Trading"
            value={textPost}
            onChange={(e)=>setTextPost(e.target.value)}
            style={{
              width: "100%",
              minHeight: "40vh",
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "20px",
              lineHeight: "1.8",
              outline: "none",
              resize: "none",
              fontFamily: "inherit"
            }}
          />
        </div>
      )}

      {/* Caption - Dono ke liye */}
      <input
        placeholder={type === "video"? "Caption + Hashtag add karo... #XAUUSD #Signal" : "Extra caption ya hashtag..."}
        value={caption}
        onChange={(e)=>setCaption(e.target.value)}
        style={{
          width: "100%",
          padding: "18px",
          marginTop: "20px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid #333",
          borderRadius: "16px",
          color: "white",
          fontSize: "16px",
          outline: "none",
          backdropFilter: "blur(10px)"
        }}
      />

      {/* Footer tip */}
      <p style={{textAlign: "center", color: "#555", fontSize: "13px", marginTop: "20px"}}>
        ✨ Video ya Text - jo dil kare post karo
      </p>
    </div>
  );
}
