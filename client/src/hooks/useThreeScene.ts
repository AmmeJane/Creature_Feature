import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CreatureSnapshot } from "../types/CreatureTypes";
import { buildProceduralCreature, categoryFromType, geneToColour } from "../components/creatures/ProceduralCreature";

// ── Build mesh ────────────────────────────────────────────────────────────────
function buildCreatureMesh(id: string, type: string, hex: number, sizeGene: number, speedGene: number): THREE.Group {
  return buildProceduralCreature({
    id,
    category: categoryFromType(type),
    color:    hex,
    size:     sizeGene,
    speed:    speedGene,
  });
}

// ── Scene setup ───────────────────────────────────────────────────────────────
function initScene(
  canvas: HTMLCanvasElement,
  snapshotsRef: React.MutableRefObject<CreatureSnapshot[]>,
  selectedRef:  React.MutableRefObject<string | null>,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x87ceeb);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc9e8f5, 20, 48);

  const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 4, 20);
  camera.lookAt(0, 0, 0);

  // meshMap lives here — RAF closes over it directly, no ref indirection
  const meshMap: Record<string, { group: THREE.Group }> = {};

  // ── Sky gradient ──────────────────────────────────────────────────────────
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(0x1a6fbe) },
      bottomColor: { value: new THREE.Color(0xc9e8f5) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vPos;
      void main() {
        float h = clamp((normalize(vPos).y + 0.1) * 1.2, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(48, 16, 16), skyMat));

  // ── Sun ───────────────────────────────────────────────────────────────────
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff176 }),
  );
  sunMesh.position.set(14, 18, -22);
  scene.add(sunMesh);
  sunMesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.22 }),
  ));

  // ── Clouds ────────────────────────────────────────────────────────────────
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.93 });
  function makeCloud(x: number, y: number, z: number, s: number) {
    const g = new THREE.Group();
    ([
      [0,0,0,1.4,0.7,1],[1.1,0.2,0,1,0.6,0.9],[-1,0.15,0,1,0.55,0.8],[0.5,-0.1,0.5,0.8,0.5,0.7],
    ] as [number,number,number,number,number,number][]).forEach(([cx,cy,cz,sx,sy,sz]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), cloudMat);
      m.position.set(cx, cy, cz);
      m.scale.set(sx, sy, sz);
      g.add(m);
    });
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    return g;
  }
  [[-12,14,-22,1.8],[6,16,-26,2.2],[18,13,-20,1.4],[-4,12,-18,1.0],[10,15,-30,1.6],[2,14,-28,1.2]].forEach(
    ([x,y,z,s]) => scene.add(makeCloud(x,y,z,s))
  );

  // ── Ground ────────────────────────────────────────────────────────────────
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: 0x4a9e3f }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  scene.add(ground);

  const stripeMat = new THREE.MeshLambertMaterial({ color: 0x3d8a34, transparent: true, opacity: 0.45 });
  for (let i = -6; i <= 6; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 60), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(i * 4.4, -1.18, 0);
    scene.add(stripe);
  }

  const grassMat = new THREE.MeshLambertMaterial({ color: 0x5cb85c });
  for (let i = 0; i < 160; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055 + Math.random() * 0.05, 0.2 + Math.random() * 0.22, 4), grassMat);
    tuft.position.set((Math.random() - 0.5) * 40, -1.06, (Math.random() - 0.5) * 30);
    tuft.rotation.y = Math.random() * Math.PI;
    scene.add(tuft);
  }

  // ── Fence ─────────────────────────────────────────────────────────────────
  const postMat = new THREE.MeshLambertMaterial({ color: 0xc8a96e });
  const railMat = new THREE.MeshLambertMaterial({ color: 0xb8955a });
  for (let i = -12; i <= 12; i += 2.5) {
    ([[-14,i],[14,i],[i,-14],[i,14]] as [number,number][]).forEach(([fx,fz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6), postMat);
      post.position.set(fx, -0.55, fz);
      scene.add(post);
    });
  }
  ([{x:0,z:-14,ry:0},{x:0,z:14,ry:0},{x:-14,z:0,ry:Math.PI/2},{x:14,z:0,ry:Math.PI/2}]).forEach(({ x, z, ry }) => {
    [-0.08, 0.38].forEach(yo => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 28, 6), railMat);
      rail.rotation.z = Math.PI / 2;
      rail.rotation.y = ry;
      rail.position.set(x, -1.2 + yo + 1.0, z);
      scene.add(rail);
    });
  });

  // ── Trees ─────────────────────────────────────────────────────────────────
  const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
  const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d7a27 });
  ([[-16,-16],[-16,0],[-16,16],[16,-16],[16,0],[16,16],[-8,-16],[8,-16],[-8,16],[8,16],[-12,0],[12,0]] as [number,number][]).forEach(([tx,tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.5, 7), trunkMat);
    trunk.position.set(tx, -0.45, tz);
    scene.add(trunk);
    [1.5,1.1,0.7].forEach((r, i) => {
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.15, 8), leavesMat);
      leaves.position.set(tx, 0.5 + i * 0.75, tz);
      scene.add(leaves);
    });
  });

  // ── Flowers ───────────────────────────────────────────────────────────────
  const flowerColors = [0xff6699, 0xffee55, 0xff8833, 0xcc55ff, 0xffffff];
  for (let i = 0; i < 60; i++) {
    const fc = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const sx = (Math.random() - 0.5) * 24;
    const sz = (Math.random() - 0.5) * 22;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 4), new THREE.MeshLambertMaterial({ color: 0x44aa44 }));
    stem.position.set(sx, -1.06, sz);
    scene.add(stem);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshLambertMaterial({ color: fc }));
    bloom.position.set(sx, -0.88, sz);
    scene.add(bloom);
  }

  // ── Lighting ──────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.75));
  const sunLight = new THREE.DirectionalLight(0xfff8dc, 1.4);
  sunLight.position.set(14, 20, 10);
  scene.add(sunLight);
  const fillLight = new THREE.DirectionalLight(0xaaddff, 0.3);
  fillLight.position.set(-8, 5, 8);
  scene.add(fillLight);

  // ── RAF loop — closes over meshMap directly ───────────────────────────────
  let t = 0;
  let rafId = 0;

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    t += 0.004;
    camera.position.x = Math.sin(t * 0.2) * 0.6;
    camera.position.y = 4 + Math.cos(t * 0.15) * 0.3;
    camera.lookAt(0, -0.5, 0);

    snapshotsRef.current.forEach(c => {
      const entry = meshMap[c.id];
      if (!entry) return;
      const { group } = entry;
      const hex     = geneToColour(c.genes?.colour ?? 0.5);
      const scale   = 0.4 + (c.size / 5) * 0.5;
      const groundY = -1.2 + scale * 0.9;

      group.position.set(c.x ?? 0, groundY, (c.y ?? 0) * 0.5);
      group.scale.setScalar(scale);

      if (c.state === "Moving" || c.state === "Running")
        group.position.y += Math.sin(Date.now() * 0.008 + (c.x ?? 0)) * 0.06;

      const rotSpeed = c.state === "Sleeping" ? 0.002 : c.state === "Running" ? 0.05 : c.state === "Moving" ? 0.02 : 0.006;
      group.rotation.y += rotSpeed;

      group.rotation.z = c.state === "Sleeping"
        ? group.rotation.z + (Math.PI / 2.5 - group.rotation.z) * 0.05
        : group.rotation.z + (0 - group.rotation.z) * 0.05;

      const isSelected = c.id === selectedRef.current;
      group.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        if (child.userData.fixedColor) {
          (child.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
          return;
        }
        (child.material as THREE.MeshPhongMaterial).color.setHex(hex);
        (child.material as THREE.MeshPhongMaterial).emissive.setHex(hex);
        (child.material as THREE.MeshPhongMaterial).emissiveIntensity = isSelected ? 0.35 : 0.08;
      });
    });

    renderer.render(scene, camera);
  };
  loop();

  // ── Resize ────────────────────────────────────────────────────────────────
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  // ── Raycasting ───────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();

  function getClickedCreatureId(event: MouseEvent, meshMap: Record<string, { group: THREE.Group }>): string | null {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width)  *  2 - 1,
      ((event.clientY - rect.top)  / rect.height) * -2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    // Collect all meshes from all creature groups
    const meshes: THREE.Mesh[] = [];
    const meshToId: Map<THREE.Mesh, string> = new Map();
    Object.entries(meshMap).forEach(([id, { group }]) => {
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
          meshToId.set(child, id);
        }
      });
    });
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    return meshToId.get(hits[0].object as THREE.Mesh) ?? null;
  }

  return {
    scene,
    meshMap,
    camera,
    getClickedCreatureId,
    dispose: () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
interface UseThreeSceneArgs {
  canvasRef:         React.RefObject<HTMLCanvasElement>;
  snapshotsRef:      React.MutableRefObject<CreatureSnapshot[]>;
  selectedRef:       React.MutableRefObject<string | null>;
  snapshots:         CreatureSnapshot[];
  typeMapRef:        React.MutableRefObject<Record<string, string>>;
  loading:           boolean;
  onCreatureClick?:  (id: string | null) => void;
}

export function useThreeScene({ canvasRef, snapshotsRef, selectedRef, snapshots, typeMapRef, loading, onCreatureClick }: UseThreeSceneArgs) {
  const sceneRef   = useRef<{ scene: THREE.Scene; meshMap: Record<string, { group: THREE.Group }>; camera: THREE.PerspectiveCamera; getClickedCreatureId: (e: MouseEvent, m: Record<string, { group: THREE.Group }>) => string | null; dispose: () => void } | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  // ── Init scene once loading is done ───────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const built = initScene(canvas, snapshotsRef, selectedRef);
    sceneRef.current = built;

    // Seed initial creatures into the shared meshMap
    snapshotsRef.current.forEach(c => {
      if (built.meshMap[c.id]) return;
      const hex   = geneToColour(c.genes?.colour ?? 0.5);
      const type  = typeMapRef.current[c.id] ?? "mammal";
      const group = buildCreatureMesh(c.id, type, hex, c.genes?.size ?? 0.5, c.genes?.speed ?? 0.5);
      const scale = 0.4 + (c.size / 5) * 0.5;
      group.position.set(c.x ?? 0, -1.2 + scale * 0.9, (c.y ?? 0) * 0.5);
      group.scale.setScalar(scale);
      built.scene.add(group);
      built.meshMap[c.id] = { group };
    });

    // ── Canvas click → raycast ──────────────────────────────────────────
    const handleClick = (e: MouseEvent) => {
      if (!onCreatureClick) return;
      const id = built.getClickedCreatureId(e, built.meshMap);
      onCreatureClick(id);
    };
    canvas.addEventListener("click", handleClick);

    setSceneReady(true);
    return () => {
      canvas.removeEventListener("click", handleClick);
      built.dispose();
      setSceneReady(false);
    };
  }, [loading]);

  // ── Add / remove meshes when snapshots change ─────────────────────────────
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    const { scene, meshMap } = sceneRef.current;

    // Use snapshotsRef for liveIds — always current, never stale
    const liveIds = new Set(snapshotsRef.current.map(c => c.id));

    Object.keys(meshMap).forEach(id => {
      if (!liveIds.has(id)) {
        scene.remove(meshMap[id].group);
        delete meshMap[id];
      }
    });

    snapshotsRef.current.forEach(c => {
      if (meshMap[c.id]) return;
      const hex   = geneToColour(c.genes?.colour ?? 0.5);
      const type  = typeMapRef.current[c.id] ?? "mammal";
      const group = buildCreatureMesh(c.id, type, hex, c.genes?.size ?? 0.5, c.genes?.speed ?? 0.5);
      const scale = 0.4 + (c.size / 5) * 0.5;
      group.position.set(c.x ?? 0, -1.2 + scale * 0.9, (c.y ?? 0) * 0.5);
      group.scale.setScalar(scale);
      scene.add(group);
      meshMap[c.id] = { group };
    });
  }, [snapshots, sceneReady]);
}