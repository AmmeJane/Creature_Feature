import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildDino } from "./DinoMeshes";
import type { DinoType } from "./DinoMeshes";
import { buildCreature } from "./DinoMeshes";
import type { CreatureType } from "./DinoMeshes";

interface CreaturePreviewProps {
  dinoType: DinoType;
  colour:   string;  // hex string e.g. "#E91429"
  size?:    number;  // canvas width & height in px, default 268
}

export function CreaturePreview({ dinoType, colour, size = 268 }: CreaturePreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 3.5);
    camera.lookAt(0, 0, 0);

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xfff8dc, 1.4);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaaddff, 0.35);
    fill.position.set(-3, 2, 3);
    scene.add(fill);

    // ── Mesh ─────────────────────────────────────────────────────────────────
    const hex   = parseInt(colour.replace("#", ""), 16);
    const group = buildDino(dinoType, hex);
    scene.add(group);

    // ── Animation loop ───────────────────────────────────────────────────────
    let raf: number;
    let t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.018;
      group.rotation.y  = t;
      group.position.y  = Math.sin(t * 1.2) * 0.06;
      renderer.render(scene, camera);
    };
    loop();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [dinoType, colour, size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size, display: "block", lineHeight: 0 }}
    />
  );
}