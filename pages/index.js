import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSignup = async () => {
    setLoading(true); setMsg("");
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { phone } 
    });
    if (error) setMsg("❌ " + error.message);
    else {
      await supabase.from('users').insert([{ id: data.user.id, email, phone, balance: 0 }]);
      setMsg("✅ Account ban gaya!");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg("❌ " + error.message);
    else setMsg("🚀 Login ho gaya! Umar Super App");
    setLoading(false);
  };

  return (
    <div style={{minHeight: "100vh", background: "linear-gradient(to bottom right, #9333ea, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"}}>
      <div style={{background: "white", borderRadius: "20px", padding: "30px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)"}}>
        <div style={{textAlign: "center", marginBottom: "20px"}}>
          <div style={{fontSize: "60px"}}>👑</div>
          <h1 style={{color: "#9333ea"}}>Umar Super App</h1>
        </div>
        <input type="email" placeholder="Email" style={{width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #ccc", borderRadius: "8px"}} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" style={{width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #ccc", borderRadius: "8px"}} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="text" placeholder="Phone Number" style={{width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ccc", borderRadius: "8px"}} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button onClick={handleSignup} disabled={loading} style={{width: "100%", background: "#9333ea", color: "white", padding: "12px", border: "none", borderRadius: "8px", marginBottom: "12px", fontWeight: "bold"}}>{loading ? "Loading..." : "🚀 Launch App - Signup"}</button>
        <button onClick={handleLogin} style={{width: "100%", background: "#1f2937", color: "white", padding: "12px", border: "none", borderRadius: "8px", fontWeight: "bold"}}>Login</button>
        {msg && <p style={{textAlign: "center", marginTop: "16px", fontWeight: "bold"}}>{msg}</p>}
      </div>
    </div>
  );
}
