import { DINO_TYPES, DINO_EMOJI } from "../components/creatures/DinoMeshes";
import type { DinoType } from "../components/creatures/DinoMeshes";
import { ZOO_ANIMAL_TYPES, ZOO_ANIMAL_EMOJI } from "../components/creatures/ZooMeshes";
import type { ZooAnimalType } from "../components/creatures/ZooMeshes";

export function getCreatureEmoji(type: string): string {
  if (DINO_TYPES.includes(type as DinoType)) return DINO_EMOJI[type as DinoType];
  if (ZOO_ANIMAL_TYPES.includes(type as ZooAnimalType)) return ZOO_ANIMAL_EMOJI[type as ZooAnimalType];
  return "🦖";
}