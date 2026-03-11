import { useRef, useState } from "react";
import { useCreatures } from "../hooks/useCreatures";
import { useThreeScene } from "../hooks/useThreeScene";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { NowPlaying } from "../components/NowPlaying";
import { BottomBar } from "../components/BottomBar";
import { S } from "../constants/colours";
import { geneToColourHex } from "../components/creatures/ProceduralCreature";
import { CreatureCrate } from "../components/creatures/CreatureCrate";

export function Home() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<string | null>(null);

  const [selected,  setSelected]  = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const SHOW_CRATE = true;

  const {
    snapshots, snapshotsRef, typeMapRef,
    loading, error,
    running, setRunning,
    tick, spawning,
    spawnCreature, removeCreature, changeCreatureState,
    newCreature, clearNewCreature, confirmNewCreature,
  } = useCreatures();

  const handleSelect = (id: string | null) => {
    setSelected(id);
    selectedRef.current = id;
  };
  const handleDeselect = () => handleSelect(null);

  useThreeScene({
    canvasRef, snapshotsRef, selectedRef, snapshots, typeMapRef, loading,
    onCreatureClick: (id) => {
      if (id) handleSelect(id);
    },
  });

  const sel     = snapshots.find((c) => c.id === selected) ?? null;
  const selType = sel ? (typeMapRef.current[sel.id] ?? "mammal") : null;
  const selColour = sel ? geneToColourHex(sel.genes.colour) : null;

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

          {/* Colour wash at top based on selected creature */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:120, background:`linear-gradient(to bottom, ${selColour ? selColour + "33" : "#1DB95422"}, transparent)`, zIndex:1, pointerEvents:"none", transition:"background 0.5s" }} />

          <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block", cursor:"pointer" }} />

          {/* Floating name tag above selected creature */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2 }}>
            {sel && (() => {
              // Map creature world pos to screen percent (approximate)
              const px = 50 + ((sel.x ?? 0) / 14) * 38;
              const py = 48 - ((sel.y ?? 0) / 14) * 20;
              return (
                <div key={sel.id} style={{ position:"absolute", left:`${px}%`, top:`${py}%`, transform:"translate(-50%, -180%)", pointerEvents:"none" }}>
                  <div style={{ fontSize:11, fontWeight:700, color: S.white, background: `${selColour}dd`, padding:"4px 10px", borderRadius:12, border:`1px solid ${selColour}`, backdropFilter:"blur(6px)", whiteSpace:"nowrap", boxShadow:`0 0 16px ${selColour}88`, letterSpacing:0.3 }}>
                    {sel.name}
                  </div>
                  {/* Arrow pointing down */}
                  <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:`6px solid ${selColour}dd`, margin:"0 auto" }} />
                </div>
              );
            })()}
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

      {/* New creature crate popup */}
      {newCreature && (() => {
        const nc = newCreature;
        const colour = geneToColourHex(nc.genes.colour);
        const type = typeMapRef.current[nc.id] ?? "mammal";

        if (!SHOW_CRATE) {
          confirmNewCreature();
          return null;
        }

        return (
          <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)" }}>
            <div style={{ background: S.elevated, border:`1px solid ${colour}33`, borderRadius:20, padding:"24px 24px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:4, boxShadow:`0 0 80px ${colour}33` }}>
              <div style={{ fontSize:11, fontWeight:700, color: S.muted, letterSpacing:2, marginBottom:8 }}>NEW CREATURE</div>
              <CreatureCrate
                creature={nc}
                creatureType={type}
                onConfirm={confirmNewCreature}
              />
            </div>
          </div>
        );
      })()}

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