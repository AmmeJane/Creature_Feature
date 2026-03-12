import { useLocation, useNavigate } from "react-router-dom";
import { S } from "../constants/colours";
import { NavPill } from "./ui/primitives";
import { useState, useEffect } from "react";


interface NavBarProps {
  tick: number;
}



export function NavBar({ tick }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string; image: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(setProfile);
  }, []);


  return (
    <div style={{ height:64, background: S.base, borderBottom:`1px solid ${S.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0, zIndex:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:8 }}>
        <img src="/CFlogo.svg" width="28" height="28" />
        <span style={{ fontSize:16, fontWeight:800, letterSpacing:-0.5 }}>Creature Feature</span>
      </div>

      <NavPill active={location.pathname === "/"} onClick={() => navigate("/")}>
        Home
      </NavPill>
      <NavPill active={location.pathname === "/discover"} onClick={() => navigate("/discover")}>
        Discover
      </NavPill>

      <div style={{ flex:1, maxWidth:360, margin:"0 16px" }}>
        <div style={{ background: S.elevated, borderRadius:24, padding:"8px 16px", display:"flex", alignItems:"center", gap:8, border:`1px solid ${S.border}` }}>
          <span style={{ color: S.muted, fontSize:14 }}></span>
          <span style={{ color: S.dim, fontSize:13 }}>🔍︎ Search creatures...</span>
        </div>
      </div>

      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background: S.green, overflow:"hidden", cursor:"pointer" }} onClick={() => setMenuOpen((o) => !o)}>
          {profile?.image
            ? <img src={profile.image} style={{ width:"100%", height:"100%" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>
                {profile?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
          }
        </div>
                {menuOpen && (
          <div style={{
            position: "absolute", top: 44, right: 0,
            background: S.card, borderRadius: 8, padding: "8px 0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)", minWidth: 160, zIndex: 100,
          }}>
            <div
              onClick={() => window.location.href = "http://localhost:3000/auth/logout"}
              style={{
                padding: "10px 16px", cursor: "pointer", fontSize: 13,
                color: S.muted, display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = S.white)}
              onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
            >
              Switch Account
            </div>
          </div>
        )}
      </div>
    </div>
  );
}