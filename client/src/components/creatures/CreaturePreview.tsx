import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildProceduralCreature, categoryFromType } from "./ProceduralCreature";

interface CreaturePreviewProps {
  creatureType: string;
  colour:       string;
  size?:        number;
  id?:          string;
  sizeGene?:    number;
  speedGene?:   number;
  static?:      boolean;  // if true, render once with no animation
}

export function CreaturePreview({
  creatureType,
  colour,
  size = 268,
  id = "default",
  sizeGene = 0.5,
  speedGene = 0.5,
  static: isStatic = false,
}: CreaturePreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 3.5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xfff8dc, 1.4);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaaddff, 0.4);
    fill.position.set(-3, 2, 3);
    scene.add(fill);

    const hex   = parseInt(colour.replace("#", ""), 16);
    const group = buildProceduralCreature({
      id,
      category: categoryFromType(creatureType),
      color:    hex,
      size:     sizeGene,
      speed:    speedGene,
    });
    // Slight angle so static previews look more interesting
    group.rotation.y = isStatic ? Math.PI / 5 : 0;
    scene.add(group);

    let raf: number;

    if (isStatic) {
      // Single render, no loop
      renderer.render(scene, camera);
    } else {
      let t = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        t += 0.018;
        group.rotation.y = t;
        group.position.y = Math.sin(t * 1.2) * 0.06;
        renderer.render(scene, camera);
      };
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [creatureType, colour, size, id, sizeGene, speedGene, isStatic]);

  return <div ref={mountRef} style={{ width: size, height: size, display: "block", lineHeight: 0 }} />;
}