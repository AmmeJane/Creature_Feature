// games/singingDucks/components.tsx
import type { ActiveNote, DuckKey, DuckState } from "./types";
import { HIT_ZONE, DUCK_IMAGES } from "./types";

// ── Ripple ────────────────────────────────────────────────────────────────────
export function Ripple({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", width:90, height:20, pointerEvents:"none" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:"absolute", left:"50%", top:"50%",
          transform:"translate(-50%,-50%)",
          width:40+i*22, height:10+i*4,
          borderRadius:"50%",
          border:"2px solid rgba(100,200,255,0.6)",
          animation:`ripple 0.6s ease-out ${i*0.1}s forwards`,
        }} />
      ))}
    </div>
  );
}

// ── LilyPad ───────────────────────────────────────────────────────────────────
export function LilyPad() {
  return (
    <div style={{ width:80, height:28, background:"radial-gradient(ellipse, #4caf50 60%, #2e7d32 100%)", borderRadius:"50%", position:"relative", zIndex:3, boxShadow:"0 4px 8px rgba(0,0,0,0.3)", marginBottom:-4 }}>
      <div style={{ position:"absolute", top:6, left:12, width:56, height:16, background:"rgba(100,200,80,0.3)", borderRadius:"50%", transform:"rotate(-10deg)" }} />
    </div>
  );
}

// ── NoteColumn ────────────────────────────────────────────────────────────────
export function NoteColumn({ notes }: { notes: ActiveNote[] }) {
  return (
    <div style={{ position:"absolute", bottom:110, left:"50%", transform:"translateX(-50%)", width:28, height:220, pointerEvents:"none" }}>
      {notes.map(note => (
        <div key={note.id} style={{
          position:"absolute", top:`${note.y}%`,
          left:"50%", transform:"translateX(-50%)",
          width:28, height:28,
          background: note.missed ? "rgba(255,60,60,0.3)" : "rgba(255,220,60,0.92)",
          borderRadius:"50%",
          border: note.missed ? "2px solid #ff4444" : "2px solid #fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, color: note.missed ? "#ff4444" : "#1a1a1a",
          boxShadow: note.missed ? "none" : "0 0 8px rgba(255,220,60,0.8)",
        }}>♪</div>
      ))}
      <div style={{ position:"absolute", top:`${HIT_ZONE}%`, left:"50%", transform:"translateX(-50%)", width:38, height:4, borderRadius:2, background:"rgba(255,255,255,0.4)", boxShadow:"0 0 6px rgba(255,255,255,0.6)" }} />
    </div>
  );
}

// ── DuckLane ──────────────────────────────────────────────────────────────────
export function DuckLane({ duckKey, duckState, notes, onPress }: {
  duckKey:   DuckKey;
  duckState: DuckState;
  notes:     ActiveNote[];
  onPress:   (key: DuckKey) => void;
}) {
  return (
    <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", width:90 }}>
      <NoteColumn notes={notes} />
      <LilyPad />
      <div style={{
        width:110, height:110, position:"relative", zIndex:4, marginBottom:8,
        animation: duckState==="idle" ? "bobbing 2s ease-in-out infinite" : "none",
        transform:  duckState==="miss" ? "rotate(-15deg)" : "none",
        filter:     duckState==="singing" ? "drop-shadow(0 0 12px rgba(150,220,255,0.9))" : "none",
        transition: "transform 0.1s, filter 0.1s",
      }}>
        <img src={DUCK_IMAGES[duckKey]} alt={duckKey} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
        {duckState === "singing" && (
          <div style={{ position:"absolute", top:-10, right:-8, fontSize:14, animation:"noteFloat1 0.6s ease-out infinite" }}>♪</div>
        )}
        <Ripple active={duckState === "singing"} />
      </div>
      <button
        onPointerDown={() => onPress(duckKey)}
        style={{
          width:44, height:44, borderRadius:8, zIndex:5,
          background: duckState==="singing" ? "rgba(150,220,255,0.9)" : "rgba(255,255,255,0.15)",
          border:     duckState==="singing" ? "2px solid #aaddff" : "2px solid rgba(255,255,255,0.4)",
          backdropFilter:"blur(4px)", color:"white", fontSize:13,
          fontFamily:"inherit", cursor:"pointer",
          boxShadow: duckState==="singing" ? "0 0 16px rgba(150,220,255,0.8)" : "none",
          transform:  duckState==="singing" ? "scale(0.92)" : "scale(1)",
          transition: "all 0.1s",
          display:"flex", alignItems:"center", justifyContent:"center", gap:4,
        }}
      >
        {duckKey} <span style={{ fontSize:10, opacity:0.8 }}>♪</span>
      </button>
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
export function Scoreboard({ score, combo }: { score: number; combo: number }) {
  return (
    <div style={{ position:"relative", zIndex:10, marginTop:16, background:"rgba(10,20,60,0.85)", border:"4px solid #4466cc", borderRadius:8, padding:"10px 20px", boxShadow:"0 0 0 2px #88aaff, 4px 4px 0 #000", minWidth:220, textAlign:"center", backdropFilter:"blur(6px)" }}>
      <div style={{ display:"flex", justifyContent:"space-around", gap:24 }}>
        <div>
          <span style={{ fontSize:9, color:"#aabbff" }}>SCORE</span>
          <div style={{ fontSize:16, color:"#ffe066", marginTop:2 }}>{score}</div>
        </div>
        <div>
          <span style={{ fontSize:9, color:"#aabbff" }}>COMBO</span>
          <div style={{ fontSize:16, color:combo>=5?"#ff6644":combo>=3?"#ff9944":"#66ffaa", marginTop:2 }}>{combo}x</div>
        </div>
      </div>
      <div style={{ fontSize:7, color:"#8899cc", marginTop:6, letterSpacing:1 }}>VIVALDI WINTER ❄️</div>
    </div>
  );
}

// ── OverlayScreen ─────────────────────────────────────────────────────────────
export function OverlayScreen({ gameState, score, maxCombo, onStart }: {
  gameState: string;
  score:     number;
  maxCombo:  number;
  onStart:   () => void;
}) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,30,0.7)", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#0a1440", border:"4px solid #4466cc", borderRadius:12, padding:"28px 36px", textAlign:"center", boxShadow:"0 0 0 2px #88aaff, 6px 6px 0 #000", maxWidth:300 }}>
        {gameState === "idle" ? (
          <>
            <div style={{ fontSize:11, color:"#ffe066", marginBottom:8, lineHeight:2 }}>🦆 SINGING DUCKS 🦆</div>
            <div style={{ fontSize:8, color:"#aaddff", marginBottom:4, lineHeight:2 }}>❄️ Vivaldi — Winter ❄️</div>
            <div style={{ fontSize:7, color:"#aabbff", marginBottom:20, lineHeight:2 }}>Press A, S, D when notes<br/>hit the white line!</div>
            <button onClick={onStart} style={{ background:"#ffe066", border:"3px solid #cc9900", borderRadius:6, padding:"10px 24px", fontSize:10, fontFamily:"inherit", cursor:"pointer", color:"#1a1a1a", boxShadow:"3px 3px 0 #000" }}>▶ START</button>
            <div style={{ fontSize:7, color:"#556688", marginTop:10 }}>or press SPACE</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:10, color:"#ffe066", marginBottom:16 }}>GAME OVER!</div>
            <div style={{ fontSize:8, color:"#aabbff", marginBottom:4 }}>SCORE</div>
            <div style={{ fontSize:20, color:"#ffe066", marginBottom:8 }}>{score}</div>
            <div style={{ fontSize:8, color:"#aabbff", marginBottom:4 }}>BEST COMBO</div>
            <div style={{ fontSize:14, color:"#66ffaa", marginBottom:20 }}>{maxCombo}x</div>
            <button onClick={onStart} style={{ background:"#ffe066", border:"3px solid #cc9900", borderRadius:6, padding:"10px 24px", fontSize:10, fontFamily:"inherit", cursor:"pointer", color:"#1a1a1a", boxShadow:"3px 3px 0 #000" }}>↺ RETRY</button>
          </>
        )}
      </div>
    </div>
  );
}