import { RandomGenerator } from "../components/Random";
//State of the creature
export type CreatureState = "Idle" | "Moving" | "Sleeping" | "Running" ;
export const CreatureStates: CreatureState[] = ["Idle", "Moving", "Sleeping", "Running"] 
const STATE_TRANSITIONS: Record<CreatureState, CreatureState[]> = {
  "Idle":     ["Moving", "Sleeping", "Idle"],
  "Moving":   ["Idle",  "Moving"],
  "Sleeping": ["Idle"],
  "Running":  ["Running", "Idle", ]
}

//Colour of the creature
const COLOURS = ["red", "blue", "green", "yellow", "purple", "orange", "cyan"] as const;
export type CreatureColour = typeof COLOURS[number];


//Snapshot 
export interface CreatureSnapshot {
  id:     string;
  name:   string;
  size:   number;
  speed:  number;
  colour: CreatureColour;
  state:  CreatureState;
  age:    number;
  x:  number;
  y:  number;
  vx: number;
  vy: number;

  genes:  { size: number; speed: number; colour: number };
}


//Creature class definition

export class Creature {
  readonly id:   string;
  readonly name: string;

  size:   number;
  speed:  number;
  colour: CreatureColour;
  state:  CreatureState;
  age:    number = 0;

  // Position
  x:  number = 0;
  y:  number = 0;
  vx: number = 0;
  vy: number = 0;

  private sizeGene:   number;
  private speedGene:  number;
  private colourGene: number;
  private stateLog:   CreatureState[] = [];


  //Constructor
constructor(opts: {
  id?:         string;
  name?:       string;
  sizeGene?:   number;
  speedGene?:  number;
  colourGene?: number;
  state?:      CreatureState;
} = {}) {
  this.id   = opts.id   ?? crypto.randomUUID();
  this.name = opts.name ?? `Creature-${this.id.slice(0, 6)}`;

  this.sizeGene   = opts.sizeGene   ?? Math.random();
  this.speedGene  = opts.speedGene  ?? Math.random();
  this.colourGene = opts.colourGene ?? Math.random();

  // Random spawn position
  this.x  = (Math.random() - 0.5) * 18;
  this.y  = (Math.random() - 0.5) * 10;
  this.vx = (Math.random() - 0.5) * 0.04;
  this.vy = (Math.random() - 0.5) * 0.04;

  // Derive traits from genes
  this.size   = this.calculateSize();
  this.speed  = this.calculateSpeed();
  this.colour = this.calculateColour();
  this.state  = opts.state ?? "Idle";

  this.stateLog.push(this.state);
}


  //Gene  Trait calculations 

  private calculateSize(): number {
    // size range 0.5 → 5
    return parseFloat((0.5 + this.sizeGene * 4.5).toFixed(2));
  }

  private calculateSpeed(): number {
    // speed range 0.1 → 10
    return parseFloat((0.1 + this.speedGene * 9.9).toFixed(2));
  }

  private calculateColour(): CreatureColour {
    const index = Math.floor(this.colourGene * COLOURS.length);
    return COLOURS[Math.min(index, COLOURS.length - 1)];
  }

  // State management 

  /** Force a specific state — validates against the state machine */
  changeState(newState: CreatureState): void {
    const allowed = STATE_TRANSITIONS[this.state];
    if (!allowed.includes(newState)) {
      console.warn("Invalid transition ${this.state} → ${newState}. Skipped.");
      return;
    }
    this._applyState(newState);
  }

  /** Pick a random VALID next state (respects transition rules) */
  randomStateChange(): void {
    const allowed = STATE_TRANSITIONS[this.state];
    this._applyState(RandomGenerator.pick(allowed));
  }

  private _applyState(s: CreatureState): void {
    this.state = s;
    this.stateLog.push(s);
    if (this.stateLog.length > 100) this.stateLog.shift();
  }

  //Mutation 

  /**
   * Nudge all three genes by a small random delta.
   * Re-derives visible traits automatically.
   */
  mutate(strength = 0.05): void {
    const drift = () => RandomGenerator.float(-strength, strength);

    this.sizeGene   = stuck(this.sizeGene   + drift());
    this.speedGene  = stuck(this.speedGene  + drift());
    this.colourGene = stuck(this.colourGene + drift());

    this.size   = this.calculateSize();
    this.speed  = this.calculateSpeed();
    this.colour = this.calculateColour();
  }

  // Simulation step

  /** Advance one simulation step: run behaviour + maybe change state */

update(): void {
  this.age++;

  switch (this.state) {
    case "Moving":
      console.log(`🐾 [${this.name}] moves at speed ${this.speed}`);
      break;
    case "Sleeping":
      console.log(`😴 [${this.name}] is sleeping...`);
      break;
    case "Running":
      console.log(`🏃 [${this.name}] is running!`);
      break;
    case "Idle":
      console.log(`💤 [${this.name}] is idle.`);
      break;
  }

  // Position update
  const speedFactor = this.state === "Sleeping" ? 0
    : this.state === "Running" ? 2.5 : 1;
  const base = 0.008 + this.speedGene * 0.035;
  this.vx += (Math.random() - 0.5) * 0.006;
  this.vy += (Math.random() - 0.5) * 0.006;
  const mag = Math.sqrt(this.vx ** 2 + this.vy ** 2) || 1;
  this.vx = (this.vx / mag) * base * speedFactor;
  this.vy = (this.vy / mag) * base * speedFactor;
  this.x += this.vx;
  this.y += this.vy;
  if (this.x >  10) { this.x =  10; this.vx *= -1; }
  if (this.x < -10) { this.x = -10; this.vx *= -1; }
  if (this.y >   6) { this.y =   6; this.vy *= -1; }
  if (this.y <  -6) { this.y =  -6; this.vy *= -1; }

  if (RandomGenerator.chance(0.35)) this.randomStateChange();
  if (RandomGenerator.chance(0.15)) this.mutate(0.02);
}
  //Getters

  get genes() {
    return { size: this.sizeGene, speed: this.speedGene, colour: this.colourGene };
  }

  get stateHistory(): CreatureState[] {
    return [...this.stateLog];
  }

  //Serialisation 

  toSnapshot(): CreatureSnapshot {
    return {
      id:     this.id,
      name:   this.name,
      size:   this.size,
      speed:  this.speed,
      colour: this.colour,
      state:  this.state,
      age:    this.age,
      genes:  this.genes,
      x:  this.x,
      y:  this.y,
      vx: this.vx,
      vy: this.vy
    };
  }
static fromSnapshot(snap: CreatureSnapshot): Creature {
  const c = new Creature({
    id:         snap.id,
    name:       snap.name,
    sizeGene:   snap.genes.size,
    speedGene:  snap.genes.speed,
    colourGene: snap.genes.colour,
    state:      snap.state,
  });
  // Restore position
  c.x  = snap.x;
  c.y  = snap.y;
  c.vx = snap.vx;
  c.vy = snap.vy;
  return c;
}
}
//Helpers

function stuck(v: number): number {
  return Math.max(0, Math.min(0.9999, v));
}