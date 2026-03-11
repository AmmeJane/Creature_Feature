import { useState, useEffect, useCallback, useRef } from "react";
import type { MiniGameProps } from "./types";
import ben from "../pictures/benimage.png";
import gernot from "../pictures/gernotimage.png";
import bes from "../pictures/benright.png";

// ── Types ─────────────────────────────────────────────────────────────────────
type DuckKey    = "A" | "S" | "D";
type DuckState  = "idle" | "singing" | "miss";

interface ActiveNote {
  id:      number;
  duckKey: DuckKey;
  y:       number;
  hit:     boolean;
  missed:  boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────
const HIT_ZONE       = 82;
const HIT_TOLERANCE  = 12;
const NOTE_SPEED     = 18;

const DUCK_IMAGES: Record<DuckKey, string> = {
  A: "../pictures/benimage.png",
  S: "../pictures/gernotimage.png",
  D: "../pictures/benright.png",
};

const SONG: [DuckKey, number][] = [
  ["A", 0],   ["S", 100], ["D", 300], ["A", 300],
  ["S", 400], ["D", 200], ["A", 200], ["S", 400],
  ["D", 300], ["A", 300], ["S", 200], ["D", 400],
  ["A", 300], ["A", 200], ["S", 300], ["D", 400],
  ["S", 300], ["A", 300], ["D", 200], ["S", 200],
  ["A", 400], ["D", 300], ["S", 300], ["A", 200],
  ["D", 900], ["S", 600], ["A", 700], ["D", 100],
  ["S", 400], ["A", 200], ["D", 300], ["S", 300],
  ["A", 200], ["S", 200], ["D", 400], ["A", 300],
  ["S", 300], ["D", 200], ["A", 400], ["S", 300],
];


// ── Sub-components ────────────────────────────────────────────────────────────
function Ripple({ active }: { active: boolean }) {
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


function LilyPad() {
  return (
    <div style={{ width:80, height:28, background:"radial-gradient(ellipse, #4caf50 60%, #2e7d32 100%)", borderRadius:"50%", position:"relative", zIndex:3, boxShadow:"0 4px 8px rgba(0,0,0,0.3)", marginBottom:-4 }}>
      <div style={{ position:"absolute", top:6, left:12, width:56, height:16, background:"rgba(100,200,80,0.3)", borderRadius:"50%", transform:"rotate(-10deg)" }} />
    </div>
  );
}

function NoteColumn({ notes }: { notes: ActiveNote[] }) {
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

function Scoreboard({ score, combo }: { score: number; combo: number }) {
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

function OverlayScreen({ gameState, score, maxCombo, onStart }: { gameState:string; score:number; maxCombo:number; onStart:()=>void }) {
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

// ── Main component ────────────────────────────────────────────────────────────
export function Singing({ onScore }: MiniGameProps) {
  const [score,       setScore]       = useState(0);
  const [combo,       setCombo]       = useState(0);
  const [maxCombo,    setMaxCombo]    = useState(0);
  const [duckStates,  setDuckStates]  = useState<Record<DuckKey, DuckState>>({ A:"idle", S:"idle", D:"idle" });
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const [feedback,    setFeedback]    = useState<{ text:string; colour:string; id:number } | null>(null);
  const [gameState,   setGameState]   = useState<"idle"|"playing"|"gameover">("idle");

  const rafRef         = useRef<number>(0);
  const lastTimeRef    = useRef<number>(0);
  const noteIdRef      = useRef(0);
  const comboRef       = useRef(0);
  const gameStateRef   = useRef<"idle"|"playing"|"gameover">("idle");
  const timeoutsRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef       = useRef<HTMLAudioElement | null>(null);

  comboRef.current     = combo;
  gameStateRef.current = gameState;

  // ── Animation loop ─────────────────────────────────────────────────────────
  const animate = useCallback((time: number) => {
    if (gameStateRef.current !== "playing") return;
    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = time;
    setActiveNotes(prev =>
      prev
        .map(n => ({ ...n, y: n.y + NOTE_SPEED * dt }))
        .map(n => {
          if (!n.hit && !n.missed && n.y > HIT_ZONE + HIT_TOLERANCE) {
            comboRef.current = 0;
            setCombo(0);
            setFeedback({ text:"MISS", colour:"#ff4444", id:Date.now() });
            setDuckStates(ds => ({ ...ds, [n.duckKey]:"miss" }));
            setTimeout(() => setDuckStates(ds => ({ ...ds, [n.duckKey]:"idle" })), 300);
            return { ...n, missed:true };
          }
          return n;
        })
        .filter(n => n.y < 115)
    );
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    // clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setScore(0); setCombo(0); setMaxCombo(0);
    setActiveNotes([]);
    setDuckStates({ A:"idle", S:"idle", D:"idle" });
    setGameState("playing");
    gameStateRef.current = "playing";
    lastTimeRef.current  = 0;

    // ── Start audio ──────────────────────────────────────────────────────────
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {}); // catch autoplay block
    }

    // ── Schedule notes based on song timing ──────────────────────────────────
    let elapsed = 500; // small delay before first note
    SONG.forEach(([key, delay]) => {
      elapsed += delay;
      const t = setTimeout(() => {
        if (gameStateRef.current !== "playing") return;
        const id = noteIdRef.current++;
        setActiveNotes(prev => [...prev, { id, duckKey:key, y:0, hit:false, missed:false }]);
      }, elapsed);
      timeoutsRef.current.push(t);
    });

    rafRef.current = requestAnimationFrame(animate);

    // end game
    const totalDuration = elapsed + 3000;
    const endT = setTimeout(() => {
      setGameState("gameover");
      gameStateRef.current = "gameover";
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      setScore(s => { onScore?.(s); return s; });
    }, totalDuration);
    timeoutsRef.current.push(endT);
  }, [animate, onScore]);

  // ── Handle key press ───────────────────────────────────────────────────────
  const handleKey = useCallback((key: DuckKey) => {
    if (gameStateRef.current !== "playing") return;
    setActiveNotes(prev => {
      const candidates = prev.filter(n => n.duckKey===key && !n.hit && !n.missed && Math.abs(n.y-HIT_ZONE)<=HIT_TOLERANCE);
      if (!candidates.length) {
        setCombo(0); comboRef.current = 0;
        setFeedback({ text:"MISS", colour:"#ff4444", id:Date.now() });
        return prev;
      }
      const target   = candidates.reduce((a,b) => Math.abs(a.y-HIT_ZONE)<Math.abs(b.y-HIT_ZONE)?a:b);
      const perfect  = Math.abs(target.y-HIT_ZONE) < 4;
      const newCombo = comboRef.current + 1;
      const points   = (perfect ? 100 : 50) + Math.floor(newCombo/3)*10;
      comboRef.current = newCombo;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setScore(s => s + points);
      setFeedback({ text:perfect?"PERFECT!":"GOOD", colour:perfect?"#ffe066":"#66ff99", id:Date.now() });
      setDuckStates(ds => ({ ...ds, [key]:"singing" }));
      setTimeout(() => setDuckStates(ds => ({ ...ds, [key]:"idle" })), 350);
      return prev.map(n => n.id===target.id ? { ...n, hit:true } : n);
    });
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k==="A") handleKey("A");
      if (k==="S") handleKey("S");
      if (k==="D") handleKey("D");
      if (e.key===" " && gameState!=="playing") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey, startGame, gameState]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    audioRef.current?.pause();
  }, []);

  return (
    <div style={{ width:"100%", height:"100%", minHeight:520, position:"relative", overflow:"hidden", userSelect:"none", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Press Start 2P','Courier New',monospace" }}>

      {/* ── Audio element ───────────────────────────────────────────────────── */}
      <audio ref={audioRef} src="/audio/vivaldi-winter.mp3" loop={false} preload="auto" />

      {/* ── Winter background ───────────────────────────────────────────────── */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, #0a1628 0%, #1a3a6e 30%, #2a5a9e 55%, #3a7acc 65%, #4a9ad8 100%)", zIndex:0 }} />

      {/* Snowflakes */}
      <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${Math.random()*100}%`,
            top:`${Math.random()*100}%`,
            width: 4+Math.random()*6,
            height: 4+Math.random()*6,
            borderRadius:"50%",
            background:"rgba(255,255,255,0.8)",
            animation:`snowfall ${4+Math.random()*6}s linear ${Math.random()*5}s infinite`,
          }} />
        ))}
      </div>

      {/* Frozen pond */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"45%", background:"linear-gradient(180deg,#6ab8d4 0%,#4a8faa 40%,#2a6080 100%)", zIndex:2 }}>
        {/* Ice cracks */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.3 }} viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M50,20 L80,60 L120,40 L160,80" stroke="white" strokeWidth="1" fill="none"/>
          <path d="M200,10 L220,50 L260,30 L300,70" stroke="white" strokeWidth="1" fill="none"/>
          <path d="M300,40 L330,80 L360,50" stroke="white" strokeWidth="1" fill="none"/>
          <ellipse cx="150" cy="100" rx="60" ry="20" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.1)"/>
          <ellipse cx="280" cy="120" rx="45" ry="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.1)"/>
        </svg>
      </div>

      {/* Snowy ground */}
      <div style={{ position:"absolute", bottom:"43%", left:0, right:0, height:18, background:"white", zIndex:3, borderRadius:"50% 50% 0 0" }} />

      {/* Snowy trees */}
      {[[-2,18],[94,16]].map(([x,y],i) => (
        <div key={i} style={{ position:"absolute", left:`${x}%`, top:`${y}%`, zIndex:3 }}>
          <div style={{ width:0, height:0, borderLeft:"30px solid transparent", borderRight:"30px solid transparent", borderBottom:"55px solid #2d5a27" }} />
          <div style={{ position:"absolute", top:0, left:0, width:0, height:0, borderLeft:"30px solid transparent", borderRight:"30px solid transparent", borderBottom:"55px solid rgba(255,255,255,0.4)" }} />
          <div style={{ width:0, height:0, borderLeft:"22px solid transparent", borderRight:"22px solid transparent", borderBottom:"42px solid #3a7a35", marginTop:-22, marginLeft:8 }} />
          <div style={{ position:"absolute", top:0, left:8, width:0, height:0, borderLeft:"22px solid transparent", borderRight:"22px solid transparent", borderBottom:"42px solid rgba(255,255,255,0.35)", marginTop:-22 }} />
          <div style={{ width:14, height:20, background:"#5a3010", margin:"0 auto" }} />
        </div>
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes ripple      { to { transform:translate(-50%,-50%) scale(2.2); opacity:0; } }
        @keyframes noteFloat1  { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(4px,-12px);opacity:0} }
        @keyframes feedbackPop { 0%{transform:translateX(-50%) scale(0.5);opacity:0} 20%{transform:translateX(-50%) scale(1.2);opacity:1} 70%{opacity:1} 100%{opacity:0} }
        @keyframes bobbing     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes snowfall    { 0%{transform:translateY(-10px) rotate(0deg);opacity:0.8} 100%{transform:translateY(100vh) rotate(360deg);opacity:0} }
        @keyframes shimmer     { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
      `}</style>

      <Scoreboard score={score} combo={combo} />

      {/* Duck lanes */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"45%", zIndex:4, display:"flex", justifyContent:"space-around", alignItems:"flex-end", padding:"0 8%" }}>
        {(["A","S","D"] as DuckKey[]).map(key => {
          const ds        = duckStates[key];
          const laneNotes = activeNotes.filter(n => n.duckKey===key && !n.hit);
          return (
            <div key={key} style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", width:90 }}>
              <NoteColumn notes={laneNotes} />
              <LilyPad />
              {/* Duck */}
              <div style={{ width:110, height:110, position:"relative", zIndex:4, marginBottom:8,
                animation: ds==="idle" ? "bobbing 2s ease-in-out infinite" : "none",
                transform: ds==="miss" ? "rotate(-15deg)" : "none",
                filter: ds==="singing" ? "drop-shadow(0 0 12px rgba(150,220,255,0.9))" : "none",
                transition:"transform 0.1s, filter 0.1s",
              }}>
                <img src={DUCK_IMAGES[key]} alt={key} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                {ds==="singing" && (
                  <div style={{ position:"absolute", top:-10, right:-8, fontSize:14, animation:"noteFloat1 0.6s ease-out infinite" }}>♪</div>
                )}
                <Ripple active={ds==="singing"} />
              </div>
              {/* Key button */}
              <button onPointerDown={() => handleKey(key)} style={{
                width:44, height:44, borderRadius:8, zIndex:5,
                background: ds==="singing" ? "rgba(150,220,255,0.9)" : "rgba(255,255,255,0.15)",
                border: ds==="singing" ? "2px solid #aaddff" : "2px solid rgba(255,255,255,0.4)",
                backdropFilter:"blur(4px)", color:"white", fontSize:13, fontFamily:"inherit",
                cursor:"pointer",
                boxShadow: ds==="singing" ? "0 0 16px rgba(150,220,255,0.8)" : "none",
                transform: ds==="singing" ? "scale(0.92)" : "scale(1)",
                transition:"all 0.1s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:4,
              }}>
                {key} <span style={{ fontSize:10, opacity:0.8 }}>♪</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div key={feedback.id} style={{ position:"absolute", top:"28%", left:"50%", fontSize:14, color:feedback.colour, textShadow:"2px 2px 0 #000", zIndex:20, pointerEvents:"none", animation:"feedbackPop 0.7s ease-out forwards", whiteSpace:"nowrap" }}>
          {feedback.text}
        </div>
      )}

      {gameState !== "playing" && (
        <OverlayScreen gameState={gameState} score={score} maxCombo={maxCombo} onStart={startGame} />
      )}
    </div>
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────────
export const singingMeta = {
  id:          "singing-ducks",
  title:       "SINGING DUCKS",
  description: "Hit notes to Vivaldi Winter!",
  emoji:       "🦆",
  controls:    "A / S / D keys",
  component:   Singing,
};