export type CreatureColour = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "cyan";
export type CreatureState = "Idle" | "Moving" | "Sleeping" | "Running";

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
  ["trex",           10],
  ["triceratops",    10],
  ["stegosaurus",    10],
  ["raptor",         10],
  ["lion",           10],
  ["elephant",       10],
  ["zebra",          10],
  ["monkey",         10],
  ["pterodactyl",     4],  // uncommon
  ["brachiosaurus",   4],
  ["giraffe",         4],
  ["crocodile",       4],
  ["penguin",         2],  // rare
  ["rhino",           2],
] as const;