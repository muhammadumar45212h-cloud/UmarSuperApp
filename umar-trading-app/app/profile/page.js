"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Profile() {
  const [subs, setSubs] = useState(0);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [videos, setVideos] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [isSub, setIsSub] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("videos");
    if(saved) setVideos(JSON.parse(saved));
  }, );

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if(file) setProfilePic(URL.createObjectURL(file));
  }

  const subClick = () => {
    setIsSub(!isSub);
    setSubs(isSub? subs-1 : subs+1);
  }

  return (
    <div style={{background:"#fff", minHeight:"100vh", paddingBottom:"60px", fontFamily:"Roboto,Arial"}}>
      <div style={{height:"140px", background:"linear-gradient(135deg, #ff0000, #ff6b6b)"}}></div>

      <div style={{padding:"16px", marginTop:"-40px"}}>
        <div style={{position:"relative", width:"80px"}}>
          <img src={profilePic || "https://via.placeholder.com/80/CCCCCC/FFFFFF?text=Add"} style={{width:"80px", height:"80px", borderRadius:"50%", border:"4px solid white", objectFit:"cover", background:"white"}}/>
          <label style={{position:"absolute", bottom:"0", right:"0", background:"#ff0000", color:"white", width:"24px", height:"24px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"16px", border:"2px solid white"}}>
            +<input type="file" accept="image/*" onChange={handlePicUpload} style={{display:"none"}}/>
          </label>
        </div>

        <h2 style={{margin:"12px 0 4px 0", fontSize:"22px"}}>My Channel</h2>
        <p style={{margin:"0 0 12px 0", color:"#606060", fontSize:"14px"}}>
          {subs} subscribers • {views} views • {videos.length} videos
        </p>

        <button onClick={subClick} style={{background:isSub?"#909090":"#cc0000", color:"white", border:"none", padding:"8px 24px", borderRadius:"18px", cursor:"pointer", fontWeight:"bold"}}>🔔 {isSub?"Subscribed":"Subscribe"}</button>

        <div style={{display:"flex", gap:"30px", marginTop:"20px", padding:"15px 0", borderTop:"1px solid #e5e5e5"}}>
          <div><div style={{fontSize:"18px", fontWeight:"bold"}}>{likes}</div><div style={{color:"#606060", fontSize:"13px"}}>Likes</div></div>
          <div><div style={{fontSize:"18px", fontWeight:"bold"}}>{subs}</div><div style={{color:"#606060", fontSize:"13px"}}>Subscribers</div></div>
          <div><div style={{fontSize:"18px", fontWeight:"bold"}}>{views}</div><div style={{color:"#606060", fontSize:"13px"}}>Views</div></div>
        </div>
      </div>

      <div style={{padding:"0 16px 80px 16px"}}>
        <h3 style={{margin:"0 0 12px 0", fontSize:"16px"}}>My Videos</h3>
        {videos.length === 0? (
          <div style={{textAlign:"center", padding:"40px 20px", color:"#909090", border:"2px dashed #ddd", borderRadius:"12px"}}>
            <div style={{fontSize:"48px"}}>📹</div>
            <p>No videos yet</p>
            <p style={{fontSize:"13px"}}>Home pe + se upload karo</p>
          </div>
        ) : videos.map((v,i)=>(
          <div key={i} style={{marginBottom:"15px"}}>
            {v.type=="video"? (
              <video controls width="100%" style={{background:"black", borderRadius:"8px"}} src={v.url}></video>
            ) : (
              <img src={v.url} style={{width:"100%", background:"black", borderRadius:"8px"}}/>
            )}
            {v.caption && <p style={{margin:"5px 0 0 0", fontSize:"14px"}}>{v.caption}</p>}
          </div>
        ))}
      </div>

      <div style={{position:"fixed", bottom:0, width:"100%", background:"white", borderTop:"1px solid #e5e5e5", display:"flex", justifyContent:"space-around", padding:"6px 0"}}>
        <Link href="/" style={{textAlign:"center", fontSize:"12px", color:"#606060", textDecoration:"none"}}>🏠<br/>Home</Link>
        <Link href="/chat" style={{textAlign:"center", fontSize:"12px", color:"#606060", textDecoration:"none"}}>📈<br/>Market</Link>
        <div style={{textAlign:"center", fontSize:"12px", color:"black"}}>👤<br/>Profile</div>
      </div>
    </div>
  );
}
