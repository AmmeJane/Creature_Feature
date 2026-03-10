import type { Creature } from "./CreatureTypes";

export interface User {
  spotifyId: string;
  creatures: Creature[];
}