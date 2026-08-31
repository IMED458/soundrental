import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';

export interface PartAnchor { id: string; position: [number, number, number]; }

/**
 * Anchor points the feature labels attach to, in the model's exploded position.
 * Index order matches the admin-managed label list.
 */
export const LABEL_ANCHORS: PartAnchor[] = [
  { id: 'woofer', position: [-1.15, -0.55, 1.15] },
  { id: 'horn', position: [1.15, 0.72, 0.95] },
  { id: 'cabinet', position: [-1.25, 0.35, -0.35] },
  { id: 'io', position: [1.2, -0.75, -1.35] },
];

const DARK = '#24242A';
const DARKER = '#212127';
const METAL = '#6E6E79';

/** Layout of the built-in PA cabinet: rest pose plus the engineered explode offset. */
const PARTS = [
  { id: 'grille',   rest: [0, 0, 0.5],     explode: [-0.45, 1.85, 0.7] },
  { id: 'horn',     rest: [0, 0.72, 0.44],  explode: [1.25, 0.85, 1.05] },
  { id: 'woofer',   rest: [0, -0.42, 0.42], explode: [-1.25, -0.6, 1.1] },
  { id: 'cabinet',  rest: [0, 0, 0],        explode: [0, 0, -0.15] },
  { id: 'amp',      rest: [0, -0.1, -0.42], explode: [0, -0.3, -1.15] },
  { id: 'io',       rest: [0, -0.72, -0.5], explode: [0.7, -0.95, -1.75] },
  { id: 'handleL',  rest: [-0.78, 0.2, 0],  explode: [-1.6, 0.5, -0.4] },
  { id: 'handleR',  rest: [0.78, 0.2, 0],   explode: [1.6, 0.5, -0.4] },
] as const;

function useMaterials() {
  return useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.6, metalness: 0.12 }),
    grille: new THREE.MeshStandardMaterial({ color: DARKER, roughness: 0.45, metalness: 0.2 }),
    cone: new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.8, metalness: 0.05, side: THREE.DoubleSide }),
    metal: new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.34, metalness: 0.5 }),
  }), []);
}

interface ModelProps {
  /** 0 = assembled, 1 = fully exploded. */
  explode: React.MutableRefObject<number>;
  /** Extra rotation driven by scroll, in radians. */
  spin: React.MutableRefObject<number>;
  distance: number;
  scale: number;
  baseRotationY: number;
}

/** Built-in procedural PA speaker — used until an administrator uploads a GLB. */
export function ProceduralSpeaker({ explode, spin, distance, scale, baseRotationY }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const mats = useMaterials();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const damp = 1 - Math.pow(0.0015, delta);
    g.rotation.y += (baseRotationY + spin.current - g.rotation.y) * damp;
    g.rotation.x += (explode.current * 0.12 - g.rotation.x) * damp;

    for (const part of PARTS) {
      const node = refs.current[part.id];
      if (!node) continue;
      const e = explode.current * distance;
      node.position.x = part.rest[0] + (part.explode[0] - part.rest[0]) * e;
      node.position.y = part.rest[1] + (part.explode[1] - part.rest[1]) * e;
      node.position.z = part.rest[2] + (part.explode[2] - part.rest[2]) * e;
    }
  });

  const set = (id: string) => (el: THREE.Group | null) => { refs.current[id] = el; };

  return (
    <group ref={group} scale={scale} position={[0, -0.1, 0]}>
      {/* Cabinet — slightly trapezoidal, tour-grade proportions */}
      <group ref={set('cabinet')}>
        <RoundedBox args={[1.55, 2.35, 0.95]} radius={0.06} smoothness={4} material={mats.body} castShadow receiveShadow />
        <mesh position={[0, 1.19, 0]} material={mats.metal}>
          <boxGeometry args={[1.5, 0.03, 0.9]} />
        </mesh>
        {/* Recessed baffle: gives the cabinet a readable front face */}
        <mesh position={[0, 0, 0.44]} material={mats.grille}>
          <boxGeometry args={[1.42, 2.2, 0.04]} />
        </mesh>
      </group>

      {/* Front grille */}
      <group ref={set('grille')}>
        <RoundedBox args={[1.5, 2.28, 0.06]} radius={0.03} smoothness={3} material={mats.grille} castShadow />
      </group>

      {/* Woofer: surround ring + cone + dust cap */}
      <group ref={set('woofer')}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
          <torusGeometry args={[0.56, 0.045, 12, 48]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]} material={mats.cone}>
          <cylinderGeometry args={[0.5, 0.15, 0.42, 48, 1, true]} />
        </mesh>
        <mesh position={[0, 0, -0.02]} material={mats.metal}>
          <sphereGeometry args={[0.15, 24, 16]} />
        </mesh>
      </group>

      {/* HF horn + compression driver */}
      <group ref={set('horn')}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.grille}>
          <coneGeometry args={[0.42, 0.34, 4, 1, true]} />
        </mesh>
        <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
          <cylinderGeometry args={[0.18, 0.18, 0.24, 24]} />
        </mesh>
      </group>

      {/* Amplifier module */}
      <group ref={set('amp')}>
        <RoundedBox args={[1.1, 0.85, 0.28]} radius={0.03} smoothness={3} material={mats.metal} castShadow />
      </group>

      {/* Rear I/O panel */}
      <group ref={set('io')}>
        <RoundedBox args={[1.0, 0.42, 0.08]} radius={0.02} smoothness={2} material={mats.grille} />
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <cylinderGeometry args={[0.075, 0.075, 0.05, 16]} />
          </mesh>
        ))}
      </group>

      <group ref={set('handleL')}>
        <mesh material={mats.metal}><boxGeometry args={[0.1, 0.5, 0.16]} /></mesh>
      </group>
      <group ref={set('handleR')}>
        <mesh material={mats.metal}><boxGeometry args={[0.1, 0.5, 0.16]} /></mesh>
      </group>
    </group>
  );
}

/**
 * Uploaded GLB/GLTF: each top-level child becomes an explodable part, pushed
 * outward along its own offset from the model centre. The animation system is
 * unchanged — only the geometry source differs.
 */
export function GltfSpeaker({ url, explode, spin, distance, scale, baseRotationY }: ModelProps & { url: string }) {
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    (loader as GLTFLoader).setDRACOLoader(draco);
  });
  const group = useRef<THREE.Group>(null);

  const { scene, parts, autoScale } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    cloned.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fit = 2.6 / maxDim;

    const list = cloned.children.map((child) => {
      const childBox = new THREE.Box3().setFromObject(child);
      const childCenter = new THREE.Vector3();
      childBox.getCenter(childCenter);
      const dir = childCenter.clone().sub(new THREE.Vector3(0, 0, 0));
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      dir.normalize();
      // Favour Z separation so the exploded view reads as a technical drawing.
      dir.z = dir.z >= 0 ? Math.max(dir.z, 0.55) : Math.min(dir.z, -0.55);
      child.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; }
      });
      return { node: child, rest: child.position.clone(), dir };
    });

    return { scene: cloned, parts: list, autoScale: fit };
  }, [gltf]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const damp = 1 - Math.pow(0.0015, delta);
    g.rotation.y += (baseRotationY + spin.current - g.rotation.y) * damp;
    for (const p of parts) {
      const e = explode.current * distance * 1.4;
      p.node.position.set(
        p.rest.x + p.dir.x * e,
        p.rest.y + p.dir.y * e,
        p.rest.z + p.dir.z * e
      );
    }
  });

  return (
    <group ref={group} scale={scale * autoScale}>
      <primitive object={scene} />
    </group>
  );
}
