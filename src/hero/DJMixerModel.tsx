import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { ModelProps } from './modelTypes';

/**
 * Built-in procedural two-deck DJ controller.
 *
 * The device is wide and flat, so the exploded view separates it into *layers*
 * along Y — the way a technical drawing of a console reads — instead of the
 * Z-axis separation a speaker cabinet wants.
 */
const PARTS = [
  { id: 'jogL',    rest: [-1.06, 0.17, 0.30],  explode: [-1.62, 1.45, 0.60] },
  { id: 'jogR',    rest: [1.06, 0.17, 0.30],   explode: [1.62, 1.45, 0.60] },
  { id: 'mixer',   rest: [0, 0.17, 0.16],      explode: [0, 1.28, 0.34] },
  { id: 'fx',      rest: [0, 0.17, -0.52],     explode: [0, 1.05, -1.15] },
  { id: 'plate',   rest: [0, 0.12, 0],         explode: [0, 0.66, 0] },
  { id: 'chassis', rest: [0, 0, 0],            explode: [0, 0, 0] },
  { id: 'pcb',     rest: [0, -0.02, 0],        explode: [0, -0.95, 0] },
  { id: 'io',      rest: [0, 0.02, -0.98],     explode: [0, -0.65, -1.85] },
] as const;

/** Rest tilt: the back edge lifts so the top panel faces the camera. */
const BASE_TILT_X = 0.42;

function useMaterials(accent: string) {
  return useMemo(() => {
    const accentColor = new THREE.Color(accent);
    return {
      chassis: new THREE.MeshStandardMaterial({ color: '#191A1F', roughness: 0.62, metalness: 0.25 }),
      plate: new THREE.MeshStandardMaterial({ color: '#33343C', roughness: 0.38, metalness: 0.55 }),
      metal: new THREE.MeshStandardMaterial({ color: '#70707B', roughness: 0.3, metalness: 0.6 }),
      dark: new THREE.MeshStandardMaterial({ color: '#101014', roughness: 0.7, metalness: 0.15 }),
      knob: new THREE.MeshStandardMaterial({ color: '#4A4A54', roughness: 0.45, metalness: 0.4 }),
      accent: new THREE.MeshStandardMaterial({
        color: accentColor, emissive: accentColor, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0.1,
      }),
      screen: new THREE.MeshStandardMaterial({
        color: '#0C1418', emissive: new THREE.Color('#2A5561'), emissiveIntensity: 0.3, roughness: 0.3,
      }),
      pcb: new THREE.MeshStandardMaterial({ color: '#16261D', roughness: 0.8, metalness: 0.1 }),
      copper: new THREE.MeshStandardMaterial({ color: '#B0703A', roughness: 0.35, metalness: 0.85 }),
    };
  }, [accent]);
}

/** One jog wheel: platter, machined rim, centre cap and an accent ring. */
function JogWheel({ mats }: { mats: ReturnType<typeof useMaterials> }) {
  return (
    <group>
      <mesh material={mats.dark} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.05, 48]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
        <torusGeometry args={[0.42, 0.022, 12, 48]} />
      </mesh>
      <mesh position={[0, 0.035, 0]} material={mats.plate}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 32]} />
      </mesh>
      <mesh position={[0, 0.036, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.accent}>
        <torusGeometry args={[0.3, 0.008, 8, 48]} />
      </mesh>
      {/* Performance pads below the platter */}
      {[0, 1, 2, 3].map((i) => (
        <RoundedBox
          key={i}
          args={[0.17, 0.035, 0.14]}
          radius={0.012}
          smoothness={2}
          position={[-0.29 + i * 0.195, 0.01, 0.62]}
          material={i === 1 ? mats.accent : mats.knob}
        />
      ))}
    </group>
  );
}

/** Centre section: four channel strips, EQ knobs and the crossfader. */
function MixerSection({ mats }: { mats: ReturnType<typeof useMaterials> }) {
  const channels = [-0.3, -0.1, 0.1, 0.3];
  return (
    <group>
      {/* EQ knob grid — three bands per channel */}
      {channels.map((x) =>
        [0, 1, 2].map((row) => (
          <mesh key={`${x}-${row}`} position={[x, 0.03, -0.34 + row * 0.17]} material={mats.knob}>
            <cylinderGeometry args={[0.055, 0.06, 0.055, 20]} />
          </mesh>
        ))
      )}
      {/* Channel faders: slot + cap */}
      {channels.map((x, i) => (
        <group key={`f-${x}`}>
          <mesh position={[x, 0.005, 0.32]} material={mats.dark}>
            <boxGeometry args={[0.05, 0.02, 0.42]} />
          </mesh>
          <RoundedBox
            args={[0.085, 0.05, 0.075]}
            radius={0.015}
            smoothness={2}
            position={[x, 0.035, 0.24 + i * 0.05]}
            material={mats.plate}
          />
        </group>
      ))}
      {/* Crossfader */}
      <mesh position={[0, 0.005, 0.62]} material={mats.dark}>
        <boxGeometry args={[0.62, 0.02, 0.06]} />
      </mesh>
      <RoundedBox args={[0.075, 0.05, 0.095]} radius={0.015} smoothness={2}
                  position={[0.06, 0.035, 0.62]} material={mats.plate} />
      {/* Channel level LEDs */}
      {channels.map((x) => (
        <mesh key={`l-${x}`} position={[x, 0.028, -0.52]} material={mats.accent}>
          <boxGeometry args={[0.03, 0.012, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

/** Effects strip and the browse display. */
function FxSection({ mats }: { mats: ReturnType<typeof useMaterials> }) {
  return (
    <group>
      <mesh position={[0, 0.028, -0.06]} material={mats.screen}>
        <boxGeometry args={[0.66, 0.02, 0.28]} />
      </mesh>
      {[-0.62, -0.44, 0.44, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.035, -0.02]} material={mats.knob}>
          <cylinderGeometry args={[0.07, 0.075, 0.07, 24]} />
        </mesh>
      ))}
      {[-0.9, 0.9].map((x) => (
        <mesh key={`b-${x}`} position={[x, 0.03, -0.02]} material={mats.accent}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 20]} />
        </mesh>
      ))}
    </group>
  );
}

export function ProceduralDJMixer({
  explode, spin, tilt, distance, scale, baseRotationY, accent,
}: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const mats = useMaterials(accent ?? '#C8963E');

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const damp = 1 - Math.pow(0.0015, delta);
    const t = state.clock.elapsedTime;

    g.rotation.y += (baseRotationY + spin.current - g.rotation.y) * damp;
    g.rotation.x += (BASE_TILT_X + (tilt?.current ?? 0) - g.rotation.x) * damp;
    // A slow float keeps the console alive while the visitor reads the headline.
    g.position.y = Math.sin(t * 0.7) * 0.045;

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
    <group ref={group} scale={scale}>
      {/* Chassis */}
      <group ref={set('chassis')}>
        <RoundedBox args={[3.1, 0.22, 1.95]} radius={0.05} smoothness={4}
                    material={mats.chassis} castShadow receiveShadow />
      </group>

      {/* Brushed top plate */}
      <group ref={set('plate')}>
        <RoundedBox args={[3.02, 0.035, 1.88]} radius={0.03} smoothness={3}
                    material={mats.plate} castShadow />
      </group>

      <group ref={set('jogL')}><JogWheel mats={mats} /></group>
      <group ref={set('jogR')}><JogWheel mats={mats} /></group>
      <group ref={set('mixer')}><MixerSection mats={mats} /></group>
      <group ref={set('fx')}><FxSection mats={mats} /></group>

      {/* Internal board */}
      <group ref={set('pcb')}>
        <mesh material={mats.pcb} castShadow>
          <boxGeometry args={[2.8, 0.025, 1.7]} />
        </mesh>
        {[-0.9, -0.3, 0.3, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.03, 0]} material={mats.copper}>
            <boxGeometry args={[0.12, 0.04, 1.5]} />
          </mesh>
        ))}
        {[-0.6, 0, 0.6].map((x) => (
          <mesh key={`c-${x}`} position={[x, 0.045, -0.5]} material={mats.dark}>
            <boxGeometry args={[0.22, 0.06, 0.22]} />
          </mesh>
        ))}
      </group>

      {/* Rear I/O panel */}
      <group ref={set('io')}>
        <mesh material={mats.dark}>
          <boxGeometry args={[2.9, 0.16, 0.06]} />
        </mesh>
        {[-1.2, -1.0, -0.8, -0.6].map((x) => (
          <mesh key={x} position={[x, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
          </mesh>
        ))}
        {[0.6, 0.9, 1.2].map((x) => (
          <mesh key={`x-${x}`} position={[x, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.05]} material={mats.accent}>
          <boxGeometry args={[0.16, 0.05, 0.04]} />
        </mesh>
      </group>
    </group>
  );
}
