import * as THREE from "three";

// ── Seeded RNG from creature ID ───────────────────────────────────────────────
function makeRng(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(31, hash) + id.charCodeAt(i)) | 0;
  }
  let seed = Math.abs(hash);
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return Math.abs(seed) / 2147483648;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Colour from gene (0–1) ────────────────────────────────────────────────────
export function geneToColour(gene: number): number {
  const hue = (200 + gene * 300) % 360;
  const s = 0.65, l = 0.55;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (hue < 60)  { r=c; g=x; b=0; }
  else if (hue < 120) { r=x; g=c; b=0; }
  else if (hue < 180) { r=0; g=c; b=x; }
  else if (hue < 240) { r=0; g=x; b=c; }
  else if (hue < 300) { r=x; g=0; b=c; }
  else                { r=c; g=0; b=x; }
  return (Math.round((r+m)*255) << 16) | (Math.round((g+m)*255) << 8) | Math.round((b+m)*255);
}

export function geneToColourHex(gene: number): string {
  return `#${geneToColour(gene).toString(16).padStart(6, "0")}`;
}

// ── Part helpers ──────────────────────────────────────────────────────────────
// Normal part — tinted by RAF loop to match creature colour
function part(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  color: number,
  x = 0, y = 0, z = 0,
  rx = 0, ry = 0, rz = 0,
  sx = 1, sy = 1, sz = 1,
): THREE.Mesh {
  const mat  = new THREE.MeshPhongMaterial({ color, shininess: 60, flatShading: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  group.add(mesh);
  return mesh;
}

// Fixed part — colour never overridden by RAF loop
function fixedPart(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  color: number,
  x = 0, y = 0, z = 0,
  rx = 0, ry = 0, rz = 0,
  sx = 1, sy = 1, sz = 1,
): THREE.Mesh {
  const mat  = new THREE.MeshPhongMaterial({ color, shininess: 60, flatShading: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  mesh.userData.fixedColor = true;
  group.add(mesh);
  return mesh;
}

// ── Category types ────────────────────────────────────────────────────────────
export type CreatureCategory = "mammal" | "slime" | "aquatic";

export interface ProceduralCreatureOpts {
  id:       string;
  category: CreatureCategory;
  color:    number;
  size:     number;
  speed:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAMMALS
// ─────────────────────────────────────────────────────────────────────────────

type BodyShape   = "round" | "stocky" | "lean";
type EarShape    = "pointed" | "round" | "floppy" | "none";
type TailShape   = "long" | "bushy" | "stubby" | "curled" | "none";
type SnoutShape  = "flat" | "long" | "wide";
type BackFeature = "plain" | "mane" | "spines" | "hump";

function buildMammal(opts: ProceduralCreatureOpts): THREE.Group {
  const { id, color, size, speed } = opts;
  const rng  = makeRng(id);
  const g    = new THREE.Group();
  const dark = Math.max(0, color - 0x333333);

  const body:  BodyShape   = pick(["round","stocky","lean"], rng);
  const ears:  EarShape    = pick(["pointed","round","floppy","none"], rng);
  const tail:  TailShape   = pick(["long","bushy","stubby","curled","none"], rng);
  const snout: SnoutShape  = pick(["flat","long","wide"], rng);
  const back:  BackFeature = pick(["plain","mane","spines","hump"], rng);

  const legLen = 0.35 + speed * 0.35;
  const bodyW  = body === "stocky" ? 1.6 : body === "lean" ? 1.2 : 1.4;
  const bodyH  = body === "stocky" ? 1.1 : body === "lean" ? 0.85 : 1.0;

  // Body
  part(g, new THREE.SphereGeometry(0.45, 8, 6), color, 0, 0, 0, 0,0,0, bodyW, bodyH, 1.0);
  // Head
  part(g, new THREE.SphereGeometry(0.26 + size * 0.06, 8, 6), color, 0.62, 0.18, 0);
  // Neck
  part(g, new THREE.CylinderGeometry(0.12, 0.18, 0.28, 7), color, 0.38, 0.18, 0, 0, 0, Math.PI/4);

  // Snout
  if (snout === "long")
    part(g, new THREE.BoxGeometry(0.32, 0.14, 0.16), color, 0.88, 0.12, 0);
  else if (snout === "wide")
    part(g, new THREE.BoxGeometry(0.2, 0.12, 0.28), color, 0.82, 0.1, 0);
  else
    part(g, new THREE.SphereGeometry(0.12, 6, 5), color, 0.82, 0.14, 0, 0,0,0, 1.2,0.8,0.9);

  // Eyes — always fixed white + black
  fixedPart(g, new THREE.SphereGeometry(0.055, 6, 5), 0xffffff, 0.72, 0.26,  0.15);
  fixedPart(g, new THREE.SphereGeometry(0.055, 6, 5), 0xffffff, 0.72, 0.26, -0.15);
  fixedPart(g, new THREE.SphereGeometry(0.03,  5, 4), 0x111111, 0.76, 0.26,  0.17);
  fixedPart(g, new THREE.SphereGeometry(0.03,  5, 4), 0x111111, 0.76, 0.26, -0.17);

  // Ears
  if (ears === "pointed") {
    part(g, new THREE.ConeGeometry(0.07, 0.2, 5), color, 0.6, 0.48,  0.16, 0,0,-Math.PI/10);
    part(g, new THREE.ConeGeometry(0.07, 0.2, 5), color, 0.6, 0.48, -0.16, 0,0, Math.PI/10);
    // inner ear
    fixedPart(g, new THREE.ConeGeometry(0.035, 0.12, 5), 0xff9999, 0.6, 0.49,  0.16, 0,0,-Math.PI/10);
    fixedPart(g, new THREE.ConeGeometry(0.035, 0.12, 5), 0xff9999, 0.6, 0.49, -0.16, 0,0, Math.PI/10);
  } else if (ears === "round") {
    part(g, new THREE.SphereGeometry(0.1, 6, 5), color, 0.6, 0.46,  0.2);
    part(g, new THREE.SphereGeometry(0.1, 6, 5), color, 0.6, 0.46, -0.2);
    fixedPart(g, new THREE.SphereGeometry(0.055, 6, 5), 0xff9999, 0.62, 0.46,  0.24);
    fixedPart(g, new THREE.SphereGeometry(0.055, 6, 5), 0xff9999, 0.62, 0.46, -0.24);
  } else if (ears === "floppy") {
    part(g, new THREE.SphereGeometry(0.13, 6, 5), color, 0.58, 0.32,  0.28, 0.3,0,0, 0.5,1.2,0.4);
    part(g, new THREE.SphereGeometry(0.13, 6, 5), color, 0.58, 0.32, -0.28,-0.3,0,0, 0.5,1.2,0.4);
  }

  // Legs x4
  [[0.25,-0.26],[0.25,0.26],[-0.25,-0.26],[-0.25,0.26]].forEach(([bx,bz]) => {
    part(g, new THREE.CylinderGeometry(0.08, 0.06, legLen, 6), color, bx, -(0.35 + legLen/2), bz);
    // paws
    fixedPart(g, new THREE.SphereGeometry(0.07, 6, 5), dark, bx, -(0.35 + legLen) + 0.02, bz, 0,0,0, 1.2,0.5,1.2);
  });

  // Tail
  if (tail === "long") {
    part(g, new THREE.ConeGeometry(0.06, 0.7, 6), color, -0.72, 0.05, 0, 0,0,-Math.PI/2.2);
  } else if (tail === "bushy") {
    part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), color, -0.7, 0.05, 0, 0,0, Math.PI/2.3);
    part(g, new THREE.SphereGeometry(0.14, 6, 5), color, -0.98, 0.22, 0);
  } else if (tail === "stubby") {
    part(g, new THREE.SphereGeometry(0.1, 6, 5), color, -0.7, 0.05, 0, 0,0,0, 1.4,0.8,0.8);
  } else if (tail === "curled") {
    part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), color, -0.68, 0.12, 0, 0,0, Math.PI/2.5);
    part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.28, 6), color, -0.82, 0.28, 0, 0,0, Math.PI/1.6);
  }

  // Back feature
  if (back === "mane") {
    [-0.2, 0.05, 0.28].forEach(bx =>
      fixedPart(g, new THREE.ConeGeometry(0.06, 0.24, 5), dark, bx, 0.48, 0)
    );
  } else if (back === "spines") {
    [-0.4,-0.18,0.05,0.28].forEach(bx =>
      fixedPart(g, new THREE.ConeGeometry(0.04, 0.22, 4), dark, bx, 0.48, 0)
    );
  } else if (back === "hump") {
    part(g, new THREE.SphereGeometry(0.22, 7, 5), color, -0.1, 0.44, 0, 0,0,0, 1,0.7,0.8);
  }

  // Nose
  fixedPart(g, new THREE.SphereGeometry(0.04, 5, 4), 0x222222, 0.88, 0.18, 0);

  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIMES
// ─────────────────────────────────────────────────────────────────────────────

type SlimeBody      = "blob" | "tall" | "flat";
type SlimeEyes      = "single" | "double" | "stalks";
type SlimeAppendage = "tendrils" | "bubbles" | "spikes" | "none";
type SlimeMouth     = "grin" | "round" | "none";

function buildSlime(opts: ProceduralCreatureOpts): THREE.Group {
  const { id, color } = opts;
  const rng   = makeRng(id);
  const g     = new THREE.Group();
  const bright = Math.min(0xffffff, color + 0x444444);

  const body:      SlimeBody      = pick(["blob","tall","flat"], rng);
  const eyes:      SlimeEyes      = pick(["single","double","stalks"], rng);
  const appendage: SlimeAppendage = pick(["tendrils","bubbles","spikes","none"], rng);
  const mouth:     SlimeMouth     = pick(["grin","round","none"], rng);

  const bw   = body === "flat" ? 1.6 : body === "tall" ? 0.9 : 1.2;
  const bh   = body === "flat" ? 0.7 : body === "tall" ? 1.5 : 1.0;
  const eyeY = body === "tall" ? 0.45 : 0.28;

  // Body
  part(g, new THREE.SphereGeometry(0.5, 8, 6), color, 0, 0, 0, 0,0,0, bw, bh, 1.0);
  part(g, new THREE.SphereGeometry(0.38, 7, 5), color, 0, -0.3, 0, 0,0,0, bw*0.9, 0.6, 0.9);

  // Eyes — always fixed
  if (eyes === "single") {
    fixedPart(g, new THREE.SphereGeometry(0.14, 6, 5), 0xffffff, 0.32, eyeY, 0.25);
    fixedPart(g, new THREE.SphereGeometry(0.07, 5, 4), 0x111111, 0.38, eyeY, 0.32);
  } else if (eyes === "double") {
    fixedPart(g, new THREE.SphereGeometry(0.1, 6, 5),  0xffffff, 0.3, eyeY,  0.2);
    fixedPart(g, new THREE.SphereGeometry(0.1, 6, 5),  0xffffff, 0.3, eyeY, -0.2);
    fixedPart(g, new THREE.SphereGeometry(0.05, 5, 4), 0x111111, 0.36, eyeY,  0.24);
    fixedPart(g, new THREE.SphereGeometry(0.05, 5, 4), 0x111111, 0.36, eyeY, -0.24);
  } else if (eyes === "stalks") {
    part(g, new THREE.CylinderGeometry(0.03,0.03,0.2,5), color, 0.3, eyeY+0.15,  0.18);
    part(g, new THREE.CylinderGeometry(0.03,0.03,0.2,5), color, 0.3, eyeY+0.15, -0.18);
    fixedPart(g, new THREE.SphereGeometry(0.09, 6, 5),  0xffffff, 0.34, eyeY+0.28,  0.18);
    fixedPart(g, new THREE.SphereGeometry(0.09, 6, 5),  0xffffff, 0.34, eyeY+0.28, -0.18);
    fixedPart(g, new THREE.SphereGeometry(0.045, 5, 4), 0x111111, 0.38, eyeY+0.3,   0.2);
    fixedPart(g, new THREE.SphereGeometry(0.045, 5, 4), 0x111111, 0.38, eyeY+0.3,  -0.2);
  }

  // Mouth — always fixed dark
  if (mouth === "round") {
    fixedPart(g, new THREE.SphereGeometry(0.08, 6, 5), 0x111111, 0.48, eyeY-0.18, 0, 0,0,0, 1.4,0.6,0.6);
  } else if (mouth === "grin") {
    [-0.16,-0.05,0.06,0.17].forEach(mz =>
      fixedPart(g, new THREE.SphereGeometry(0.04, 5, 4), 0x111111, 0.48, eyeY-0.18, mz)
    );
  }

  // Appendages
  if (appendage === "tendrils") {
    [[-0.3, Math.PI/5],[-0.1, Math.PI/3.5],[0.1, Math.PI/4.5]].forEach(([az, ar], i) => {
      const side = i % 2 === 0 ? 1 : -1;
      part(g, new THREE.CylinderGeometry(0.04,0.02,0.38,5), color, az as number, 0.1, side*0.52, 0,0,(ar as number)*side);
    });
  } else if (appendage === "bubbles") {
    [[0.2,0.55,0.32],[0.0,0.62,0.28],[-0.18,0.5,0.24],[0.1,0.58,-0.3]].forEach(([bx,by,bz]) => {
      const s = 0.08 + rng() * 0.06;
      fixedPart(g, new THREE.SphereGeometry(s, 6, 5), bright, bx, by, bz);
    });
  } else if (appendage === "spikes") {
    [[-0.35,0.45,0.0],[0.0,0.58,0.0],[0.22,0.42,0.18],[0.22,0.42,-0.18]].forEach(([sx,sy,sz]) =>
      part(g, new THREE.ConeGeometry(0.05,0.22,4), color, sx, sy, sz)
    );
  }

  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// AQUATIC
// ─────────────────────────────────────────────────────────────────────────────

type FishBody  = "round" | "flat" | "long";
type FishFin   = "tall" | "wide" | "spiky" | "none";
type FishTail  = "forked" | "fan" | "pointed";
type FishFace  = "normal" | "wide" | "beak";

function buildAquatic(opts: ProceduralCreatureOpts): THREE.Group {
  const { id, color, speed } = opts;
  const rng   = makeRng(id);
  const g     = new THREE.Group();
  const bright = Math.min(0xffffff, color + 0x444444);
  const dark   = Math.max(0, color - 0x222222);

  const body: FishBody = pick(["round","flat","long"], rng);
  const fin:  FishFin  = pick(["tall","wide","spiky","none"], rng);
  const tail: FishTail = pick(["forked","fan","pointed"], rng);
  const face: FishFace = pick(["normal","wide","beak"], rng);

  const bw = body === "long" ? 1.8 : body === "flat" ? 1.3 : 1.2;
  const bh = body === "flat" ? 0.65 : 1.0;
  const bz = body === "flat" ? 1.3  : 0.9;

  // Body
  part(g, new THREE.SphereGeometry(0.42, 8, 6), color, 0, 0, 0, 0,0,0, bw, bh, bz);
  // Head
  part(g, new THREE.SphereGeometry(0.28, 7, 6), color, 0.55, 0.05, 0, 0,0,0, 1.1, bh, bz*0.9);
  // Belly stripe
  fixedPart(g, new THREE.SphereGeometry(0.35, 7, 5), bright, 0.05, -0.05, 0, 0,0,0, bw*0.7, bh*0.6, bz*0.5);

  // Face
  if (face === "wide") {
    fixedPart(g, new THREE.BoxGeometry(0.12, 0.08, 0.36), 0x111111, 0.8, -0.04, 0);
  } else if (face === "beak") {
    part(g, new THREE.ConeGeometry(0.05, 0.3, 6), color, 0.92, 0.05, 0, 0,0, Math.PI/2);
  } else {
    fixedPart(g, new THREE.SphereGeometry(0.09, 6, 5), 0x111111, 0.8, -0.04, 0, 0,0,0, 1,0.5,0.7);
  }

  // Eyes — always fixed
  fixedPart(g, new THREE.SphereGeometry(0.07, 6, 5),  0xffffff, 0.68, 0.16,  0.2);
  fixedPart(g, new THREE.SphereGeometry(0.07, 6, 5),  0xffffff, 0.68, 0.16, -0.2);
  fixedPart(g, new THREE.SphereGeometry(0.035, 5, 4), 0x111111, 0.73, 0.16,  0.24);
  fixedPart(g, new THREE.SphereGeometry(0.035, 5, 4), 0x111111, 0.73, 0.16, -0.24);

  // Pectoral fins
  part(g, new THREE.SphereGeometry(0.18, 6, 5), color, 0.1, -0.08,  0.44, 0.2,0, 0.3, 0.35,0.8,1);
  part(g, new THREE.SphereGeometry(0.18, 6, 5), color, 0.1, -0.08, -0.44,-0.2,0,-0.3, 0.35,0.8,1);

  // Dorsal fin
  if (fin === "tall") {
    part(g, new THREE.ConeGeometry(0.08, 0.42, 5), dark, -0.05, 0.44, 0, 0,0,0, 1,1,0.3);
  } else if (fin === "wide") {
    part(g, new THREE.BoxGeometry(0.45, 0.28, 0.06), dark, -0.08, 0.42, 0);
  } else if (fin === "spiky") {
    [-0.18,0.0,0.18].forEach((fx, i) => {
      const h = [0.32,0.42,0.28][i];
      part(g, new THREE.ConeGeometry(0.05, h, 4), dark, fx, 0.38+h/2, 0, 0,0,0, 1,1,0.3);
    });
  }

  // Tail
  const tailX = -(bw * 0.42 + 0.1);
  if (tail === "forked") {
    part(g, new THREE.ConeGeometry(0.12, 0.42, 5), dark, tailX, 0.14, 0, 0,0,-Math.PI/5, 1,0.5,0.4);
    part(g, new THREE.ConeGeometry(0.12, 0.42, 5), dark, tailX,-0.14, 0, 0,0, Math.PI/5, 1,0.5,0.4);
  } else if (tail === "fan") {
    part(g, new THREE.SphereGeometry(0.28, 7, 5), dark, tailX-0.1, 0, 0, 0,0,0, 0.35,0.9,0.7);
  } else {
    part(g, new THREE.ConeGeometry(0.14, 0.5, 6), dark, tailX, 0, 0, 0,0,-Math.PI/2, 1,0.6,0.5);
  }

  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// Name generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateCreatureName(id: string, category: CreatureCategory, songName: string): string {
  const rng = makeRng(id);
  let trait = "";

  if (category === "mammal") {
    const body  = pick(["round","stocky","lean"], rng);
    const ears  = pick(["pointed","round","floppy","none"], rng);
    const tail  = pick(["long","bushy","stubby","curled","none"], rng);
    pick(["flat","long","wide"], rng); // snout — consume rng slot
    const back  = pick(["plain","mane","spines","hump"], rng);
    if (ears !== "none")       trait = `${ears}-eared`;
    else if (back !== "plain") trait = back === "mane" ? "maned" : back === "spines" ? "spined" : "humped";
    else if (tail !== "none")  trait = `${tail}-tailed`;
    else                       trait = `${body}-bodied`;
  } else if (category === "slime") {
    const body      = pick(["blob","tall","flat"], rng);
    const eyes      = pick(["single","double","stalks"], rng);
    const appendage = pick(["tendrils","bubbles","spikes","none"], rng);
    if (eyes === "stalks")             trait = "stalky";
    else if (appendage === "tendrils") trait = "tendriled";
    else if (appendage === "bubbles")  trait = "bubbly";
    else if (appendage === "spikes")   trait = "spiky";
    else                               trait = body === "tall" ? "tall" : body === "flat" ? "flat" : "blobby";
  } else {
    const body = pick(["round","flat","long"], rng);
    const fin  = pick(["tall","wide","spiky","none"], rng);
    const tail = pick(["forked","fan","pointed"], rng);
    if (fin === "spiky")        trait = "spiky-finned";
    else if (fin === "tall")    trait = "tall-finned";
    else if (tail === "forked") trait = "forked-tail";
    else if (body === "long")   trait = "long-bodied";
    else                        trait = "fan-tailed";
  }

  const cleanSong = songName.replace(/ Beast$/, "").trim();
  return `${trait} ${cleanSong}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildProceduralCreature(opts: ProceduralCreatureOpts): THREE.Group {
  switch (opts.category) {
    case "mammal":  return buildMammal(opts);
    case "slime":   return buildSlime(opts);
    case "aquatic": return buildAquatic(opts);
  }
}

export function categoryFromType(type: string): CreatureCategory {
  if (type === "aquatic") return "aquatic";
  if (type === "slime")   return "slime";
  return "mammal";
}