// games/singingDucks/Singing.tsx
import type { MiniGameProps } from "../../../types/Game";
import { DUCK_KEYS } from "./types";
import { useSingingGame } from "./hooks";
import { DuckLane, Scoreboard, OverlayScreen } from "./components";

export function Singing({ onScore }: MiniGameProps) {
  const game = useSingingGame(onScore);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 520,
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Press Start 2P','Courier New',monospace",
      }}
    >
      <audio
        ref={game.audioRef}
        src="/audio/vivaldi-winter.mp3"
        loop={false}
        preload="auto"
      />

      {/* Winter background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #0a1628 0%, #1a3a6e 30%, #2a5a9e 55%, #3a7acc 65%, #4a9ad8 100%)",
          zIndex: 0,
        }}
      />

      {/* Snowflakes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 100}%`,
              width: 4 + (i % 3) * 3,
              height: 4 + (i % 3) * 3,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.8)",
              animation: `snowfall ${4 + (i % 6)}s linear ${i % 5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Frozen pond */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(180deg,#6ab8d4 0%,#4a8faa 40%,#2a6080 100%)",
          zIndex: 2,
        }}
      >
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.3,
          }}
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          <path
            d="M50,20 L80,60 L120,40 L160,80"
            stroke="white"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M200,10 L220,50 L260,30 L300,70"
            stroke="white"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M300,40 L330,80 L360,50"
            stroke="white"
            strokeWidth="1"
            fill="none"
          />
          <ellipse
            cx="150"
            cy="100"
            rx="60"
            ry="20"
            stroke="white"
            strokeWidth="1"
            fill="rgba(255,255,255,0.1)"
          />
          <ellipse
            cx="280"
            cy="120"
            rx="45"
            ry="15"
            stroke="white"
            strokeWidth="1"
            fill="rgba(255,255,255,0.1)"
          />
        </svg>
      </div>

      {/* Snowy ground */}
      <div
        style={{
          position: "absolute",
          bottom: "43%",
          left: 0,
          right: 0,
          height: 18,
          background: "white",
          zIndex: 3,
          borderRadius: "50% 50% 0 0",
        }}
      />

      {/* Snowy trees */}
      {[
        [-2, 18],
        [94, 16],
      ].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "30px solid transparent",
              borderRight: "30px solid transparent",
              borderBottom: "55px solid #2d5a27",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              borderLeft: "30px solid transparent",
              borderRight: "30px solid transparent",
              borderBottom: "55px solid rgba(255,255,255,0.4)",
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "22px solid transparent",
              borderRight: "22px solid transparent",
              borderBottom: "42px solid #3a7a35",
              marginTop: -22,
              marginLeft: 8,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 8,
              width: 0,
              height: 0,
              borderLeft: "22px solid transparent",
              borderRight: "22px solid transparent",
              borderBottom: "42px solid rgba(255,255,255,0.35)",
              marginTop: -22,
            }}
          />
          <div
            style={{
              width: 14,
              height: 20,
              background: "#5a3010",
              margin: "0 auto",
            }}
          />
        </div>
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes ripple      { to { transform:translate(-50%,-50%) scale(2.2); opacity:0; } }
        @keyframes noteFloat1  { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(4px,-12px);opacity:0} }
        @keyframes feedbackPop { 0%{transform:translateX(-50%) scale(0.5);opacity:0} 20%{transform:translateX(-50%) scale(1.2);opacity:1} 70%{opacity:1} 100%{opacity:0} }
        @keyframes bobbing     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes snowfall    { 0%{transform:translateY(-10px) rotate(0deg);opacity:0.8} 100%{transform:translateY(100vh) rotate(360deg);opacity:0} }
      `}</style>

      <Scoreboard score={game.score} combo={game.combo} />

      {/* Duck lanes */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          zIndex: 4,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          padding: "0 8%",
        }}
      >
        {DUCK_KEYS.map((key) => (
          <DuckLane
            key={key}
            duckKey={key}
            duckState={game.duckStates[key]}
            notes={game.activeNotes.filter((n) => n.duckKey === key && !n.hit)}
            onPress={game.handleKey}
          />
        ))}
      </div>

      {/* Feedback */}
      {game.feedback && (
        <div
          key={game.feedback.id}
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            fontSize: 14,
            color: game.feedback.colour,
            textShadow: "2px 2px 0 #000",
            zIndex: 20,
            pointerEvents: "none",
            animation: "feedbackPop 0.7s ease-out forwards",
            whiteSpace: "nowrap",
          }}
        >
          {game.feedback.text}
        </div>
      )}

      {game.gameState !== "playing" && (
        <OverlayScreen
          gameState={game.gameState}
          score={game.score}
          maxCombo={game.maxCombo}
          onStart={game.startGame}
        />
      )}
    </div>
  );
}

export const singingMeta = {
  id: "singing-ducks",
  title: "SINGING DUCKS",
  description: "Hit notes to Vivaldi Winter!",
  emoji: "🦆",
  controls: "A / S / D keys",
  component: Singing,
};
