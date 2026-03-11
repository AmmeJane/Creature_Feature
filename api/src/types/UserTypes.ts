import type { Creature } from "./CreatureTypes";

export interface User {
  spotifyId: string;
  creatures: Creature[];
  songPool: string[]; // remaining song ids not yet converted to creatures
}