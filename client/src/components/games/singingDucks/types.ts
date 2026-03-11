// games/singingDucks/types.ts
export type DuckKey   = "A" | "S" | "D";
export type DuckState = "idle" | "singing" | "miss";

export interface ActiveNote {
  id:      number;
  duckKey: DuckKey;
  y:       number;
  hit:     boolean;
  missed:  boolean;
}

export const HIT_ZONE      = 82;
export const HIT_TOLERANCE = 12;
export const NOTE_SPEED    = 18;

export const DUCK_KEYS: DuckKey[] = ["A", "S", "D"];

export const DUCK_IMAGES: Record<DuckKey, string> = {
  A: "../pictures/benimage.png",
  S: "../pictures/gernotimage.png",
  D: "../pictures/benright.png",
};

export const SONG: [DuckKey, number][] = [
  ["A", 0],   ["S", 100], ["D", 300], ["A", 300],
  ["S", 400], ["D", 200], ["A", 200], ["S", 400],
  ["D", 300], ["A", 300], ["S", 200], ["D", 400],
  ["A", 300], ["A", 200], ["S", 300], ["D", 400],
  ["S", 300], ["A", 300], ["D", 200], ["S", 200],
  ["A", 400], ["D", 300], ["S", 300], ["A", 200],
  ["D", 900], ["S", 600], ["A", 700], ["D", 100],
  ["S", 400], ["A", 200], ["D", 300], ["S", 300],
  ["A", 200], ["S", 200], ["D", 400], ["A", 300],
  ["S", 300], ["D", 200], ["A", 400], ["S", 300],
];