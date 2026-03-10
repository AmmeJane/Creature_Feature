import { useState } from "react";
import type { MiniGameMeta } from "./types";

interface Props {
  games: MiniGameMeta[];
}

// ── MiniGameShell ─────────────────────────────────────────────────────────────
// Hosts a collection of mini games. Shows a card grid, click to play.
export function MiniGameShell({ games }: Props) {
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [lastScores, setLastScores] = useState<Record<string, number>>({});

  const activeGame = games.find(g => g.id === activeId) ?? null;
  const GameComponent = activeGame?.component ?? null;

  const handleScore = (id: string, score: number) => {
    setLastScores(prev => ({ ...prev, [id]: Math.max(prev[id] ?? 0, score) }));
  };

  // ── Grid view ───────────────────────────────────────────────────────────────
  if (!activeGame || !GameComponent) {
    return (
      <div style={{ padding: "24px", fontFamily: "'Press Start 2P', 'Courier New', monospace" }}>
        <div style={{ fontSize: 11, color: "#A7A7A7", letterSpacing: 2, marginBottom: 20 }}>
          MINI GAMES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setActiveId(game.id)}
              style={{
                background: "#1A1A1A",
                border: "2px solid #333",
                borderRadius: 10,
                padding: "20px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                color: "#fff",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.border = "2px solid #1DB954";
                (e.currentTarget as HTMLButtonElement).style.background = "#222";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.border = "2px solid #333";
                (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{game.emoji}</div>
              <div style={{ fontSize: 9, color: "#fff", marginBottom: 6, letterSpacing: 1 }}>{game.title}</div>
              <div style={{ fontSize: 7, color: "#6A6A6A", lineHeight: 1.8, marginBottom: 10 }}>{game.description}</div>
              <div style={{ fontSize: 7, color: "#444", marginBottom: 8 }}>🎮 {game.controls}</div>
              {lastScores[game.id] != null && (
                <div style={{ fontSize: 7, color: "#1DB954" }}>
                  BEST: {lastScores[game.id]}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Active game view ────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Back bar */}
      <div style={{
        height: 44, background: "#121212", borderBottom: "1px solid #333",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        fontFamily: "'Press Start 2P', monospace", flexShrink: 0,
      }}>
        <button
          onClick={() => setActiveId(null)}
          style={{ background: "none", border: "none", color: "#A7A7A7", cursor: "pointer", fontSize: 10, fontFamily: "inherit", padding: "4px 8px" }}
        >
          ← BACK
        </button>
        <span style={{ fontSize: 9, color: "#fff", letterSpacing: 1 }}>{activeGame.emoji} {activeGame.title}</span>
      </div>

      {/* Game */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <GameComponent onScore={score => handleScore(activeGame.id, score)} />
      </div>
    </div>
  );
}