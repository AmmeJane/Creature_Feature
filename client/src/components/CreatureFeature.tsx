

import * as fs from "fs";
import * as path from "path";
import { Creature, CreatureSnapshot, CreatureState } from "./pages/Creature";

interface CreatureFile {
  creatures: CreatureSnapshot[];
}

export class CreatureRepository {
  private store = new Map<string, Creature>();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  //Load from JSON 

  load(): void {
    const raw  = fs.readFileSync(this.filePath, "utf-8");
    const data = JSON.parse(raw) as CreatureFile;

    for (const snap of data.creatures) {
      this.store.set(snap.id, Creature.fromSnapshot(snap));
    }
    console.log("  Loaded ${this.store.size} creatures from ${this.filePath}");
  }

  //  CRUD 

  getAll(): Creature[]                     { return [...this.store.values()]; }
  getById(id: string): Creature | undefined { return this.store.get(id); }

  add(opts: ConstructorParameters<typeof Creature>[0] = {}): Creature {
    const c = new Creature(opts);
    this.store.set(c.id, c);
    return c;
  }

  remove(id: string): boolean { return this.store.delete(id); }

  //  Simulation 

  tickAll(): void { this.store.forEach((c) => c.update()); }

  //  Persist 

  save(): void {
    const data: CreatureFile = { creatures: this.getAll().map((c) => c.toSnapshot()) };
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`💾  Saved ${data.creatures.length} creatures`);
  }
}