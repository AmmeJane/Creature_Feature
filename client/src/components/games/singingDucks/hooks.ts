// games/singingDucks/hooks.ts
import { useState, useRef, useCallback, useEffect } from "react";
import type { DuckKey, DuckState, ActiveNote } from "./types";
import { HIT_ZONE, HIT_TOLERANCE, NOTE_SPEED, DUCK_KEYS } from "./types";
import { generateNoteChart } from "../../../utils/audioAnalyser";
import type { NoteChart } from "../../../utils/audioAnalyser";

export type GamePhase = "loading" | "ready" | "playing" | "gameover";

export function useSingingGame(songId: string, onScore?: (s: number) => void) {
  const [phase,      setPhase]      = useState<GamePhase>("loading");
  const [score,      setScore]      = useState(0);
  const [combo,      setCombo]      = useState(0);
  const [maxCombo,   setMaxCombo]   = useState(0);
  const [duckStates, setDuckStates] = useState<Record<DuckKey, DuckState>>({ A:"idle", S:"idle", D:"idle" });
  const [activeNotes,setActiveNotes]= useState<ActiveNote[]>([]);
  const [feedback,   setFeedback]   = useState<{ text:string; colour:string; id:number } | null>(null);
  const [loadError,  setLoadError]  = useState<string | null>(null);

  const chartRef     = useRef<NoteChart | null>(null);
  const maxPossibleScoreRef = useRef<number>(0);
  const rafRef       = useRef<number>(0);
  const lastTimeRef  = useRef<number>(0);
  const noteIdRef    = useRef(0);
  const comboRef     = useRef(0);
  const phaseRef     = useRef<GamePhase>("loading");
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

  comboRef.current = combo;
  phaseRef.current = phase;

  // ── Load preview + analyse ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(`/api/user/track/${songId}`);
        if (!res.ok) throw new Error("Could not fetch track info");
        const { previewUrl } = await res.json();
        if (!previewUrl) throw new Error("No preview available for this song");

        const chart = await generateNoteChart(previewUrl);
        if (cancelled) return;

        chartRef.current = chart;
        maxPossibleScoreRef.current = chart.notes.length * 100;
        setPhase("ready");
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message ?? "Failed to analyse audio");
      }
    })();

    return () => { cancelled = true; };
  }, [songId]);

  // ── Animation loop ────────────────────────────────────────────────────────
  const animate = useCallback((time: number) => {
    if (phaseRef.current !== "playing") return;
    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = time;

    setActiveNotes(prev =>
      prev
        .map(n => ({ ...n, y: n.y + NOTE_SPEED * dt }))
        .map(n => {
          if (!n.hit && !n.missed && n.y > HIT_ZONE + HIT_TOLERANCE) {
            comboRef.current = 0;
            setCombo(0);
            setFeedback({ text:"Miss", colour:"#ff4444", id:Date.now() });
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

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setScore(0); setCombo(0); setMaxCombo(0);
    setActiveNotes([]);
    setDuckStates({ A:"idle", S:"idle", D:"idle" });
    setPhase("playing");
    phaseRef.current  = "playing";
    lastTimeRef.current = 0;

    const audio = new Audio(chart.previewUrl);
    audioRef.current = audio;

    const travelTime = HIT_ZONE / NOTE_SPEED;
    audio.volume = 0;
    audio.play().catch(() => {});
    // Fade in over 2 seconds
    const fadeSteps = 40;
    const fadeInterval = 2000 / fadeSteps;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      audio.volume = Math.min(1, step / fadeSteps) * 0.6;
      if (step >= fadeSteps) clearInterval(fade);
    }, fadeInterval);

    // Spawn notes early enough that they reach the hit zone exactly on beat

    chart.notes.forEach(note => {
      const spawnAt = Math.max(0, (note.time - travelTime) * 1000);
      const t = setTimeout(() => {
        if (phaseRef.current !== "playing") return;
        setActiveNotes(prev => [...prev, {
          id: noteIdRef.current++,
          duckKey: note.lane,
          y: 0,
          hit: false,
          missed: false,
        }]);
      }, spawnAt);
      timeoutsRef.current.push(t);
    });

    rafRef.current = requestAnimationFrame(animate);

    const lastNoteTime = chart.notes.at(-1)?.time ?? chart.duration;
    const fadeOutDuration = 2000; // 2 second fade out
    const gameEndDelay = Math.max(0, (lastNoteTime - 2) * 1000);
    const endTimer = setTimeout(() => {
        let step = 0;
        const fadeSteps = 40;
        const startVol = audio.volume;
        const fadeOut = setInterval(() => {
            step++;
            audio.volume = Math.max(0, startVol * (1 - step / fadeSteps));
            if (step >= fadeSteps) {
                clearInterval(fadeOut);
                audio.pause();
                setPhase("gameover");
                phaseRef.current = "gameover";
                cancelAnimationFrame(rafRef.current);
                setScore(s => { onScore?.(s); return s; });
            }
        }, fadeOutDuration / fadeSteps);
    }, gameEndDelay);
        timeoutsRef.current.push(endTimer);
  }, [animate, onScore]);

  // ── Handle key press ──────────────────────────────────────────────────────
  const handleKey = useCallback((key: DuckKey) => {
    if (phaseRef.current !== "playing") return;

    setActiveNotes(prev => {
      const candidates = prev.filter(n =>
        n.duckKey === key && !n.hit && !n.missed && Math.abs(n.y - HIT_ZONE) <= HIT_TOLERANCE
      );
      if (!candidates.length) {
        setCombo(0); comboRef.current = 0;
        setFeedback({ text:"MISS", colour:"#ff4444", id:Date.now() });
        return prev;
      }
      const target   = candidates.reduce((a,b) => Math.abs(a.y-HIT_ZONE) < Math.abs(b.y-HIT_ZONE) ? a : b);
      const perfect  = Math.abs(target.y - HIT_ZONE) < 4;
      const newCombo = comboRef.current + 1;
      const points   = (perfect ? 100 : 50) + Math.floor(newCombo / 3) * 10;
      comboRef.current = newCombo;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setScore(s => s + points);
      setFeedback({ text:perfect ? "PERFECT!" : "GOOD", colour:perfect ? "#ffe066" : "#66ff99", id:Date.now() });
      setDuckStates(ds => ({ ...ds, [key]:"singing" }));
      setTimeout(() => setDuckStates(ds => ({ ...ds, [key]:"idle" })), 350);
      return prev.map(n => n.id === target.id ? { ...n, hit:true } : n);
    });
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase() as DuckKey;
      if (DUCK_KEYS.includes(k)) handleKey(k);
      if (e.key === " " && phaseRef.current === "ready") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey, startGame]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    audioRef.current?.pause();
  }, []);

  return {
    phase, loadError, score, combo, maxCombo,
    duckStates, activeNotes, feedback,
    startGame, handleKey, audioRef, maxPossibleScore: maxPossibleScoreRef.current,
  };
}