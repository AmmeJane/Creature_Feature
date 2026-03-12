import { useState } from "react";
import { NavBar } from "../components/NavBar";
import { S } from "../constants/colours";
import { MINI_GAMES } from "../utils/GameIndex";
import { Singing } from "../components/games/singingDucks/main";
import { CreatureCrate } from "../components/creatures/CreatureCrate";

export function Discover() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameSong, setGameSong] = useState<{ songId: string; name: string; previewUrl: string } | null>(null);
  const [crateCreature, setCrateCreature] = useState<{ creature: any; creatureType: string } | null>(null);

  const launchSingingDucks = async () => {
    const res  = await fetch("/api/user/next-song");
    const data = await res.json();
    console.log("next-song response:", data);
    if (!data.songId) {
      console.error("next-song missing songId — check backend response", data);
      return;
    }
    setGameSong(data);
    setActiveGame("singing-ducks");
  };

  const handleCollect = async () => {
    const res  = await fetch("/api/user/creatures/add", { method: "POST" });
    const data = await res.json();
    setActiveGame(null);
    setCrateCreature({ creature: data, creatureType: data.type });
  };

  // ── Crate overlay (shown over any view) ────────────────────────────────────
  const crateOverlay = crateCreature && (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <CreatureCrate
        creature={crateCreature.creature}
        creatureType={crateCreature.creatureType}
        onConfirm={() => setCrateCreature(null)}
      />
    </div>
  );

  // ── Singing Ducks ───────────────────────────────────────────────────────────
  if (activeGame === "singing-ducks" && gameSong) {
    return (
      <div style={{ width:"100vw", height:"100vh", background:S.black, fontFamily:S.font, display:"flex", flexDirection:"column", overflow:"hidden", color:S.white }}>
        <NavBar tick={0} />
        <div style={{ height:44, background:S.elevated, borderBottom:`1px solid ${S.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
          <button
            onClick={() => setActiveGame(null)}
            style={{ background:"none", border:"none", color:S.muted, cursor:"pointer", fontSize:13, fontFamily:S.font, padding:"4px 8px", display:"flex", alignItems:"center", gap:6 }}
          >
            ← Back to Discover
          </button>
          <span style={{ color:S.border }}>|</span>
          <span style={{ fontSize:13, color:S.white }}> Singing Ducks Quak</span>
        </div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <Singing
            songId={gameSong.songId}
            songName={gameSong.name}
            onCollect={handleCollect}
            onScore={() => {}}
          />
        </div>
        {crateOverlay}
      </div>
    );
  }

  // ── Generic in-game view ────────────────────────────────────────────────────
  const game = MINI_GAMES.find(g => g.id === activeGame);
  const GameComponent = game?.component;

  if (game && GameComponent) {
    return (
      <div style={{ width:"100vw", height:"100vh", background:S.black, fontFamily:S.font, display:"flex", flexDirection:"column", overflow:"hidden", color:S.white }}>
        <NavBar tick={0} />
        <div style={{ height:44, background:S.elevated, borderBottom:`1px solid ${S.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
          <button
            onClick={() => setActiveGame(null)}
            style={{ background:"none", border:"none", color:S.muted, cursor:"pointer", fontSize:13, fontFamily:S.font, padding:"4px 8px", display:"flex", alignItems:"center", gap:6 }}
          >
            ← Back to Discover
          </button>
          <span style={{ color:S.border }}>|</span>
          <span style={{ fontSize:13, color:S.white }}>{game.emoji} {game.title}</span>
        </div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <GameComponent />
        </div>
        {crateOverlay}
      </div>
    );
  }

  // ── Discover view ───────────────────────────────────────────────────────────
  return (
    <div style={{ width:"100vw", height:"100vh", background:S.black, fontFamily:S.font, display:"flex", flexDirection:"column", overflow:"hidden", color:S.white }}>
      <NavBar tick={0} />

      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px" }}>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:6 }}>Discover</div>
          <div style={{ fontSize:13, color:S.muted }}>Mini games & extras</div>
        </div>

        <div style={{ fontSize:11, fontWeight:700, color:S.muted, letterSpacing:1, marginBottom:16 }}>MINI GAMES</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:16 }}>
          {MINI_GAMES.map(g => (
            <GameCard
              key={g.id}
              game={g}
              onClick={g.id === "singing-ducks" ? launchSingingDucks : () => setActiveGame(g.id)}
            />
          ))}
        </div>

      </div>
      {crateOverlay}
    </div>
  );
}

// ── Game card ──────────────────────────────────────────────────────────────────
function GameCard({ game, onClick }: { game: typeof MINI_GAMES[number]; onClick: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 140,
        background: hov ? "#2a2a2a" : "#1a1a1a",
        border: `2px solid ${hov ? "#1DB954" : "#2a2a2a"}`,
        borderRadius: 16,
        padding: "20px 12px 16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transition: "all 0.15s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 24px rgba(29,185,84,0.15)" : "none",
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: hov ? "linear-gradient(135deg, #1DB954, #148a3e)" : "linear-gradient(135deg, #2a2a2a, #1a1a1a)",
        border: `3px solid ${hov ? "#1DB954" : "#333"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, transition: "all 0.15s",
        boxShadow: hov ? "0 0 20px rgba(29,185,84,0.3)" : "none",
      }}>
        {game.emoji}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:hov ? "#fff" : S.muted, textAlign:"center", lineHeight:1.4, transition:"color 0.15s" }}>
        {game.title}
      </div>
      <div style={{ fontSize:9, color:S.dim, textAlign:"center" }}>
        {game.controls}
      </div>
    </button>
  );
}