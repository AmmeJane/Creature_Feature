import type { CreatureSnapshot } from "../pages/CreatureModel";
import { Creature } from "../pages/CreatureModel";

export async function fetchCreatures(): Promise<CreatureSnapshot[]> {
  const res = await fetch("/api/users/creatures");
  if (!res.ok) throw new Error("Failed to fetch creatures");
  const raw = await res.json();
  return raw.map((c: any) => Creature.fromSnapshot(c).toSnapshot());
}

export async function addCreature(): Promise<CreatureSnapshot> {
  const res = await fetch("/api/users/creatures/add", { method: "POST" });
  if (!res.ok) throw new Error("Failed to add creature");
  const raw = await res.json();
  return Creature.fromSnapshot(raw).toSnapshot();
}