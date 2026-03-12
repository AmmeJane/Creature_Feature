
import type { MiniGameProps } from "../types";
import { DUCK_KEYS } from "./types";
import { useSingingGame } from "./hooks";
import { DuckLane, Scoreboard, OverlayScreen } from "./components";

interface SingingProps extends MiniGameProps {
  songId:    string;
  songName?: string;
  onCollect: () => void;
}

export function Singing({ songId, songName, onScore, onCollect }: SingingProps) {
  const game = useSingingGame(songId, onScore);

  return (
    <div style={{ width:"100%", height:"100%", minHeight:520, position:"relative", overflow:"hidden", userSelect:"none", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Press Start 2P','Courier New',monospace" }}>

{/* Base black */}
      <div style={{ position:"absolute", inset:0, zIndex:0, background:"#121212" }}/>

      {/* Green ambient bloom — top-left, Spotify album-art colour bleed */}
      <div style={{
        position:"absolute", zIndex:0,
        top:-120, left:-80,
        width:500, height:500,
        borderRadius:"50%",
        pointerEvents:"none",
        background:"radial-gradient(circle, rgba(29,185,84,0.20) 0%, transparent 68%)",
      }}/>

      {/* Softer green bloom — top-right */}
      <div style={{
        position:"absolute", zIndex:0,
        top:-60, right:-60,
        width:360, height:360,
        borderRadius:"50%",
        pointerEvents:"none",
        background:"radial-gradient(circle, rgba(30,215,96,0.11) 0%, transparent 68%)",
      }}/>

      {/* Bottom scrim — the Spotify "now playing" dark-to-black vignette */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        pointerEvents:"none",
        background:"linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.88) 100%)",
      }}/>

      {/* Hairline separator — faint green shelf divider between HUD and stage */}
      <div style={{
        position:"absolute", zIndex:0,
        left:"5%", right:"5%", top:"48%",
        height:1,
        pointerEvents:"none",
        background:"linear-gradient(to right, transparent, rgba(29,185,84,0.12), transparent)",
      }}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes ripple      { to { transform:translate(-50%,-50%) scale(2.2); opacity:0; } }
        @keyframes noteFloat1  { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(4px,-12px);opacity:0} }
        @keyframes feedbackPop { 0%{transform:translateX(-50%) scale(0.5);opacity:0} 20%{transform:translateX(-50%) scale(1.2);opacity:1} 70%{opacity:1} 100%{opacity:0} }
        @keyframes bobbing     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes snowfall    { 0%{transform:translateY(-10px) rotate(0deg);opacity:0.8} 100%{transform:translateY(100vh) rotate(360deg);opacity:0} }
      `}</style>

      <Scoreboard score={game.score} combo={game.combo} songName={songName} />

      {/* Duck lanes */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"45%", zIndex:4, display:"flex", justifyContent:"space-around", alignItems:"flex-end", padding:"0 8%" }}>
        {DUCK_KEYS.map(key => (
          <DuckLane
            key={key}
            duckKey={key}
            duckState={game.duckStates[key]}
            notes={game.activeNotes.filter(n => n.duckKey === key && !n.hit)}
            onPress={game.handleKey}
          />
        ))}
      </div>

      {/* Feedback */}
      {game.feedback && (
        <div key={game.feedback.id} style={{ position:"absolute", top:"28%", left:"50%", fontSize:14, color:game.feedback.colour, textShadow:"2px 2px 0 #000", zIndex:20, pointerEvents:"none", animation:"feedbackPop 0.7s ease-out forwards", whiteSpace:"nowrap" }}>
          {game.feedback.text}
        </div>
      )}

      {game.phase !== "playing" && (
        <OverlayScreen
          phase={game.phase}
          loadError={game.loadError}
          songName={songName}
          score={game.score}
          maxCombo={game.maxCombo}
          onStart={game.startGame}
          maxPossibleScore={game.maxPossibleScore}
          onCollect={onCollect}
        />
      )}
    </div>
  );
}

export const singingMeta = {
  id:          "singing-ducks",
  title:       "Singing Ducks",
  description: "Hit notes to the beat!",
  emoji:       "𓅯",
  controls:    "A / S / D keys",
  component:   Singing,
};