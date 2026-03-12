export class RandomGenerator {
  // Float in [min, max) 
  static float(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  // Integer in [min, max] inclusive 
  static int(min: number, max: number): number {
    return Math.floor(RandomGenerator.float(min, max + 1));
  }

  // Pick a random element from an array 
  static pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error("Cannot pick from empty array");
    return arr[RandomGenerator.int(0, arr.length - 1)];
  }

  // Roll a boolean with a given probability (default 50%) 
  static chance(probability = 0.5): boolean {
    return Math.random() < probability;
  }
}