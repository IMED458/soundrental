import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelProps } from './modelTypes';

/** Bundled decoder — no CDN dependency, so the hero also works offline. */
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

export const DJ_SETUP_URL = `${import.meta.env.BASE_URL}models/pioneer-dj-setup.glb`;

/** World-unit envelope the whole rig is normalised into. */
const FIT_WIDTH = 3.6;
const FIT_HEIGHT = 2.5;

/**
 * The exported scene arrives with its V-Ray materials flattened to plain white,
 * black and grey. Rather than guess at the original texture assignments, the
 * three tones are re-mapped onto a coherent blacked-out studio palette: body
 * panels, machined metal and matte rubber.
 */
function restyle(material: THREE.Material): THREE.Material {
  const src = material as THREE.MeshStandardMaterial;
  const colour = src.color ?? new THREE.Color(1, 1, 1);
  const luminance = 0.2126 * colour.r + 0.7152 * colour.g + 0.0722 * colour.b;

  const next = new THREE.MeshStandardMaterial({ name: src.name });
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
    for (const child of [...cloned.children]) {
      const childBox = new THREE.Box3().setFromObject(child);
      if (childBox.isEmpty()) continue;
      const childCentre = new THREE.Vector3();
      const childSize = new THREE.Vector3();
      childBox.getCenter(childCentre);
      childBox.getSize(childSize);

      const dir = new THREE.Vector3(childCentre.x - centre.x, 0, childCentre.z - centre.z);
      if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
      dir.normalize();
      // A little lift keeps the pieces from sliding through each other.
      dir.y = 0.5;

      list.push({
        node: child,
        rest: child.position.clone(),
        dir,
        radius: Math.max(childSize.x, childSize.z),
      });

      child.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(restyle)
          : restyle(mesh.material);
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
