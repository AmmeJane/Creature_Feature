import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Creature } from "./pages/CreatureModel";
import type { CreatureSnapshot } from "./pages/CreatureModel";
import { buildDino, DINO_TYPES, DINO_EMOJI } from "./components/DinoMeshes";
import type { DinoType } from "./components/DinoMeshes";

// ── Design tokens (Spotify DNA) ───────────────────────────────────────────────
const S = {
  green:    "#1DB954",
  greenDim: "#1aa34a",
  black:    "#000000",
  base:     "#121212",
  elevated: "#1A1A1A",
  card:     "#242424",
  cardHov:  "#2A2A2A",
  subtle:   "#2A2A2A",
  border:   "#333333",
  white:    "#FFFFFF",
  muted:    "#A7A7A7",
  dim:      "#6A6A6A",
  font:     "'Circular Std', 'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const COLOUR_HEX: Record<string, string> = {
  red:"#E91429", blue:"#509BF5", green:"#1DB954",
  yellow:"#F59B23", purple:"#BC5900", orange:"#E8400C", cyan:"#148A08"
};

const STATES = ["Idle","Moving","Sleeping","Running"] as const;
type CreatureState = typeof STATES[number];

const STATE_COLOUR: Record<string, string> = {
  Idle: S.dim, Moving: S.green, Sleeping: "#509BF5", Running: "#F59B23"
};

function getDinoType(index: number): DinoType {
  return DINO_TYPES[index % DINO_TYPES.length];
}

function buildScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 18);
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(400 * 3);
  for (let i = 0; i < 400 * 3; i++) starPos[i] = (Math.random() - 0.5) * 80;
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x555555, size: 0.06, transparent: true, opacity: 0.5 })));
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(5, 8, 10);
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0x1DB954, 0.2);
  fill.position.set(-5, -3, 5);
  scene.add(fill);
  const grid = new THREE.GridHelper(28, 28, 0x1a1a1a, 0x1a1a1a);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.5;
  scene.add(grid);
  return { renderer, scene, camera };
}

export default function App() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const sceneRef       = useRef<ReturnType<typeof buildScene> | null>(null);
  const meshMapRef     = useRef<Record<string, { group: THREE.Group }>>({});
  const rafRef         = useRef<number>(0);
  const dinoIndexRef   = useRef<number>(0);
  const instancesRef   = useRef<Creature[]>(Array.from({ length: 6 }, () => new Creature()));
  const dinoTypeMapRef = useRef<Record<string, DinoType>>({});

  instancesRef.current.forEach((c, i) => {
    if (!dinoTypeMapRef.current[c.id]) dinoTypeMapRef.current[c.id] = getDinoType(i);
  });
  dinoIndexRef.current = instancesRef.current.length;

  const [snapshots, setSnapshots] = useState<CreatureSnapshot[]>(() =>
    instancesRef.current.map(c => c.toSnapshot())
  );
  const [selected, setSelected]   = useState<string | null>(null);
  const [tick, setTick]           = useState(0);
  const [running, setRunning]     = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Three.js init ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const built  = buildScene(canvas);
    sceneRef.current = built;
    const { renderer, scene, camera } = built;
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      t += 0.004;
      camera.position.x = Math.sin(t * 0.3) * 0.3;
      camera.position.y = Math.cos(t * 0.2) * 0.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    loop();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); renderer.dispose(); };
  }, []);

  // ── Sync meshes ──────────────────────────────────────────────────────────
  useEffect(() => {
    const { scene } = sceneRef.current ?? {};
    if (!scene) return;
    const meshMap = meshMapRef.current;
    const liveIds = new Set(snapshots.map(c => c.id));
    Object.keys(meshMap).forEach(id => {
      if (!liveIds.has(id)) { scene.remove(meshMap[id].group); delete meshMap[id]; }
    });
    snapshots.forEach(c => {
      const hex      = parseInt(COLOUR_HEX[c.colour].replace("#",""), 16);
      const dinoType = dinoTypeMapRef.current[c.id] ?? "raptor";
      const scale    = 0.4 + (c.size / 5) * 0.5;
      if (!meshMap[c.id]) {
        const group = buildDino(dinoType, hex);
        scene.add(group);
        meshMap[c.id] = { group };
      }
      const { group } = meshMap[c.id];
      group.position.set(c.x ?? 0, c.y ?? 0, 0);
      group.scale.setScalar(scale);
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshPhongMaterial).color.setHex(hex);
          (child.material as THREE.MeshPhongMaterial).emissive.setHex(hex);
          (child.material as THREE.MeshPhongMaterial).emissiveIntensity = c.id === selected ? 0.4 : 0.12;
        }
      });
      const rotSpeed = c.state === "Sleeping" ? 0.002 : c.state === "Running" ? 0.05 : c.state === "Moving" ? 0.02 : 0.006;
      group.rotation.y += rotSpeed;
      if (c.state === "Moving" || c.state === "Running")
        group.position.y += Math.sin(Date.now() * 0.01 + (c.x ?? 0)) * 0.04;
      group.rotation.z = c.state === "Sleeping"
        ? group.rotation.z + (Math.PI / 2.5 - group.rotation.z) * 0.05
        : group.rotation.z + (0 - group.rotation.z) * 0.05;
    });
  }, [snapshots, selected]);

  // ── Tick ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      instancesRef.current.forEach(c => c.update());
      setSnapshots(instancesRef.current.map(c => c.toSnapshot()));
      setTick(t => t + 1);
    }, 60);
    return () => clearInterval(id);
  }, [running]);

  const spawnCreature = useCallback(() => {
    const c = new Creature();
    dinoTypeMapRef.current[c.id] = getDinoType(dinoIndexRef.current++);
    instancesRef.current.push(c);
    setSnapshots(instancesRef.current.map(c => c.toSnapshot()));
  }, []);

  const removeCreature = useCallback((id: string) => {
    instancesRef.current = instancesRef.current.filter(c => c.id !== id);
    setSnapshots(instancesRef.current.map(c => c.toSnapshot()));
    setSelected(s => s === id ? null : s);
  }, []);

  const sel = snapshots.find(c => c.id === selected) ?? null;
  const selDinoType = sel ? (dinoTypeMapRef.current[sel.id] ?? "raptor") : null;

  return (
    <div style={{ width:"100vw", height:"100vh", background: S.black, fontFamily: S.font, display:"flex", flexDirection:"column", overflow:"hidden", color: S.white }}>

      {/* ── Top nav bar ── */}
      <div style={{ height:64, background: S.base, borderBottom:`1px solid ${S.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0, zIndex:10 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:8 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={S.green}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.65c-.2.2-.51.27-.78.17-2.14-1.31-4.83-1.6-8-.88-.31.07-.62-.12-.69-.43-.07-.31.12-.62.43-.69 3.47-.79 6.45-.45 8.84 1.02.25.15.32.48.2.81zm1.24-2.77c-.24.24-.62.31-.94.17-2.45-1.51-6.18-1.94-9.08-1.06-.37.11-.76-.1-.87-.47-.11-.37.1-.76.47-.87 3.31-1 7.42-.52 10.22 1.21.3.18.4.58.2.88v.14zm.11-2.88c-2.94-1.74-7.79-1.9-10.6-1.05-.44.13-.91-.12-1.04-.56-.13-.44.12-.91.56-1.04 3.23-.98 8.59-.79 11.98 1.21.39.23.52.73.29 1.12-.23.38-.73.51-1.19.32z"/>
          </svg>
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:-0.5 }}>DinoStream</span>
        </div>

        {/* Nav pills */}
        <NavPill active>🏠 Home</NavPill>
        <NavPill>🔍 Search</NavPill>

        {/* Search bar */}
        <div style={{ flex:1, maxWidth:360, margin:"0 16px" }}>
          <div style={{ background: S.elevated, borderRadius:24, padding:"8px 16px", display:"flex", alignItems:"center", gap:8, border:`1px solid ${S.border}` }}>
            <span style={{ color: S.muted, fontSize:14 }}>🔍</span>
            <span style={{ color: S.dim, fontSize:13 }}>Search dinosaurs...</span>
          </div>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color: S.muted, fontSize:11, letterSpacing:1 }}>TICK {String(tick).padStart(4,"0")}</span>
          <div style={{ width:1, height:20, background: S.border }} />
          <div style={{ width:32, height:32, borderRadius:"50%", background: S.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, cursor:"pointer" }}>D</div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── Left sidebar ── */}
        <div style={{ width:280, background: S.base, display:"flex", flexDirection:"column", flexShrink:0, borderRight:`1px solid ${S.border}` }}>

          {/* Library header */}
          <div style={{ padding:"20px 16px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:700, color: S.muted, letterSpacing:0.5 }}>YOUR HERD</span>
            <button onClick={spawnCreature} style={{ background: S.green, border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color: S.black, fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>+</button>
          </div>

          {/* Filter pills */}
          <div style={{ padding:"4px 16px 12px", display:"flex", gap:6 }}>
            <FilterPill active>All</FilterPill>
            <FilterPill>Moving</FilterPill>
            <FilterPill>Sleeping</FilterPill>
          </div>

          {/* Creature list */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 8px" }}>
            {snapshots.map((c, i) => {
              const dinoType = dinoTypeMapRef.current[c.id] ?? "raptor";
              const isActive = selected === c.id;
              const isHov    = hoveredId === c.id;
              return (
                <div key={c.id}
                  onClick={() => setSelected(c.id)}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display:"flex", alignItems:"center", gap:12, padding:"8px 8px", borderRadius:6, cursor:"pointer",
                    background: isActive ? S.card : isHov ? S.elevated : "transparent",
                    transition:"background 0.15s",
                    marginBottom:2,
                  }}>
                  {/* Album art style avatar */}
                  <div style={{ width:44, height:44, borderRadius:4, background:`linear-gradient(135deg, ${COLOUR_HEX[c.colour]}88, ${COLOUR_HEX[c.colour]}22)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, border: isActive ? `1px solid ${COLOUR_HEX[c.colour]}` : "1px solid transparent", boxShadow: isActive ? `0 0 12px ${COLOUR_HEX[c.colour]}44` : "none", transition:"all 0.2s" }}>
                    {DINO_EMOJI[dinoType]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isActive ? S.green : S.white, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize:11, color: STATE_COLOUR[c.state], marginTop:1 }}>● {c.state} · {dinoType}</div>
                  </div>
                  {/* Mini bars */}
                  {isActive && (
                    <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:16 }}>
                      {[0.6,1,0.7,0.9,0.5].map((h,i) => (
                        <div key={i} style={{ width:3, height:`${h*100}%`, background: S.green, borderRadius:1, animation:`bar${i} 0.8s ease-in-out infinite alternate`, animationDelay:`${i*0.1}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Centre: canvas ── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background: S.black }}>
          {/* Gradient overlay at top */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:120, background:`linear-gradient(to bottom, ${sel ? COLOUR_HEX[sel.colour] + "33" : "#1DB95422"}, transparent)`, zIndex:1, pointerEvents:"none", transition:"background 0.5s" }} />

          <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block" }} />

          {/* Floating labels */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2 }}>
            {snapshots.map(c => {
              const px = 50 + ((c.x ?? 0) / 10) * 38;
              const py = 50 - ((c.y ?? 0) /  6) * 42;
              const dinoType = dinoTypeMapRef.current[c.id] ?? "raptor";
              const isActive = selected === c.id;
              return (
                <div key={c.id} style={{ position:"absolute", left:`${px}%`, top:`${py}%`, transform:"translate(-50%,-160%)", pointerEvents:"all", cursor:"pointer" }}
                  onClick={() => setSelected(c.id)}>
                  <div style={{
                    fontSize:10, fontWeight:600,
                    color: isActive ? S.white : S.muted,
                    background: isActive ? `${COLOUR_HEX[c.colour]}cc` : "rgba(0,0,0,0.7)",
                    padding:"3px 8px", borderRadius:12,
                    border: isActive ? `1px solid ${COLOUR_HEX[c.colour]}` : "1px solid #333",
                    backdropFilter:"blur(4px)",
                    whiteSpace:"nowrap",
                    boxShadow: isActive ? `0 0 16px ${COLOUR_HEX[c.colour]}66` : "none",
                    transition:"all 0.2s",
                  }}>
                    {DINO_EMOJI[dinoType]} {c.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: Now Playing ── */}
        {sel && selDinoType && (
          <div style={{ width:300, background: S.base, borderLeft:`1px solid ${S.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
            {/* Header */}
            <div style={{ padding:"16px 16px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, fontWeight:700, color: S.muted, letterSpacing:0.5 }}>NOW PLAYING</span>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color: S.dim, cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
            </div>

            {/* Big album art */}
            <div style={{ margin:"16px 16px 12px", borderRadius:8, background:`linear-gradient(135deg, ${COLOUR_HEX[sel.colour]}66, ${COLOUR_HEX[sel.colour]}11)`, aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:80, boxShadow:`0 8px 32px ${COLOUR_HEX[sel.colour]}44` }}>
              {DINO_EMOJI[selDinoType]}
            </div>

            {/* Name + type */}
            <div style={{ padding:"0 16px" }}>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:-0.3 }}>{sel.name}</div>
              <div style={{ fontSize:12, color: S.muted, marginTop:2, textTransform:"capitalize" }}>{selDinoType} · Age {sel.age}</div>
            </div>

            {/* State badge */}
            <div style={{ padding:"10px 16px 0" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background: STATE_COLOUR[sel.state] + "22", border:`1px solid ${STATE_COLOUR[sel.state]}44`, borderRadius:12, padding:"4px 10px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background: STATE_COLOUR[sel.state] }} />
                <span style={{ fontSize:11, fontWeight:600, color: STATE_COLOUR[sel.state] }}>{sel.state.toUpperCase()}</span>
              </div>
            </div>

            {/* Progress-bar style gene bars */}
            <div style={{ padding:"16px 16px 0" }}>
              <div style={{ fontSize:10, fontWeight:700, color: S.muted, letterSpacing:1, marginBottom:10 }}>GENETICS</div>
              <SpotifyBar label="SIZE GENE"   value={sel.genes.size}   color={S.green} />
              <SpotifyBar label="SPEED GENE"  value={sel.genes.speed}  color="#509BF5" />
              <SpotifyBar label="COLOUR GENE" value={sel.genes.colour} color={COLOUR_HEX[sel.colour]} />
            </div>

            {/* Stats grid */}
            <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <StatCard label="SIZE"  value={sel.size}  unit="" color={COLOUR_HEX[sel.colour]} />
              <StatCard label="SPEED" value={sel.speed} unit="" color="#509BF5" />
              <StatCard label="COLOUR" value={sel.colour} unit="" color={COLOUR_HEX[sel.colour]} isText />
              <StatCard label="AGE"   value={sel.age}   unit=" ticks" color={S.muted} />
            </div>

            {/* State controls */}
            <div style={{ padding:"0 16px 8px" }}>
              <div style={{ fontSize:10, fontWeight:700, color: S.muted, letterSpacing:1, marginBottom:8 }}>CONTROL</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {STATES.map(s => (
                  <button key={s}
                    onClick={() => {
                      instancesRef.current.find(c => c.id === sel.id)?.changeState(s);
                      setSnapshots(instancesRef.current.map(c => c.toSnapshot()));
                    }}
                    style={{
                      fontSize:10, fontWeight:600, padding:"5px 12px",
                      background: sel.state === s ? STATE_COLOUR[s] : "transparent",
                      border:`1px solid ${STATE_COLOUR[s]}`,
                      color: sel.state === s ? S.black : STATE_COLOUR[s],
                      borderRadius:12, cursor:"pointer", letterSpacing:0.5,
                      transition:"all 0.15s",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove */}
            <div style={{ padding:"8px 16px 16px", marginTop:"auto" }}>
              <button onClick={() => removeCreature(sel.id)} style={{ width:"100%", background:"transparent", border:`1px solid ${S.border}`, color: S.muted, borderRadius:4, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.15s" }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#E91429"; (e.target as HTMLButtonElement).style.color = "#E91429"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = S.border; (e.target as HTMLButtonElement).style.color = S.muted; }}>
                Remove from Herd
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom playbar ── */}
      <div style={{ height:80, background: S.elevated, borderTop:`1px solid ${S.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:24, flexShrink:0, zIndex:10 }}>
        {/* Left: currently selected */}
        <div style={{ display:"flex", alignItems:"center", gap:12, width:220, flexShrink:0 }}>
          {sel ? (
            <>
              <div style={{ width:48, height:48, borderRadius:4, background:`linear-gradient(135deg, ${COLOUR_HEX[sel.colour]}88, ${COLOUR_HEX[sel.colour]}22)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                {selDinoType ? DINO_EMOJI[selDinoType] : "🦖"}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color: S.white }}>{sel.name}</div>
                <div style={{ fontSize:10, color: S.muted }}>{selDinoType}</div>
              </div>
              <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${S.green}`, marginLeft:4, cursor:"pointer" }} />
            </>
          ) : (
            <div style={{ fontSize:12, color: S.dim }}>Select a dinosaur</div>
          )}
        </div>

        {/* Centre: playback controls */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <ControlBtn>⇄</ControlBtn>
            <ControlBtn>⏮</ControlBtn>
            <button onClick={() => setRunning(r => !r)} style={{ width:36, height:36, borderRadius:"50%", background: S.white, border:"none", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color: S.black, flexShrink:0, transition:"transform 0.1s" }}>
              {running ? "⏸" : "▶"}
            </button>
            <ControlBtn>⏭</ControlBtn>
            <ControlBtn>↺</ControlBtn>
          </div>
          {/* Progress bar */}
          <div style={{ width:"100%", maxWidth:480, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:10, color: S.dim, width:32, textAlign:"right" }}>0:00</span>
            <div style={{ flex:1, height:4, background: S.border, borderRadius:2, cursor:"pointer", position:"relative" }}>
              <div style={{ height:"100%", width:`${(tick % 200) / 2}%`, background: S.green, borderRadius:2, transition:"width 0.1s" }} />
            </div>
            <span style={{ fontSize:10, color: S.dim, width:32 }}>∞</span>
          </div>
        </div>

        {/* Right: volume + count */}
        <div style={{ display:"flex", alignItems:"center", gap:12, width:220, justifyContent:"flex-end", flexShrink:0 }}>
          <span style={{ fontSize:11, color: S.dim }}>{snapshots.length} dinos</span>
          <span style={{ color: S.dim, fontSize:14 }}>🔊</span>
          <div style={{ width:80, height:4, background: S.border, borderRadius:2 }}>
            <div style={{ width:"70%", height:"100%", background: S.muted, borderRadius:2 }} />
          </div>
          <button onClick={spawnCreature} style={{ background: S.green, border:"none", borderRadius:12, padding:"6px 14px", color: S.black, fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:0.5, transition:"transform 0.1s" }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.transform = "scale(1.04)"}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.transform = "scale(1)"}>
            + SPAWN
          </button>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavPill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{ background: active ? S.white : S.elevated, border:"none", borderRadius:20, padding:"6px 14px", color: active ? S.black : S.white, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

function FilterPill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{ background: active ? S.white : S.subtle, border:"none", borderRadius:12, padding:"4px 12px", color: active ? S.black : S.white, fontSize:11, fontWeight:600, cursor:"pointer" }}>
      {children}
    </button>
  );
}

function SpotifyBar({ label, value, color }: { label: string; value: number; color: string }) {
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

function StatCard({ label, value, color, isText }: { label: string; value: any; color: string; unit?: string; isText?: boolean }) {
  return (
    <div style={{ background: S.card, borderRadius:6, padding:"10px 12px" }}>
      <div style={{ fontSize:9, color: S.dim, letterSpacing:1, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize: isText ? 12 : 18, fontWeight:700, color, textTransform: isText ? "capitalize" : "none" }}>{value}</div>
    </div>
  );
}

function ControlBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{ background:"none", border:"none", color: S.muted, fontSize:16, cursor:"pointer", padding:4, transition:"color 0.15s" }}
      onMouseEnter={e => (e.target as HTMLButtonElement).style.color = S.white}
      onMouseLeave={e => (e.target as HTMLButtonElement).style.color = S.muted}>
      {children}
    </button>
  );
}