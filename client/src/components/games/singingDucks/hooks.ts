// games/singingDucks/hooks.ts
import { useState, useRef, useCallback, useEffect } from "react";
import type { DuckKey, DuckState, ActiveNote } from "./types";
import { HIT_ZONE, HIT_TOLERANCE, NOTE_SPEED, SONG } from "./types";

export function useSingingGame(onScore?: (s: number) => void) {
  const [score,      setScore]      = useState(0);
  const [combo,      setCombo]      = useState(0);
  const [maxCombo,   setMaxCombo]   = useState(0);
  const [duckStates, setDuckStates] = useState<Record<DuckKey, DuckState>>({ A:"idle", S:"idle", D:"idle" });
  const [activeNotes,setActiveNotes]= useState<ActiveNote[]>([]);
  const [feedback,   setFeedback]   = useState<{ text:string; colour:string; id:number } | null>(null);
  const [gameState,  setGameState]  = useState<"idle"|"playing"|"gameover">("idle");

  const rafRef       = useRef<number>(0);
  const lastTimeRef  = useRef<number>(0);
  const noteIdRef    = useRef(0);
  const comboRef     = useRef(0);
  const gameStateRef = useRef<"idle"|"playing"|"gameover">("idle");
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

  comboRef.current     = combo;
  gameStateRef.current = gameState;

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

  const startGame = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setScore(0); setCombo(0); setMaxCombo(0);
    setActiveNotes([]);
    setDuckStates({ A:"idle", S:"idle", D:"idle" });
    setGameState("playing");
    gameStateRef.current = "playing";
    lastTimeRef.current  = 0;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }

    let elapsed = 500;
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

    const endT = setTimeout(() => {
      setGameState("gameover");
      gameStateRef.current = "gameover";
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      setScore(s => { onScore?.(s); return s; });
    }, elapsed + 3000);
    timeoutsRef.current.push(endT);
  }, [animate, onScore]);

  const handleKey = useCallback((key: DuckKey) => {
    if (gameStateRef.current !== "playing") return;
    setActiveNotes(prev => {
      const candidates = prev.filter(n =>
        n.duckKey === key && !n.hit && !n.missed && Math.abs(n.y - HIT_ZONE) <= HIT_TOLERANCE
      );
      if (!candidates.length) {
        setCombo(0); comboRef.current = 0;
        setFeedback({ text:"MISS", colour:"#ff4444", id:Date.now() });
        return prev;
      }
      const target  = candidates.reduce((a,b) => Math.abs(a.y-HIT_ZONE)<Math.abs(b.y-HIT_ZONE)?a:b);
      const perfect = Math.abs(target.y - HIT_ZONE) < 4;
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k==="A") handleKey("A");
      if (k==="S") handleKey("S");
      if (k==="D") handleKey("D");
      if (e.key===" " && gameStateRef.current !== "playing") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey, startGame]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    audioRef.current?.pause();
  }, []);

  return {
    score, combo, maxCombo, duckStates, activeNotes,
    feedback, gameState, startGame, handleKey, audioRef,
  };
}