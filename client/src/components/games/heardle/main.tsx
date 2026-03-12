import { useState, useRef, useEffect } from "react";
import type { MiniGameProps } from "../../../types/Game";
import { S } from "../../../constants/colours";
import { CreaturePreview } from "../../creatures/CreaturePreview";
import { geneToColourHex } from "../../creatures/ProceduralCreature";

//  Fuzzy match 
function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function fuzzyMatch(guess: string, answer: string, threshold = 0.85): boolean {
  const g = normalise(guess);
  const a = normalise(answer);
  if (g === a) return true;
  if (a.includes(g) && g.length >= 3) return true;

  // character-level similarity (Dice coefficient)
  const bigrams = (str: string) => {
    const s = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) s.add(str.slice(i, i + 2));
    return s;
  };
  const ga = bigrams(g), aa = bigrams(a);
  let inter = 0;
  ga.forEach(b => { if (aa.has(b)) inter++; });
  const score = (2 * inter) / (ga.size + aa.size);
  return score >= threshold;
}

//  Snippet durations 
const SNIPPETS = [1, 2, 4, 8, 16, 30]; // seconds revealed per attempt

interface HeardleProps extends MiniGameProps {
  songId:     string;
  songName:   string;
  previewUrl: string;
  creature:   any;
  creatureType: string;
  onCollect: (songId?: string) => void;
  onGiveUp:   () => void;
}

export function Heardle({ songId, songName, previewUrl, creature, creatureType, onCollect, onGiveUp, onScore }: HeardleProps) {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [attempt,   setAttempt]   = useState(0);          // 0–5
  const [guesses,   setGuesses]   = useState<string[]>([]); // past guesses
  const [input,     setInput]     = useState("");
  const [phase,     setPhase]     = useState<"playing" | "won" | "lost">("playing");
  const [playing,   setPlaying]   = useState(false);
  const [feedback,  setFeedback]  = useState<string | null>(null);

  const maxAttempts = SNIPPETS.length;
  const snippetLen  = SNIPPETS[attempt] ?? 30;
  const colour      = creature ? geneToColourHex(creature.genes?.colour ?? 0.5) : S.green;

  // cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const playSnippet = () => {
    if (!previewUrl) return;
    const audio = audioRef.current ?? new Audio(previewUrl);
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play();
    setPlaying(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      audio.pause();
      setPlaying(false);
    }, snippetLen * 1000);
  };

  const stopSnippet = () => {
    audioRef.current?.pause();
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
  };

  const submitGuess = () => {
    if (!input.trim() || phase !== "playing") return;
    const correct = fuzzyMatch(input, songName);
    const next    = [...guesses, input.trim()];
    setGuesses(next);
    setInput("");

    if (correct) {
      audioRef.current?.pause();
      setPhase("won");
      onScore?.(maxAttempts - attempt);
      return;
    }

    setFeedback("✗ Wrong!");
    setTimeout(() => setFeedback(null), 900);

    if (attempt + 1 >= maxAttempts) {
      audioRef.current?.pause();
      setPhase("lost");
      return;
    }
    setAttempt(a => a + 1);
  };

  const skip = () => {
    if (phase !== "playing") return;
    const next = [...guesses, "— skipped —"];
    setGuesses(next);
    setInput("");
    if (attempt + 1 >= maxAttempts) {
      audioRef.current?.pause();
      setPhase("lost");
      return;
    }
    setAttempt(a => a + 1);
  };

  //  Overlay 
  if (phase !== "playing") {
    const won = phase === "won";
    return (
      <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:S.black }}>
        <div style={{ textAlign:"center", maxWidth:380, padding:32 }}>

          <div style={{ fontSize:32, marginBottom:8 }}>{won ? "Congratulations" : "Death"}</div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>{won ? "Got it!" : "Out of tries"}</div>
          <div style={{ fontSize:13, color:S.muted, marginBottom:4 }}>The song was</div>
          <div style={{ fontSize:16, fontWeight:700, color:colour, marginBottom:24 }}>{songName}</div>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button
              onClick={() => onCollect(songId)}
              style={{ background:S.green, border:"none", borderRadius:24, padding:"10px 24px", color:S.black, fontWeight:700, fontSize:13, cursor:"pointer" }}
            >
              {won ? "Collect creature →" : "Try next song →"}
            </button>
            <button
              onClick={onGiveUp}
              style={{ background:"transparent", border:`1px solid ${S.border}`, borderRadius:24, padding:"10px 24px", color:S.muted, fontSize:13, cursor:"pointer" }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  //  Playing 
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:S.black, padding:24, boxSizing:"border-box" }}>

      <div style={{ fontSize:11, fontWeight:700, color:S.muted, letterSpacing:2, marginBottom:24 }}>Creature Heardle</div>

      {/* Attempt bars */}
      <div style={{ display:"flex", gap:4, marginBottom:32 }}>
        {SNIPPETS.map((len, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              width: 32 + i * 6,
              height: 6,
              borderRadius: 3,
              background: i < attempt ? (guesses[i] === "— skipped —" ? S.dim : "#E91429") : i === attempt ? colour : S.elevated,
              transition: "background 0.3s",
            }} />
            <div style={{ fontSize:8, color: S.dim }}>{len}s</div>
          </div>
        ))}
      </div>

      {/* Play button */}
      <button
        onClick={playing ? stopSnippet : playSnippet}
        style={{
          width:80, height:80, borderRadius:"50%",
          background: playing ? `${colour}22` : colour,
          border: `3px solid ${colour}`,
          color: playing ? colour : S.black,
          fontSize:28, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:12,
          transition:"all 0.2s",
          boxShadow: playing ? `0 0 24px ${colour}66` : "none",
        }}
      >
        {playing ? "■" : "▶"}
      </button>
      <div style={{ fontSize:11, color:S.dim, marginBottom:32 }}>
        {playing ? `Playing ${snippetLen}s snippet…` : `Attempt ${attempt + 1} of ${maxAttempts} · ${snippetLen}s`}
      </div>

      {/* Past guesses */}
      <div style={{ width:"100%", maxWidth:400, marginBottom:16, minHeight:80 }}>
        {guesses.map((g, i) => (
          <div key={i} style={{ fontSize:12, color: g === "— skipped —" ? S.dim : "#E91429", padding:"4px 0", borderBottom:`1px solid ${S.border}` }}>
            {g}
          </div>
        ))}
        {feedback && (
          <div style={{ fontSize:13, color:"#E91429", padding:"4px 0", fontWeight:700 }}>{feedback}</div>
        )}
      </div>

      {/* Input */}
      <div style={{ width:"100%", maxWidth:400, display:"flex", gap:8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submitGuess()}
          placeholder="Guess the song name…"
          style={{ flex:1, background:S.elevated, border:`1px solid ${S.border}`, borderRadius:8, padding:"10px 14px", color:S.white, fontSize:13, fontFamily:S.font, outline:"none" }}
        />
        <button onClick={submitGuess} style={{ background:colour, border:"none", borderRadius:8, padding:"10px 18px", color:S.black, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Go
        </button>
        <button onClick={skip} style={{ background:"transparent", border:`1px solid ${S.border}`, borderRadius:8, padding:"10px 14px", color:S.muted, fontSize:13, cursor:"pointer" }}>
          Skip
        </button>
      </div>

    </div>
  );
}

export const heardleMeta = {
  id:          "heardle",
  title:       "Creature Heardle",
  description: "Guess the song from a snippet!",
  emoji:       "♫",
  controls:    "Type to guess",
  component:   Heardle,
};