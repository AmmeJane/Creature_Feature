
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