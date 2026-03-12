export type CreatureColour = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "cyan";
export type CreatureState = "Idle" | "Moving" ;

export interface CreatureSnapshot {
  id: string;
  name: string;
  size: number;
  speed: number;
  colour: CreatureColour;
  state: CreatureState;
  age: number;
  genes: { size: number; speed: number; colour: number };
  songId: string;
  type: string;
}

export const CREATURE_TYPES = [
  // type,           weight (higher = more common)
  ["mammal",           10],
  ["slime",    10],
  ["aquatic",    10]
] as const;

export interface Creature {
  id: string;
  songId: string;
  name: string;
  genes: { size: number; speed: number; colour: number };
  type: string;
}