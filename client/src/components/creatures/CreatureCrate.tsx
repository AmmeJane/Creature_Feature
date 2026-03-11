import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildProceduralCreature, categoryFromType, geneToColourHex } from "./ProceduralCreature";
import type { CreatureSnapshot } from "../../types/CreatureTypes";
import { S } from "../../constants/colours";

interface CreatureCrateProps {
  creature: CreatureSnapshot;
  creatureType: string;
  onConfirm: () => void;
}

type Phase = "idle" | "shaking" | "exploding" | "revealed";

export function CreatureCrate({ creature, creatureType, onConfirm }: CreatureCrateProps) {

  const mountRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const [phase, setPhase] = useState<Phase>("idle");

  const colour = geneToColourHex(creature.genes.colour);

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {

    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(340, 340);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.2, 6);
    camera.lookAt(0, 0, 0);

    /* ---------------- LIGHTS ---------------- */

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const key = new THREE.DirectionalLight(0xfff8dc, 1.6);
    key.position.set(4, 8, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xaaddff, 0.4);
    fill.position.set(-4, 2, 4);
    scene.add(fill);

    /* ---------------- WOOD TEXTURE ---------------- */

    const woodCanvas = document.createElement("canvas");
    woodCanvas.width = 256;
    woodCanvas.height = 256;

    const ctx = woodCanvas.getContext("2d")!;

    ctx.fillStyle = "#3b2414";
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * 256);
      ctx.lineTo(256, Math.random() * 256);
      ctx.stroke();
    }

    ctx.strokeStyle = "#24140b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 85);
    ctx.lineTo(256, 85);
    ctx.moveTo(0, 170);
    ctx.lineTo(256, 170);
    ctx.stroke();

    ctx.strokeStyle = "#1a0f08";
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 238, 238);

    const woodTexture = new THREE.CanvasTexture(woodCanvas);

    const crateMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.9,
      metalness: 0.05
    });

    const questionCanvas = document.createElement("canvas");
    questionCanvas.width = 256;
    questionCanvas.height = 256;

    const qctx = questionCanvas.getContext("2d")!;
    qctx.drawImage(woodCanvas, 0, 0);

    qctx.fillStyle = "#f0d030";
    qctx.font = "bold 120px serif";
    qctx.textAlign = "center";
    qctx.textBaseline = "middle";
    qctx.fillText("?", 128, 128);

    const questionMaterial = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(questionCanvas),
      roughness: 0.9,
      metalness: 0.05
    });

    /* ---------------- CRATE ---------------- */

    const crateGroup = new THREE.Group();
    crateGroup.position.y = -0.3;
    crateGroup.rotation.y = Math.PI / 7;
    scene.add(crateGroup);

    const pieces: {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      vrx: number;
      vry: number;
      vrz: number;
    }[] = [];

    const panelGeo = new THREE.BoxGeometry(2, 2, 0.08);

    function addPanel(mat: THREE.Material, x: number, y: number, z: number, rotY = 0, rotX = 0) {
      const mesh = new THREE.Mesh(panelGeo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      mesh.rotation.x = rotX;
      crateGroup.add(mesh);

      pieces.push({ mesh, vx: 0, vy: 0, vz: 0, vrx: 0, vry: 0, vrz: 0 });
    }

    const H = 1;

    addPanel(crateMaterial, 0, 0, -H);
    addPanel(questionMaterial, 0, 0, H);

    const sideGeo = new THREE.BoxGeometry(0.08, 2, 2);
    const side1 = new THREE.Mesh(sideGeo, crateMaterial);
    side1.position.set(-H, 0, 0);
    crateGroup.add(side1);
    pieces.push({ mesh: side1, vx:0,vy:0,vz:0,vrx:0,vry:0,vrz:0 });

    const side2 = side1.clone();
    side2.position.x = H;
    crateGroup.add(side2);
    pieces.push({ mesh: side2, vx:0,vy:0,vz:0,vrx:0,vry:0,vrz:0 });

    const topGeo = new THREE.BoxGeometry(2, 0.08, 2);

    const top = new THREE.Mesh(topGeo, crateMaterial);
    top.position.set(0, H, 0);
    crateGroup.add(top);
    pieces.push({ mesh: top, vx:0,vy:0,vz:0,vrx:0,vry:0,vrz:0 });

    const bottom = top.clone();
    bottom.position.y = -H;
    crateGroup.add(bottom);
    pieces.push({ mesh: bottom, vx:0,vy:0,vz:0,vrx:0,vry:0,vrz:0 });

    /* ---------------- CREATURE ---------------- */

    const hex = parseInt(colour.replace("#", ""), 16);

    const creatureGroup = buildProceduralCreature({
      id: creature.id,
      category: categoryFromType(creatureType),
      color: hex,
      size: creature.genes.size,
      speed: creature.genes.speed
    });

    creatureGroup.position.set(0, -4, 0);
    creatureGroup.scale.setScalar(0.01);

    scene.add(creatureGroup);

    /* ---------------- EXPLOSION FX ---------------- */

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(2, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      })
    );

    scene.add(flash);

    const sparks: {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }[] = [];

    const sparkColors = [0xffdd44, 0xff8800, 0xffffff];

    for (let i = 0; i < 30; i++) {

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({
          color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
          transparent: true,
          opacity: 0
        })
      );

      scene.add(mesh);

      sparks.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.25 + 0.05,
        vz: (Math.random() - 0.5) * 0.3,
        life: 0
      });
    }

    /* ---------------- ANIMATION ---------------- */

    let t = 0;
    let explodeT = 0;

    function explode() {

      pieces.forEach(p => {

        const dir = new THREE.Vector3(
          p.mesh.position.x + (Math.random() - 0.5),
          p.mesh.position.y + (Math.random() - 0.5),
          p.mesh.position.z + (Math.random() - 0.5)
        ).normalize();

        const spd = 0.15 + Math.random() * 0.2;

        p.vx = dir.x * spd;
        p.vy = dir.y * spd + 0.1;
        p.vz = dir.z * spd;

        p.vrx = (Math.random() - 0.5) * 0.2;
        p.vry = (Math.random() - 0.5) * 0.2;
        p.vrz = (Math.random() - 0.5) * 0.2;

        scene.attach(p.mesh);
      });

      sparks.forEach(s => {
        s.mesh.position.set(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        );
        s.life = 1;
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      });
    }

    let raf = 0;

    const loop = () => {

      raf = requestAnimationFrame(loop);

      t += 0.016;

      const p = phaseRef.current;

      if (p === "idle") {

        crateGroup.rotation.y = Math.PI/7 + Math.sin(t*1.1)*0.07;
        crateGroup.position.y = -0.3 + Math.sin(t*1.7)*0.04;

      }

      if (p === "shaking") {

        crateGroup.rotation.y = Math.PI/7 + Math.sin(t*20)*0.15;
        crateGroup.rotation.z = Math.sin(t*24)*0.1;

      }

      if (p === "exploding") {

        explodeT += 0.016;

        (flash.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.8 - explodeT * 4);

        pieces.forEach(p => {

          p.vy -= 0.008;

          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;

          p.mesh.rotation.x += p.vrx;
          p.mesh.rotation.y += p.vry;
          p.mesh.rotation.z += p.vrz;

        });

        sparks.forEach(s => {

          if (s.life <= 0) return;

          s.life -= 0.03;
          s.vy -= 0.01;

          s.mesh.position.x += s.vx;
          s.mesh.position.y += s.vy;
          s.mesh.position.z += s.vz;

          (s.mesh.material as THREE.MeshBasicMaterial).opacity = s.life;

        });

        if (explodeT > 0.2) {

          const rise = Math.min((explodeT - 0.2) / 1, 1);
          const ease = 1 - Math.pow(1 - rise, 3);

          creatureGroup.position.y = -4 + ease * 4.2;
          creatureGroup.scale.setScalar(0.01 + ease * 0.99);
          creatureGroup.rotation.y += 0.05;

        }

        if (explodeT > 1.8) setPhaseSync("revealed");

      }

      if (p === "revealed") {

        creatureGroup.rotation.y += 0.018;
        creatureGroup.position.y += (0 - creatureGroup.position.y) * 0.05;

      }

      renderer.render(scene, camera);

    };

    loop();

    (el as any).__explode = () => {
      explode();
      setPhaseSync("exploding");
    };

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };

  }, []);

  const handleOpen = () => {

    setPhaseSync("shaking");

    setTimeout(() => {
      const el = mountRef.current as any;
      el?.__explode?.();
    }, 700);

  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>

      <div ref={mountRef} style={{ width:340, height:340 }} />

      {phase === "idle" && (
        <button
          onClick={handleOpen}
          style={{
            padding:"12px 32px",
            background:S.green,
            border:"none",
            borderRadius:8,
            color:S.black,
            fontSize:14,
            fontWeight:700,
            cursor:"pointer"
          }}
        >
          Open Crate
        </button>
      )}

      {phase === "revealed" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:20, fontWeight:700, color:S.white }}>
            {creature.name}
          </div>

          <div style={{ fontSize:12, color:S.muted }}>
            {creatureType}
          </div>

          <button
            onClick={onConfirm}
            style={{
              marginTop:10,
              padding:"10px 28px",
              background:S.green,
              border:"none",
              borderRadius:8,
              color:S.black,
              fontWeight:700,
              cursor:"pointer"
            }}
          >
            Add to Herd
          </button>
        </div>
      )}

    </div>
  );
}