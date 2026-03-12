// games/singingDucks/components.tsx
import type { ActiveNote, DuckKey, DuckState } from "./types";
import { HIT_ZONE, DUCK_IMAGES } from "./types";

// Ripple
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
          border:"2px solid rgba(126, 231, 126, 0.94)",
          animation:`ripple 0.6s ease-out ${i*0.1}s forwards`,
        }} />
      ))}
    </div>
  );
}


// NoteColumn handles notes and the hit zone line. It receives the active notes for its lane and renders them accordingly. Missed notes are styled differently to provide feedback to the player. The hit zone is a static line that indicates where players should aim to hit the notes.
export function NoteColumn({ notes }: { notes: ActiveNote[] }) {
  return (
    <div style={{ position:"absolute", bottom:110, left:"50%", transform:"translateX(-50%)", width:28, height:220, pointerEvents:"none" }}>
      {notes.map(note => (
        <div key={note.id} style={{
          position:"absolute", top:`${note.y}%`,
          left:"50%", transform:"translateX(-50%)",
          width:28, height:28,
          background: note.missed ? "rgba(255,60,60,0.3)" : "#1db954",
          borderRadius:"50%",
          border: note.missed ? "2px solid #ff4444" : "2px solid #fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, color: note.missed ? "#ff4444" : "#1a1a1a",
          boxShadow: note.missed ? "none" : "0 0 8px #1ed760",
        }}>♪</div>
      ))}
      <div style={{ position:"absolute", top:`${HIT_ZONE}%`, left:"50%", transform:"translateX(-50%)", width:38, height:4, borderRadius:2, background:"rgba(255,255,255,0.4)", boxShadow:"0 0 6px rgba(255,255,255,0.6)" }} />
    </div>
  );
}

// DuckLane
export function DuckLane({ duckKey, duckState, notes, onPress }: {
  duckKey:   DuckKey;
  duckState: DuckState;
  notes:     ActiveNote[];
  onPress:   (key: DuckKey) => void;
}) {
  return (
    <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", width:90 }}>
      <NoteColumn notes={notes} />
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
          background: duckState==="singing" ? "#72bd8c" : "rgba(255,255,255,0.15)",
          border:     duckState==="singing" ? "2px solid #61d188" : "2px solid rgba(255,255,255,0.4)",
          backdropFilter:"blur(4px)", color:"white", fontSize:13,
          fontFamily:"inherit", cursor:"pointer",
          boxShadow: duckState==="singing" ? "0 0 16px #67bb84" : "none",
          transform:  duckState==="singing" ? "scale(0.92)" : "scale(1)",
          transition: "all 0.1s",
          display:"flex", alignItems:"center", justifyContent:"center", gap:0,
        }}
      >
        {duckKey} <span style={{ fontSize:10, opacity:0.8 }}></span>
      </button>
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
export function Scoreboard({ score, combo, songName }: { score: number; combo: number; songName?: string }) {
  return (
    <div style={{ position:"relative", zIndex:10, marginTop:16, background:"#191414", border:"4px solid #535353", borderRadius:8, padding:"10px 20px", boxShadow:"0 0 0 2px  #535353, 4px 4px 0 #000", minWidth:220, textAlign:"center", backdropFilter:"blur(6px)" }}>
      <div style={{ display:"flex", justifyContent:"space-around", gap:24 }}>
        <div>
          <span style={{ fontSize:9, color:"#1db954" }}>SCORE</span>
          <div style={{ fontSize:16, color:"#ffffff", marginTop:2 }}>{score}</div>
        </div>
        <div>
          <span style={{ fontSize:9, color:"#1db954" }}>COMBO</span>
          <div style={{ fontSize:16, color:combo>=5?"#66ffaa":combo>=3?"#ff9944":"#fff", marginTop:2 }}>{combo}x</div>
        </div>
      </div>
      {songName && <div style={{ fontSize:7, color:"#b3b3b3", marginTop:6, letterSpacing:1 }}>{songName.length > 30 ? songName.substring(0, 30) + "…" : songName}</div>}
    </div>
  );
}

// ── OverlayScreen ─────────────────────────────────────────────────────────────
// Change the props:
export function OverlayScreen({ phase, loadError, songName, score, maxCombo, maxPossibleScore, onStart, onCollect }: {
  phase:            string;
  loadError:        string | null;
  songName?:        string;
  score:            number;
  maxCombo:         number;
  maxPossibleScore: number;
  onStart:          () => void;
  onCollect:        () => void;
}) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,30,0.7)", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#191414", border:"4px solid #535353", borderRadius:12, padding:"28px 36px", textAlign:"center", boxShadow:"0 0 0 2px #535353, 6px 6px 0 #000", maxWidth:300 }}>

        {phase === "loading" && (
          <>
            <div style={{ fontSize:11, color:"#1db954", marginBottom:12, lineHeight:2 }}>Singing Ducks</div>
            {loadError
              ? <div style={{ fontSize:7, color:"#ff6666", lineHeight:2 }}>{loadError}</div>
              : <div style={{ fontSize:7, color:"#535353", lineHeight:2 }}>Analysing song…</div>
            }
          </>
        )}

        {phase === "ready" && (
          <>
            <div style={{ fontSize:11, color:"#1db954", marginBottom:8, lineHeight:2 }}>Singing Ducks</div>
            {songName && <div style={{ fontSize:8, color:"#535353", marginBottom:4, lineHeight:2 }}>{songName}</div>}
            <div style={{ fontSize:7, color:"#535353", marginBottom:20, lineHeight:2 }}>Press A, S, D when notes<br/>hit the white line!</div>
            <button onClick={onStart} style={{ background:"#1ed760", border:"3px solid #1ed760", borderRadius:6, padding:"10px 24px", fontSize:10, fontFamily:"inherit", cursor:"pointer", color:"#1a1a1a", boxShadow:"3px 3px 0 #000" }}>START</button>
            <div style={{ fontSize:7, color:"#535353", marginTop:10 }}>or press Space</div>
          </>
        )}

        {phase === "gameover" && (() => {
            const won = maxPossibleScore > 0 && score >= maxPossibleScore * 0.4;
            return (
                <>
                <div style={{ fontSize:10, color: won ? "#1db954" : "#ff4444", marginBottom:8 }}>
                    {won ? "Congratulations, you got it!" : "So close!"}
                </div>
                <div style={{ fontSize:7, color:"#535353", marginBottom:12, lineHeight:2 }}>
                    {won
                    ? `${songName ?? "This song"} is yours!`
                    : "You needed 40% to unlock the creature"}
                </div>
                <div style={{ fontSize:8, color:"#1db954", marginBottom:4 }}>Score</div>
                <div style={{ fontSize:20, color:"#fff", marginBottom:8 }}>{score}</div>
                <div style={{ fontSize:8, color:"#fff", marginBottom:4 }}>Best Combo</div>
                <div style={{ fontSize:14, color:"#66ffaa", marginBottom:20 }}>{maxCombo}x</div>
                <button onClick={won ? onCollect : onStart} style={{ background: won ? "#1db954" : "#1ed760", border: won ? "3px solid #00cc4e" : "3px solid #1ed760", borderRadius:6, padding:"10px 24px", fontSize:10, fontFamily:"inherit", cursor:"pointer", color:"#1a1a1a", boxShadow:"3px 3px 0 #000" }}>
                    {won ? " Collect" : " Retry"}
                </button>
                </>
            );
            })()}

      </div>
    </div>
  );
}