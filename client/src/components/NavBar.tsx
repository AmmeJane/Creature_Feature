import { useLocation, useNavigate } from "react-router-dom";
import { S } from "../constants/colours";
import { NavPill } from "./ui/primitives";

interface NavBarProps {
  tick: number;
}

export function NavBar({ tick }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

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
          <span style={{ color: S.muted, fontSize:14 }}>🔍</span>
          <span style={{ color: S.dim, fontSize:13 }}>Search creatures...</span>
        </div>
      </div>

      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ color: S.muted, fontSize:11, letterSpacing:1 }}>TICK {String(tick).padStart(4, "0")}</span>
        <div style={{ width:1, height:20, background: S.border }} />
        <div style={{ width:32, height:32, borderRadius:"50%", background: S.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          D
        </div>
      </div>
    </div>
  );
}