import type { CreatureSnapshot } from "../types/CreatureTypes";
import { Creature } from "../pages/CreatureModel";

export async function fetchCreatures(): Promise<CreatureSnapshot[]> {
  const res = await fetch("/api/user/creatures");
  if (res.status === 401 || res.status === 403) {
    window.location.href = "/auth/login";
    return [];
  }
  if (!res.ok) throw new Error(`Failed to fetch creatures: ${res.status}`);
  const raw: any[] = await res.json();
  return raw.map((c) => ({
    id:     c.id,
    name:   c.name,
    type:   c.type ?? "raptor",
    genes:  c.genes,
    songId: c.songId ?? c.id,
    // derive traits from genes
    size:   0.5 + c.genes.size * 4.5,
    speed:  0.1 + c.genes.speed * 9.9,
    colour: ["red","blue","green","yellow","purple","orange","cyan"][
      Math.min(Math.floor(c.genes.colour * 7), 6)
    ] as any,
    state:  "Idle" as const,
    age:    0,
    x:  (Math.random() - 0.5) * 18,
    y:  (Math.random() - 0.5) * 10,
    vx: (Math.random() - 0.5) * 0.04,
    vy: (Math.random() - 0.5) * 0.04,
  }));
}

export async function addCreature(): Promise<CreatureSnapshot> {
  const res = await fetch("/api/user/creatures/add", { method: "POST" });
  if (!res.ok) throw new Error("Failed to add creature");
  const raw = await res.json();
  return {
    ...Creature.fromSnapshot(raw).toSnapshot(),
    type: raw.type ?? "raptor",
  };
}

export async function fetchTrackPreview(songId: string): Promise<{ name: string; artist: string; albumArt: string | null; previewUrl: string | null }> {
  const res = await fetch(`/api/user/track/${songId}`);
  if (!res.ok) throw new Error("Failed to fetch track preview");
  return res.json();
}