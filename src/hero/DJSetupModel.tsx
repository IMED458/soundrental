import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelProps } from './modelTypes';

/** Bundled decoder — no CDN dependency, so the hero also works offline. */
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

/** ?debug3d=1 paints each part a distinct hue and logs a legend — used to map
 *  this specific asset's unnamed meshes to real components. */
const DEBUG_PARTS =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug3d');

export const DJ_SETUP_URL = `${import.meta.env.BASE_URL}models/pioneer-dj-setup.glb`;

/** World-unit envelope the whole rig is normalised into. */
const FIT_WIDTH = 3.6;
const FIT_HEIGHT = 2.5;


/**
 * This bundled asset exports its meshes with generated names, so components are
 * identified by material id — established once by inspecting the scene graph
 * (bounding boxes, triangle counts and positions) rather than guessed.
 */
const PAD_COLOURS: Record<string, string> = {
  // Pad / button rows on the sampler's top panel
  'Material #2128199538': '#F2A03D',
  'Material #2128199539': '#3DBBF2',
  'Material #2128199540': '#E24FA0',
  'Material #2128199541': '#7FE05A',
  // Front-panel control strips on the all-in-one controller
  'Material #2128199565': '#5AC8E0',
  'Material #2128199566': '#F2A03D',
  'Material #2128199567': '#E0553F',
  'Material #2128199568': '#7FE05A',
  // Top-panel button rows
  'Material #2128199571': '#3DBBF2',
  'Material #2128199572': '#F2A03D',
  // Control strip on the third deck
  'Material #2128199587': '#F2A03D',
  // Indicator LEDs
  'Material #2128199499': '#E0553F',
  'Material #2128199535': '#7FE05A',
  'Material #2128199588': '#3DBBF2',
};

/** Backlit displays. */
const SCREEN_MATERIALS = new Set(['Material #2128199586', 'Material #2128199563']);

/** Wordmark badge: a few of these materials are shared between the decks and the
 *  speaker face, so the artwork is branding rather than a UI screenshot. */
function makeBadgeTexture(label: string, accent = '#F2A03D'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0A0A0C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 58px "Space Grotesk", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '8px';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  return texture;
}

/** The laptop screen — the one flat quad on the lid. */
const LAPTOP_SCREEN_MATERIAL = 'Material #2128199484';

/** PA speaker on the tripod: cabinet and grille get a real loudspeaker finish. */
const SPEAKER_CABINET = new Set([
  'Material #2128199503', 'Material #2128199502', 'Material #2128199504', 'Material #2128199505',
]);
const SPEAKER_GRILLE = 'Material #2128199497';

/** Screen artwork: drawn once, reused by both the laptop and the deck displays. */
function makeScreenTexture(label: string, accent = '#F2A03D'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#07090C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint waveform, the way a DJ application looks from across a room
  ctx.strokeStyle = 'rgba(120,170,200,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x += 4) {
    const amp = 26 * Math.sin(x * 0.07) * Math.sin(x * 0.013 + 1.2);
    ctx.moveTo(x, 250 - amp);
    ctx.lineTo(x, 250 + amp);
  }
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = 'bold 62px "Space Grotesk", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText(label, canvas.width / 2, 120);

  ctx.fillStyle = 'rgba(226,226,230,0.7)';
  ctx.font = '24px "Inter", Helvetica, Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('SOUND & DJ RENTAL', canvas.width / 2, 176);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  return texture;
}

/**
 * The exported scene arrives with its V-Ray materials flattened to plain white,
 * black and grey. Rather than guess at the original texture assignments, the
 * three tones are re-mapped onto a coherent blacked-out studio palette: body
 * panels, machined metal and matte rubber.
 */
function restyle(
  material: THREE.Material,
  screenTexture: THREE.Texture,
  badgeTexture: THREE.Texture
): THREE.Material {
  const src = material as THREE.MeshStandardMaterial;
  const colour = src.color ?? new THREE.Color(1, 1, 1);
  const luminance = 0.2126 * colour.r + 0.7152 * colour.g + 0.0722 * colour.b;

  const next = new THREE.MeshStandardMaterial({ name: src.name });

  // Coloured, backlit controls — the detail that makes the gear read as real.
  const pad = PAD_COLOURS[src.name];
  if (pad) {
    const colour = new THREE.Color(pad);
    next.color = colour;
    next.emissive = colour;
    next.emissiveIntensity = 0.95;
    next.roughness = 0.4;
    next.metalness = 0.05;
    next.envMapIntensity = 0.5;
    return next;
  }

  if (src.name === LAPTOP_SCREEN_MATERIAL) {
    next.color = new THREE.Color('#FFFFFF');
    next.map = screenTexture;
    next.emissive = new THREE.Color('#FFFFFF');
    next.emissiveMap = screenTexture;
    next.emissiveIntensity = 1.15;
    next.roughness = 0.25;
    next.metalness = 0;
    next.envMapIntensity = 0.2;
    next.side = THREE.DoubleSide;
    return next;
  }

  // Deck displays face the camera in the hero shot, so they carry the brand.
  if (SCREEN_MATERIALS.has(src.name)) {
    next.color = new THREE.Color('#FFFFFF');
    next.map = badgeTexture;
    next.emissive = new THREE.Color('#FFFFFF');
    next.emissiveMap = badgeTexture;
    next.emissiveIntensity = 0.9;
    next.roughness = 0.22;
    next.metalness = 0.05;
    next.envMapIntensity = 0.2;
    return next;
  }

  if (src.name === SPEAKER_GRILLE) {
    next.color = new THREE.Color('#1B1B20');
    next.roughness = 0.42;
    next.metalness = 0.72;
    next.envMapIntensity = 0.7;
    return next;
  }

  if (SPEAKER_CABINET.has(src.name)) {
    next.color = new THREE.Color('#0C0C0E');
    next.roughness = 0.88;
    next.metalness = 0.06;
    next.envMapIntensity = 0.4;
    return next;
  }

  if (luminance > 0.82) {
    // Body panels and chassis.
    next.color = new THREE.Color('#191A1E');
    next.roughness = 0.44;
    next.metalness = 0.3;
  } else if (luminance > 0.28) {
    // Machined aluminium: jog wheel platters, knobs, hardware.
    next.color = new THREE.Color('#7C818A');
    next.roughness = 0.24;
    next.metalness = 0.95;
  } else {
    // Rubber, grilles, screen bezels.
    next.color = new THREE.Color('#0A0A0C');
    next.roughness = 0.7;
    next.metalness = 0.08;
  }
  next.envMapIntensity = 0.85;
  return next;
}

/**
 * A procedural room environment gives the metal parts something to reflect.
 * It is generated on the GPU from bundled code — no HDR download, no CDN.
 */
function useStudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    const previous = scene.environment;
    scene.environment = envMap;
    return () => {
      scene.environment = previous;
      envMap.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
    };
  }, [gl, scene]);
}

interface Part {
  node: THREE.Object3D;
  rest: THREE.Vector3;
  /** Direction the piece travels when the rig comes apart. */
  dir: THREE.Vector3;
  /** Footprint, used to order the pieces and to place the labels. */
  radius: number;
}

/**
 * The real Pioneer studio rig: controller, mixer, sampler and stand.
 *
 * Because it is a *setup* rather than one device, the exploded stage separates
 * the individual pieces of equipment away from each other — which is exactly
 * what a rental customer wants to understand: what a full DJ booth is made of.
 */
export function GltfDJSetup({
  url, explode, spin, tilt, distance, scale, baseRotationY,
}: ModelProps & { url: string }) {
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_PATH);
    (loader as GLTFLoader).setDRACOLoader(draco);
  });

  const group = useRef<THREE.Group>(null);
  useStudioEnvironment();

  const { scene, parts, fit } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const screenTexture = makeScreenTexture('AUDIOKRAFT');
    const badgeTexture = makeBadgeTexture('AUDIOKRAFT');

    // The export wraps everything in a single RootNode; its children are the
    // individual pieces of equipment, and those are what come apart.
    let container: THREE.Object3D = cloned;
    while (container.children.length === 1 && container.children[0].children.length > 1) {
      container = container.children[0];
    }

    // Normalise: centre on the origin, sit on the floor, scale to a known width.
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);
    cloned.position.set(-centre.x, -box.min.y, -centre.z);

    // The rig is as tall as it is wide (speaker on a stand), so fit both axes.
    const fitScale = Math.min(
      FIT_WIDTH / Math.max(size.x, size.z, 0.001),
      FIT_HEIGHT / Math.max(size.y, 0.001)
    );

    const list: Part[] = [];
    for (const child of [...container.children]) {
      const childBox = new THREE.Box3().setFromObject(child);
      if (childBox.isEmpty()) continue;
      const childCentre = new THREE.Vector3();
      const childSize = new THREE.Vector3();
      childBox.getCenter(childCentre);
      childBox.getSize(childSize);

      // In the source scene the laptop faces the DJ, i.e. away from us. Turn it
      // around its own centre so the display is part of the shot.
      let node: THREE.Object3D = child;
      let carriesScreen = false;
      child.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && (mesh.material as THREE.Material)?.name === LAPTOP_SCREEN_MATERIAL) {
          carriesScreen = true;
        }
      });
      if (carriesScreen) {
        const pivot = new THREE.Group();
        const localCentre = container.worldToLocal(childCentre.clone());
        pivot.position.copy(localCentre);
        pivot.rotation.y = Math.PI;
        container.add(pivot);
        child.position.sub(localCentre);
        pivot.add(child);
        node = pivot;
      }

      // The rig is already centred on the origin above, so the piece's own
      // centre *is* the direction it travels outward.
      const dir = new THREE.Vector3(childCentre.x, 0, childCentre.z);
      if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
      dir.normalize();
      // A little lift keeps the pieces from sliding through each other.
      dir.y = 0.5;

      list.push({
        node,
        rest: node.position.clone(),
        dir,
        radius: Math.max(childSize.x, childSize.z),
      });

      let partIndex = 0;
      child.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (DEBUG_PARTS) {
          const hue = (partIndex * 0.137) % 1;
          const colour = new THREE.Color().setHSL(hue, 0.9, 0.5);
          const bb = new THREE.Box3().setFromObject(mesh);
          const sz = new THREE.Vector3(); bb.getSize(sz);
          const ctr = new THREE.Vector3(); bb.getCenter(ctr);
          const w = window as unknown as { __djParts?: unknown[] };
          w.__djParts = w.__djParts ?? [];
          w.__djParts.push({
            node: child.name,
            i: partIndex,
            hue: Math.round(hue * 360),
            mat: (mesh.material as THREE.Material).name,
            tris: (mesh.geometry.getIndex()?.count ?? 0) / 3,
            size: sz.toArray().map((v) => Number(v.toFixed(2))),
            centre: ctr.toArray().map((v) => Number(v.toFixed(2))),
          });
          mesh.material = new THREE.MeshBasicMaterial({ color: colour });
        } else {
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map((m) => restyle(m, screenTexture, badgeTexture))
            : restyle(mesh.material, screenTexture, badgeTexture);
        }
        partIndex += 1;
      });
    }

    return { scene: cloned, parts: list, fit: fitScale };
  }, [gltf]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const damp = 1 - Math.pow(0.0015, delta);

    g.rotation.y += (baseRotationY + spin.current - g.rotation.y) * damp;
    g.rotation.x += ((tilt?.current ?? 0) - g.rotation.x) * damp;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.03;

    const e = explode.current * distance * 0.6;
    for (const part of parts) {
      part.node.position.set(
        part.rest.x + part.dir.x * e,
        part.rest.y + part.dir.y * e,
        part.rest.z + part.dir.z * e
      );
    }
  });

  return (
    <group ref={group} scale={scale * fit}>
      <primitive object={scene} />
    </group>
  );
}
