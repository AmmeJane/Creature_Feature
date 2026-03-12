import { useEffect, useRef, useState, useCallback } from "react";
import { Creature } from "../pages/CreatureModel";
import type { CreatureSnapshot } from "../types/CreatureTypes";
import { fetchCreatures, addCreature } from "../api/creature";
import { categoryFromType, generateCreatureName } from "../components/creatures/ProceduralCreature";

export function useCreatures() {
  const instancesRef = useRef<Creature[]>([]);
  const typeMapRef   = useRef<Record<string, string>>({});
  const snapshotsRef = useRef<CreatureSnapshot[]>([]);

  const [snapshots, setSnapshots] = useState<CreatureSnapshot[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [running,   setRunning]   = useState(true);
  const [tick,      setTick]      = useState(0);
  const [spawning,  setSpawning]  = useState(false);
  const [newCreature, setNewCreature] = useState<CreatureSnapshot | null>(null);

  // Load from API
  useEffect(() => {
    fetchCreatures()
      .then((snaps) => {
        instancesRef.current = [];
        typeMapRef.current   = {};
        snaps.forEach((s: any) => {
          const category = categoryFromType(s.type ?? "mammal");
          s.name = generateCreatureName(s.id, category, s.name);
          instancesRef.current.push(Creature.fromSnapshot(s));
          typeMapRef.current[s.id] = s.type ?? "mammal";
        });
        const initial = instancesRef.current.map((c) => c.toSnapshot());
        snapshotsRef.current = initial;
        setSnapshots(initial);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("API unavailable, using fallback creatures:", err);
        const fallback = Array.from({ length: 5 }, () => new Creature());
        instancesRef.current = fallback;
        fallback.forEach((c) => {
          typeMapRef.current[c.id] = "mammal";
        });
        const initial = fallback.map((c) => c.toSnapshot());
        snapshotsRef.current = initial;
        setSnapshots(initial);
        setLoading(false);
      });
  }, []);

  // Simulation tick 
  useEffect(() => {
    if (!running || loading) return;
    const id = setInterval(() => {
      instancesRef.current.forEach((c) => c.update());
      const next = instancesRef.current.map((c) => c.toSnapshot());
      snapshotsRef.current = next;
      setSnapshots(next);
      setTick((t) => t + 1);
    }, 60);
    return () => clearInterval(id);
  }, [running, loading]);

  // Pending creature (fetched but not yet added to herd) 
  const pendingCreatureRef = useRef<Creature | null>(null);

  // Spawn — fetches creature and shows crate, does NOT add to herd yet 
  const spawnCreature = useCallback(async () => {
    if (spawning) return;
    setSpawning(true);
    try {
      const snap     = await addCreature();
      const category = categoryFromType(snap.type ?? "mammal");
      snap.name      = generateCreatureName(snap.id, category, snap.name);
      typeMapRef.current[snap.id] = snap.type ?? "mammal";
      const c = Creature.fromSnapshot(snap);
      pendingCreatureRef.current = c;
      setNewCreature(c.toSnapshot()); // shows the crate modal
    } catch (err) {
      console.error("Failed to spawn creature:", err);
    } finally {
      setSpawning(false);
    }
  }, [spawning]);

  // Confirm — called after crate animation, actually adds to herd 
  const confirmNewCreature = useCallback(() => {
    const c = pendingCreatureRef.current;
    if (!c) return;
    instancesRef.current.push(c);
    const next = instancesRef.current.map((c) => c.toSnapshot());
    snapshotsRef.current = next;
    setSnapshots(next);
    pendingCreatureRef.current = null;
    setNewCreature(null);
  }, []);

  // Remove creature from herd 
  const removeCreature = useCallback((id: string) => {
    instancesRef.current = instancesRef.current.filter((c) => c.id !== id);
    const next = instancesRef.current.map((c) => c.toSnapshot());
    snapshotsRef.current = next;
    setSnapshots(next);
  }, []);

  // Force state change
  const changeCreatureState = useCallback((id: string, state: any) => {
    instancesRef.current.find((c) => c.id === id)?.changeState(state);
    const next = instancesRef.current.map((c) => c.toSnapshot());
    snapshotsRef.current = next;
    setSnapshots(next);
  }, []);

  return {
    snapshots,
    snapshotsRef,
    typeMapRef,
    loading,
    error,
    running,
    setRunning,
    tick,
    spawning,
    newCreature,
    clearNewCreature: () => setNewCreature(null),
    confirmNewCreature,
    spawnCreature,
    removeCreature,
    changeCreatureState,
  };
}