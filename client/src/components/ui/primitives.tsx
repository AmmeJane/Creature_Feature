import { S } from "../../constants/colours";

export function NavPill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{ background: active ? S.white : S.elevated, border:"none", borderRadius:20, padding:"6px 14px", color: active ? S.black : S.white, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

export function FilterPill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{ background: active ? S.white : S.subtle, border:"none", borderRadius:12, padding:"4px 12px", color: active ? S.black : S.white, fontSize:11, fontWeight:600, cursor:"pointer" }}>
      {children}
    </button>
  );
}

export function SpotifyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:10, color: S.muted, letterSpacing:0.5 }}>{label}</span>
        <span style={{ fontSize:10, color, fontWeight:600 }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height:3, background: S.border, borderRadius:2 }}>
        <div style={{ height:"100%", width:`${value * 100}%`, background: color, borderRadius:2, transition:"width 0.4s" }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, color, isText }: { label: string; value: any; color: string; unit?: string; isText?: boolean }) {
  return (
    <div style={{ background: S.card, borderRadius:6, padding:"10px 12px" }}>
      <div style={{ fontSize:9, color: S.dim, letterSpacing:1, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize: isText ? 12 : 18, fontWeight:700, color, textTransform: isText ? "capitalize" : "none" }}>{value}</div>
    </div>
  );
}

export function ControlBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{ background:"none", border:"none", color: S.muted, fontSize:16, cursor:"pointer", padding:4, transition:"color 0.15s" }}
      onMouseEnter={e => ((e.target as HTMLButtonElement).style.color = S.white)}
      onMouseLeave={e => ((e.target as HTMLButtonElement).style.color = S.muted)}>
      {children}
    </button>
  );
}