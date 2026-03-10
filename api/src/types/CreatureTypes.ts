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
}