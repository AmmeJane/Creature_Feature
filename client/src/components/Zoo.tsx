import * as THREE from "three";

// ── Shared helper ─────────────────────────────────────────────────────────────

function addPart(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  color: number,
  x = 0, y = 0, z = 0,
  rx = 0, ry = 0, rz = 0,
  sx = 1, sy = 1, sz = 1
): THREE.Mesh {
  const mat  = new THREE.MeshPhongMaterial({ color, shininess: 80 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  group.add(mesh);
  return mesh;
}

// ── 🦁 Lion ───────────────────────────────────────────────────────────────────
export function buildLion(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.45, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 1, 1);
  // Head
  addPart(g, new THREE.SphereGeometry(0.32, 10, 8), color, 0.65, 0.15, 0);
  // Mane (larger slightly darker sphere behind head)
  addPart(g, new THREE.SphereGeometry(0.42, 10, 8), color * 0.7, 0.58, 0.12, 0, 0, 0, 0, 1.1, 1.1, 1.1);
  // Snout
  addPart(g, new THREE.SphereGeometry(0.14, 8, 8), color, 0.9, 0.08, 0, 0, 0, 0, 1.3, 0.8, 0.9);
  // Ears
  addPart(g, new THREE.ConeGeometry(0.08, 0.14, 6), color, 0.62, 0.5,  0.2, 0, 0, -Math.PI/8);
  addPart(g, new THREE.ConeGeometry(0.08, 0.14, 6), color, 0.62, 0.5, -0.2, 0, 0,  Math.PI/8);
  // Legs x4
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.52, 8), color,  0.28, -0.6,  0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.52, 8), color,  0.28, -0.6, -0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.52, 8), color, -0.28, -0.6,  0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.52, 8), color, -0.28, -0.6, -0.28);
  // Tail + tuft
  addPart(g, new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), color, -0.75, 0.05, 0, 0, 0, Math.PI/2.2);
  addPart(g, new THREE.SphereGeometry(0.1, 8, 8),  color, -1.05, 0.22, 0);
  return g;
}

// ── 🐘 Elephant ───────────────────────────────────────────────────────────────
export function buildElephant(color: number): THREE.Group {
  const g = new THREE.Group();
  // Massive body
  addPart(g, new THREE.SphereGeometry(0.55, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 1.1, 1.2);
  // Big round head
  addPart(g, new THREE.SphereGeometry(0.42, 10, 8), color, 0.72, 0.18, 0);
  // Trunk (stacked cylinders curving down)
  addPart(g, new THREE.CylinderGeometry(0.1, 0.12, 0.35, 8), color, 1.0,  0.0,  0, 0, 0, Math.PI/2);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.1,  0.28, 8), color, 1.22,-0.18, 0, 0, 0, Math.PI/2.4);
  addPart(g, new THREE.CylinderGeometry(0.06, 0.08, 0.2,  8), color, 1.32,-0.38, 0, 0, 0, Math.PI/2.8);
  // Big ears (flat ellipsoids)
  addPart(g, new THREE.SphereGeometry(0.35, 8, 8), color, 0.55, 0.2,  0.5, 0, 0, 0, 0.3, 1, 1);
  addPart(g, new THREE.SphereGeometry(0.35, 8, 8), color, 0.55, 0.2, -0.5, 0, 0, 0, 0.3, 1, 1);
  // Tusks
  addPart(g, new THREE.ConeGeometry(0.04, 0.38, 6), color, 1.08, -0.08,  0.18, 0, 0, Math.PI/2.2);
  addPart(g, new THREE.ConeGeometry(0.04, 0.38, 6), color, 1.08, -0.08, -0.18, 0, 0, Math.PI/2.2);
  // Thick legs x4
  addPart(g, new THREE.CylinderGeometry(0.13, 0.11, 0.6, 8), color,  0.3, -0.75,  0.35);
  addPart(g, new THREE.CylinderGeometry(0.13, 0.11, 0.6, 8), color,  0.3, -0.75, -0.35);
  addPart(g, new THREE.CylinderGeometry(0.13, 0.11, 0.6, 8), color, -0.3, -0.75,  0.35);
  addPart(g, new THREE.CylinderGeometry(0.13, 0.11, 0.6, 8), color, -0.3, -0.75, -0.35);
  // Stubby tail
  addPart(g, new THREE.ConeGeometry(0.04, 0.22, 6), color, -0.92, 0.1, 0, 0, 0, -Math.PI/2);
  return g;
}

// ── 🦒 Giraffe ────────────────────────────────────────────────────────────────
export function buildGiraffe(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.42, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.4, 1, 1);
  // Very long neck (4 segments)
  addPart(g, new THREE.CylinderGeometry(0.13, 0.18, 0.45, 8), color, 0.4,  0.4,  0, 0, 0,  Math.PI/5);
  addPart(g, new THREE.CylinderGeometry(0.11, 0.13, 0.42, 8), color, 0.65, 0.78, 0, 0, 0,  Math.PI/7);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.11, 0.40, 8), color, 0.85, 1.14, 0, 0, 0,  Math.PI/9);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.09, 0.38, 8), color, 0.98, 1.48, 0, 0, 0,  Math.PI/11);
  // Small head
  addPart(g, new THREE.SphereGeometry(0.18, 8, 8), color, 1.08, 1.72, 0);
  // Snout
  addPart(g, new THREE.BoxGeometry(0.22, 0.14, 0.14), color, 1.25, 1.68, 0);
  // Ossicones (horn nubs)
  addPart(g, new THREE.CylinderGeometry(0.02, 0.03, 0.14, 6), color, 1.06, 1.9,  0.08);
  addPart(g, new THREE.CylinderGeometry(0.02, 0.03, 0.14, 6), color, 1.06, 1.9, -0.08);
  // Long legs x4
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8), color,  0.25, -0.78,  0.25);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8), color,  0.25, -0.78, -0.25);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8), color, -0.25, -0.78,  0.25);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8), color, -0.25, -0.78, -0.25);
  // Tail
  addPart(g, new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), color, -0.72, -0.05, 0, 0, 0, Math.PI/2.3);
  return g;
}

// ── 🐊 Crocodile ──────────────────────────────────────────────────────────────
export function buildCrocodile(color: number): THREE.Group {
  const g = new THREE.Group();
  // Long flat body
  addPart(g, new THREE.SphereGeometry(0.4, 10, 8), color, 0, 0, 0, 0, 0, 0, 2.0, 0.55, 0.9);
  // Head (wide flat snout)
  addPart(g, new THREE.BoxGeometry(0.65, 0.18, 0.44), color, 0.88, 0.0, 0);
  // Upper jaw ridge
  addPart(g, new THREE.BoxGeometry(0.55, 0.1, 0.36), color, 0.85, 0.1, 0);
  // Teeth bumps
  for (let i = 0; i < 4; i++) {
    addPart(g, new THREE.ConeGeometry(0.03, 0.08, 4), color, 0.68 + i * 0.12, 0.08,  0.2, 0, 0, 0);
    addPart(g, new THREE.ConeGeometry(0.03, 0.08, 4), color, 0.68 + i * 0.12, 0.08, -0.2, 0, 0, 0);
  }
  // Back ridges
  for (let i = 0; i < 5; i++) {
    addPart(g, new THREE.ConeGeometry(0.06, 0.15, 4), color, -0.2 + i * -0.18, 0.22, 0);
  }
  // Short legs x4
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.28, 6), color,  0.2, -0.3,  0.42, 0.5, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.28, 6), color,  0.2, -0.3, -0.42, -0.5, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.28, 6), color, -0.3, -0.3,  0.42, 0.5, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.07, 0.06, 0.28, 6), color, -0.3, -0.3, -0.42, -0.5, 0, 0);
  // Long tail
  addPart(g, new THREE.ConeGeometry(0.2, 1.0, 8), color, -0.95, 0, 0, 0, 0, -Math.PI/2, 1, 0.55, 0.9);
  return g;
}

// ── 🦓 Zebra ──────────────────────────────────────────────────────────────────
export function buildZebra(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.45, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 1, 1);
  // Head
  addPart(g, new THREE.SphereGeometry(0.24, 8, 8), color, 0.68, 0.2, 0);
  // Long snout / muzzle
  addPart(g, new THREE.BoxGeometry(0.3, 0.2, 0.18), color, 0.9, 0.1, 0);
  // Neck
  addPart(g, new THREE.CylinderGeometry(0.14, 0.18, 0.38, 8), color, 0.4, 0.22, 0, 0, 0, Math.PI/4);
  // Mane (flat ridge on top of neck)
  addPart(g, new THREE.BoxGeometry(0.35, 0.18, 0.06), color * 0.1, 0.45, 0.44, 0, 0, 0, Math.PI/4);
  // Ears
  addPart(g, new THREE.ConeGeometry(0.055, 0.16, 6), color, 0.65, 0.46,  0.14, 0, 0, -Math.PI/10);
  addPart(g, new THREE.ConeGeometry(0.055, 0.16, 6), color, 0.65, 0.46, -0.14, 0, 0,  Math.PI/10);
  // Legs x4
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.62, 8), color,  0.28, -0.68,  0.26);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.62, 8), color,  0.28, -0.68, -0.26);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.62, 8), color, -0.28, -0.68,  0.26);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.62, 8), color, -0.28, -0.68, -0.26);
  // Tail
  addPart(g, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 6), color, -0.82, -0.02, 0, 0, 0, Math.PI/2.4);
  addPart(g, new THREE.SphereGeometry(0.08, 6, 6), color * 0.1, -1.04, -0.2, 0);
  return g;
}

// ── 🐒 Monkey ─────────────────────────────────────────────────────────────────
export function buildMonkey(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body (upright, smaller)
  addPart(g, new THREE.SphereGeometry(0.35, 8, 8), color, 0, 0, 0, 0, 0, 0, 1.1, 1.2, 0.9);
  // Round head
  addPart(g, new THREE.SphereGeometry(0.28, 8, 8), color, 0.0, 0.6, 0);
  // Face disc (lighter)
  addPart(g, new THREE.SphereGeometry(0.18, 8, 8), color, 0.18, 0.58, 0, 0, 0, 0, 0.5, 0.7, 0.5);
  // Ears
  addPart(g, new THREE.SphereGeometry(0.1, 8, 8), color, 0.02, 0.62,  0.3);
  addPart(g, new THREE.SphereGeometry(0.1, 8, 8), color, 0.02, 0.62, -0.3);
  // Arms
  addPart(g, new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), color, 0.0, 0.15,  0.42, 0, 0,  Math.PI/3);
  addPart(g, new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), color, 0.0, 0.15, -0.42, 0, 0, -Math.PI/3);
  // Hands
  addPart(g, new THREE.SphereGeometry(0.08, 6, 6), color, 0.18, -0.12,  0.55);
  addPart(g, new THREE.SphereGeometry(0.08, 6, 6), color, 0.18, -0.12, -0.55);
  // Legs
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8), color, 0.0, -0.58,  0.18);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8), color, 0.0, -0.58, -0.18);
  // Long curvy tail
  addPart(g, new THREE.CylinderGeometry(0.04, 0.03, 0.55, 6), color, -0.3, 0.1, 0, 0, 0,  Math.PI/2.5);
  addPart(g, new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6), color, -0.58, 0.35, 0, 0, 0, Math.PI/1.8);
  return g;
}

// ── 🐧 Penguin ────────────────────────────────────────────────────────────────
export function buildPenguin(color: number): THREE.Group {
  const g = new THREE.Group();
  // Plump upright body
  addPart(g, new THREE.SphereGeometry(0.38, 8, 8), color, 0, 0, 0, 0, 0, 0, 0.9, 1.3, 0.95);
  // White belly
  addPart(g, new THREE.SphereGeometry(0.28, 8, 8), 0xeeeeee, 0.16, 0, 0, 0, 0, 0, 0.5, 1.1, 0.8);
  // Round head
  addPart(g, new THREE.SphereGeometry(0.25, 8, 8), color, 0, 0.58, 0);
  // White face patch
  addPart(g, new THREE.SphereGeometry(0.16, 8, 8), 0xeeeeee, 0.1, 0.56, 0, 0, 0, 0, 0.6, 0.7, 0.5);
  // Orange beak
  addPart(g, new THREE.ConeGeometry(0.055, 0.18, 6), 0xffaa00, 0.22, 0.55, 0, 0, 0, Math.PI/2);
  // Flipper wings
  addPart(g, new THREE.SphereGeometry(0.2, 6, 6), color, -0.05, 0.08,  0.42, 0, 0, 0.5, 0.35, 1, 0.3);
  addPart(g, new THREE.SphereGeometry(0.2, 6, 6), color, -0.05, 0.08, -0.42, 0, 0, -0.5, 0.35, 1, 0.3);
  // Stubby legs
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.28, 8), color, 0, -0.65,  0.16);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.28, 8), color, 0, -0.65, -0.16);
  // Orange feet
  addPart(g, new THREE.SphereGeometry(0.1, 6, 6), 0xffaa00, 0.08, -0.82,  0.18, 0, 0, 0, 1.4, 0.4, 1);
  addPart(g, new THREE.SphereGeometry(0.1, 6, 6), 0xffaa00, 0.08, -0.82, -0.18, 0, 0, 0, 1.4, 0.4, 1);
  return g;
}

// ── 🦏 Rhino ──────────────────────────────────────────────────────────────────
export function buildRhino(color: number): THREE.Group {
  const g = new THREE.Group();
  // Huge body
  addPart(g, new THREE.SphereGeometry(0.55, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.6, 1.1, 1.2);
  // Big angular head
  addPart(g, new THREE.BoxGeometry(0.55, 0.42, 0.5), color, 0.78, 0.08, 0);
  // Horn (big front one)
  addPart(g, new THREE.ConeGeometry(0.07, 0.45, 8), color * 0.6, 1.08, 0.38, 0, 0, 0, Math.PI/2.2);
  // Small second horn
  addPart(g, new THREE.ConeGeometry(0.045, 0.22, 8), color * 0.6, 0.88, 0.32, 0, 0, 0, Math.PI/2.5);
  // Ears (small)
  addPart(g, new THREE.ConeGeometry(0.06, 0.12, 6), color, 0.72, 0.38,  0.25, 0, 0, -Math.PI/6);
  addPart(g, new THREE.ConeGeometry(0.06, 0.12, 6), color, 0.72, 0.38, -0.25, 0, 0,  Math.PI/6);
  // Armour skin folds (rings around body)
  addPart(g, new THREE.TorusGeometry(0.52, 0.055, 6, 16), color * 0.85, -0.1, 0, 0, 0, 0, Math.PI/2);
  addPart(g, new THREE.TorusGeometry(0.50, 0.055, 6, 16), color * 0.85,  0.25, 0, 0, 0, 0, Math.PI/2);
  // Very thick legs
  addPart(g, new THREE.CylinderGeometry(0.14, 0.12, 0.55, 8), color,  0.32, -0.7,  0.36);
  addPart(g, new THREE.CylinderGeometry(0.14, 0.12, 0.55, 8), color,  0.32, -0.7, -0.36);
  addPart(g, new THREE.CylinderGeometry(0.14, 0.12, 0.55, 8), color, -0.32, -0.7,  0.36);
  addPart(g, new THREE.CylinderGeometry(0.14, 0.12, 0.55, 8), color, -0.32, -0.7, -0.36);
  // Stubby tail
  addPart(g, new THREE.ConeGeometry(0.05, 0.25, 6), color, -0.98, 0.08, 0, 0, 0, -Math.PI/2);
  return g;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export type ZooAnimalType =
  | "lion" | "elephant" | "giraffe" | "crocodile"
  | "zebra" | "monkey"  | "penguin" | "rhino";

export const ZOO_ANIMAL_TYPES: ZooAnimalType[] = [
  "lion", "elephant", "giraffe", "crocodile",
  "zebra", "monkey", "penguin", "rhino",
];

export const ZOO_ANIMAL_EMOJI: Record<ZooAnimalType, string> = {
  lion:       "🦁",
  elephant:   "🐘",
  giraffe:    "🦒",
  crocodile:  "🐊",
  zebra:      "🦓",
  monkey:     "🐒",
  penguin:    "🐧",
  rhino:      "🦏",
};

export function buildZooAnimal(type: ZooAnimalType, color: number): THREE.Group {
  switch (type) {
    case "lion":      return buildLion(color);
    case "elephant":  return buildElephant(color);
    case "giraffe":   return buildGiraffe(color);
    case "crocodile": return buildCrocodile(color);
    case "zebra":     return buildZebra(color);
    case "monkey":    return buildMonkey(color);
    case "penguin":   return buildPenguin(color);
    case "rhino":     return buildRhino(color);
  }
}