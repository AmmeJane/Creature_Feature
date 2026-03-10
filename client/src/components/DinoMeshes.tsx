import * as THREE from "three";

// ── Each dino is built from primitives ───────────────────────────────────────

function addPart(group: THREE.Group, geo: THREE.BufferGeometry, color: number, x=0, y=0, z=0, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) {
  const mat  = new THREE.MeshPhongMaterial({ color, shininess: 80 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  group.add(mesh);
  return mesh;
}

// ── T-Rex ─────────────────────────────────────────────────────────────────────
export function buildTRex(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.5, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.4, 1, 1);
  // Head
  addPart(g, new THREE.BoxGeometry(0.45, 0.35, 0.4), color, 0.75, 0.25, 0);
  // Jaw
  addPart(g, new THREE.BoxGeometry(0.35, 0.12, 0.3), color, 0.82, 0.02, 0);
  // Neck
  addPart(g, new THREE.CylinderGeometry(0.15, 0.22, 0.35, 8), color, 0.42, 0.15, 0, 0, 0, Math.PI/3);
  // Tail
  addPart(g, new THREE.ConeGeometry(0.18, 0.8, 8), color, -0.8, -0.1, 0, 0, 0, -Math.PI/2.5);
  // Tiny arms
  addPart(g, new THREE.CylinderGeometry(0.05, 0.04, 0.25, 6), color, 0.35, 0.1, 0.28, 0, 0, Math.PI/4);
  addPart(g, new THREE.CylinderGeometry(0.05, 0.04, 0.25, 6), color, 0.35, 0.1, -0.28, 0, 0, -Math.PI/4);
  // Legs
  addPart(g, new THREE.CylinderGeometry(0.1, 0.07, 0.55, 8), color, 0.2, -0.6, 0.22, 0.2, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.1, 0.07, 0.55, 8), color, 0.2, -0.6, -0.22, -0.2, 0, 0);
  return g;
}

// ── Triceratops ───────────────────────────────────────────────────────────────
export function buildTriceratops(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.5, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 1, 1.1);
  // Head (wide)
  addPart(g, new THREE.BoxGeometry(0.5, 0.38, 0.55), color, 0.72, 0.1, 0);
  // Frill (flat disc behind head)
  addPart(g, new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), color, 0.45, 0.2, 0, 0, 0, Math.PI/2);
  // 3 Horns
  addPart(g, new THREE.ConeGeometry(0.045, 0.35, 8), color, 1.05, 0.38,  0.15, 0, 0, Math.PI/8);
  addPart(g, new THREE.ConeGeometry(0.045, 0.35, 8), color, 1.05, 0.38, -0.15, 0, 0, -Math.PI/8);
  addPart(g, new THREE.ConeGeometry(0.03,  0.2,  8), color, 1.0,  0.15,  0,    0, 0, Math.PI/2.5);
  // Legs x4
  addPart(g, new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), color,  0.3, -0.6,  0.3);
  addPart(g, new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), color,  0.3, -0.6, -0.3);
  addPart(g, new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), color, -0.3, -0.6,  0.3);
  addPart(g, new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), color, -0.3, -0.6, -0.3);
  // Tail
  addPart(g, new THREE.ConeGeometry(0.12, 0.6, 8), color, -0.85, 0, 0, 0, 0, -Math.PI/2);
  return g;
}

// ── Stegosaurus ───────────────────────────────────────────────────────────────
export function buildStegosaurus(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body
  addPart(g, new THREE.SphereGeometry(0.5, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 1, 1);
  // Head (small)
  addPart(g, new THREE.SphereGeometry(0.22, 8, 8), color, 0.72, -0.15, 0);
  // Plates along back (diamonds)
  const platePositions = [-0.5, -0.2, 0.1, 0.4];
  platePositions.forEach((px, i) => {
    const size = i < 2 ? 0.28 : 0.22;
    addPart(g, new THREE.ConeGeometry(size * 0.5, size, 4), color, px, 0.55, 0.14, 0, Math.PI/4, 0);
    addPart(g, new THREE.ConeGeometry(size * 0.5, size, 4), color, px, 0.55, -0.14, 0, Math.PI/4, 0);
  });
  // Tail spikes
  addPart(g, new THREE.ConeGeometry(0.05, 0.3, 6), color, -0.95, 0.05,  0.15, 0, 0, -Math.PI/2.2);
  addPart(g, new THREE.ConeGeometry(0.05, 0.3, 6), color, -0.95, 0.05, -0.15, 0, 0, -Math.PI/2.2);
  // Legs x4
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.5, 8), color,  0.28, -0.6,  0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.5, 8), color,  0.28, -0.6, -0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.5, 8), color, -0.28, -0.6,  0.28);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.07, 0.5, 8), color, -0.28, -0.6, -0.28);
  return g;
}

// ── Pterodactyl ───────────────────────────────────────────────────────────────
export function buildPterodactyl(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body (slim)
  addPart(g, new THREE.SphereGeometry(0.3, 8, 8), color, 0, 0, 0, 0, 0, 0, 1.5, 0.8, 0.8);
  // Head + beak
  addPart(g, new THREE.SphereGeometry(0.2, 8, 8), color, 0.48, 0.12, 0);
  addPart(g, new THREE.ConeGeometry(0.06, 0.4, 6),  color, 0.82, 0.12, 0, 0, 0, Math.PI/2);
  // Crest
  addPart(g, new THREE.ConeGeometry(0.06, 0.3, 4), color, 0.38, 0.38, 0, 0, 0, -Math.PI/5);
  // Wings (flat boxes)
  addPart(g, new THREE.BoxGeometry(0.8, 0.04, 0.35), color, 0,  0.05,  0.6, 0.15, 0, 0.18);
  addPart(g, new THREE.BoxGeometry(0.8, 0.04, 0.35), color, 0,  0.05, -0.6, -0.15, 0, -0.18);
  // Wing tips
  addPart(g, new THREE.ConeGeometry(0.05, 0.35, 6), color, 0.3, 0.0,  1.0, 0.3, 0, Math.PI/2);
  addPart(g, new THREE.ConeGeometry(0.05, 0.35, 6), color, 0.3, 0.0, -1.0, -0.3, 0, -Math.PI/2);
  // Tail
  addPart(g, new THREE.ConeGeometry(0.06, 0.35, 6), color, -0.55, 0, 0, 0, 0, -Math.PI/2);
  return g;
}

// ── Brachiosaurus ─────────────────────────────────────────────────────────────
export function buildBrachiosaurus(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body (big)
  addPart(g, new THREE.SphereGeometry(0.55, 10, 8), color, 0, 0, 0, 0, 0, 0, 1.4, 1, 1.1);
  // Long neck (stacked cylinders)
  addPart(g, new THREE.CylinderGeometry(0.14, 0.2, 0.5, 8),  color, 0.45, 0.35, 0, 0, 0,  Math.PI/4);
  addPart(g, new THREE.CylinderGeometry(0.11, 0.14, 0.4, 8), color, 0.72, 0.65, 0, 0, 0,  Math.PI/5);
  addPart(g, new THREE.CylinderGeometry(0.08, 0.11, 0.35, 8),color, 0.92, 0.92, 0, 0, 0,  Math.PI/6);
  // Small head
  addPart(g, new THREE.SphereGeometry(0.16, 8, 8), color, 1.05, 1.1, 0);
  // Snout
  addPart(g, new THREE.BoxGeometry(0.22, 0.12, 0.14), color, 1.22, 1.08, 0);
  // Tail
  addPart(g, new THREE.ConeGeometry(0.15, 0.9, 8), color, -0.9, -0.1, 0, 0, 0, -Math.PI/2.2);
  // Legs x4 (thick)
  addPart(g, new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8), color,  0.3, -0.72,  0.32);
  addPart(g, new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8), color,  0.3, -0.72, -0.32);
  addPart(g, new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8), color, -0.3, -0.72,  0.32);
  addPart(g, new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8), color, -0.3, -0.72, -0.32);
  return g;
}

// ── Raptor ────────────────────────────────────────────────────────────────────
export function buildRaptor(color: number): THREE.Group {
  const g = new THREE.Group();
  // Body (lean, forward tilted)
  addPart(g, new THREE.SphereGeometry(0.38, 8, 8), color, 0, 0, 0, 0, 0, 0.25, 1.3, 0.9, 0.9);
  // Head
  addPart(g, new THREE.BoxGeometry(0.38, 0.28, 0.28), color, 0.6, 0.28, 0);
  // Snout
  addPart(g, new THREE.BoxGeometry(0.28, 0.16, 0.2), color, 0.82, 0.18, 0);
  // Neck
  addPart(g, new THREE.CylinderGeometry(0.12, 0.18, 0.3, 8), color, 0.35, 0.2, 0, 0, 0, Math.PI/3.5);
  // Arms (slightly longer than trex)
  addPart(g, new THREE.CylinderGeometry(0.05, 0.04, 0.3, 6), color, 0.25, 0.08,  0.25, 0, 0,  Math.PI/3.5);
  addPart(g, new THREE.CylinderGeometry(0.05, 0.04, 0.3, 6), color, 0.25, 0.08, -0.25, 0, 0, -Math.PI/3.5);
  // Sickle claw (cone on foot)
  addPart(g, new THREE.ConeGeometry(0.04, 0.2, 6), color, 0.35, -0.72,  0.22, 0, 0, -Math.PI/2);
  addPart(g, new THREE.ConeGeometry(0.04, 0.2, 6), color, 0.35, -0.72, -0.22, 0, 0, -Math.PI/2);
  // Legs
  addPart(g, new THREE.CylinderGeometry(0.09, 0.06, 0.52, 8), color, 0.2, -0.52,  0.2, 0.25, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.09, 0.06, 0.52, 8), color, 0.2, -0.52, -0.2, -0.25, 0, 0);
  // Long stiff tail
  addPart(g, new THREE.ConeGeometry(0.1, 0.85, 8), color, -0.75, -0.05, 0, 0, 0, -Math.PI/2.1);
  return g;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export type DinoType = "trex" | "triceratops" | "stegosaurus" | "pterodactyl" | "brachiosaurus" | "raptor";

export const DINO_TYPES: DinoType[] = [
  "trex", "triceratops", "stegosaurus", "pterodactyl", "brachiosaurus", "raptor"
];

export const DINO_EMOJI: Record<DinoType, string> = {
  trex:          "🦖",
  triceratops:   "🦕",
  stegosaurus:   "🦴",
  pterodactyl:   "🦅",
  brachiosaurus: "🦒",
  raptor:        "🔪",
};

export function buildDino(type: DinoType, color: number): THREE.Group {
  switch (type) {
    case "trex":          return buildTRex(color);
    case "triceratops":   return buildTriceratops(color);
    case "stegosaurus":   return buildStegosaurus(color);
    case "pterodactyl":   return buildPterodactyl(color);
    case "brachiosaurus": return buildBrachiosaurus(color);
    case "raptor":        return buildRaptor(color);
  }
}