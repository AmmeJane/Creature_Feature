import { useRef, useState } from "react";
import { useCreatures } from "../hooks/useCreatures";
import { useThreeScene } from "../hooks/useThreeScene";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { NowPlaying } from "../components/NowPlaying";
import { BottomBar } from "../components/BottomBar";
import { S, COLOUR_HEX } from "../constants/colours";

export function Home() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<string | null>(null);

  const [selected,  setSelected]  = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const {
    snapshots, snapshotsRef, typeMapRef,
    loading, error,
    running, setRunning,
    tick, spawning,
    spawnCreature, removeCreature, changeCreatureState,
  } = useCreatures();

  const handleSelect = (id: string) => {
    setSelected(id);
    selectedRef.current = id;
  };
  const handleDeselect = () => {
    setSelected(null);
    selectedRef.current = null;
  };

  useThreeScene({ canvasRef, snapshotsRef, selectedRef, snapshots, typeMapRef, loading });

  const sel     = snapshots.find((c) => c.id === selected) ?? null;
  const selType = sel ? (typeMapRef.current[sel.id] ?? "raptor") : null;

  return (
    <div style={{ width:"100vw", height:"100vh", background: S.black, fontFamily: S.font, display:"flex", flexDirection:"column", overflow:"hidden", color: S.white }}>

      {loading && (
        <div style={{ position:"absolute", inset:0, background: S.black, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, zIndex:100 }}>
          <div style={{ width:40, height:40, border:`3px solid ${S.border}`, borderTop:`3px solid ${S.green}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <span style={{ color: S.muted, fontSize:13 }}>Loading your herd...</span>
        </div>
      )}

      {error && (
        <div style={{ position:"absolute", inset:0, background: S.black, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, zIndex:100 }}>
          <span style={{ fontSize:32 }}>⚠️</span>
          <span style={{ color:"#E91429", fontSize:14 }}>{error}</span>
        </div>
      )}

      <NavBar tick={tick} />

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <Sidebar
          snapshots={snapshots}
          selected={selected}
          hoveredId={hoveredId}
          typeMapRef={typeMapRef}
          spawning={spawning}
          onSelect={handleSelect}
          onHover={setHoveredId}
          onSpawn={spawnCreature}
        />

        {/* Canvas */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background: S.black }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:120, background:`linear-gradient(to bottom, ${sel ? (COLOUR_HEX[sel.colour] ?? "#1DB954") + "33" : "#1DB95422"}, transparent)`, zIndex:1, pointerEvents:"none", transition:"background 0.5s" }} />
          <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block" }} />

          {/* Label — selected creature only */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2 }}>
            {snapshots.filter((c) => c.id === selected).map((c) => {
              const px = 50 + ((c.x ?? 0) / 10) * 32;
              const py = 52 - ((c.y ?? 0) / 8) * 22;
              return (
                <div key={c.id} style={{ position:"absolute", left:`${px}%`, top:`${py}%`, transform:"translate(-50%,-160%)", pointerEvents:"none" }}>
                  <div style={{ fontSize:10, fontWeight:600, color: S.white, background:`${COLOUR_HEX[c.colour]}dd`, padding:"3px 8px", borderRadius:12, border:`1px solid ${COLOUR_HEX[c.colour]}`, backdropFilter:"blur(6px)", whiteSpace:"nowrap", boxShadow:`0 0 14px ${COLOUR_HEX[c.colour]}66` }} />
                </div>
              );
            })}
          </div>
        </div>

        {sel && selType && (
          <NowPlaying
            sel={sel}
            selType={selType}
            onClose={handleDeselect}
            onRemove={(id) => { removeCreature(id); handleDeselect(); }}
            onChangeState={changeCreatureState}
          />
        )}
      </div>

      <BottomBar
        sel={sel}
        selType={selType}
        tick={tick}
        running={running}
        spawning={spawning}
        count={snapshots.length}
        onToggleRun={() => setRunning((r) => !r)}
        onSpawn={spawnCreature}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes bar0 { from { height: 40% } to { height: 90% } }
        @keyframes bar1 { from { height: 70% } to { height: 30% } }
        @keyframes bar2 { from { height: 50% } to { height: 100% } }
        @keyframes bar3 { from { height: 90% } to { height: 40% } }
        @keyframes bar4 { from { height: 30% } to { height: 70% } }
        @keyframes spin  { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}