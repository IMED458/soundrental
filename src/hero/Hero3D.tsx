import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useProgress } from '@react-three/drei';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { href } from '../lib/links';
import { GltfSpeaker, ProceduralSpeaker } from './SpeakerModel';
import { ProceduralDJMixer } from './DJMixerModel';
import { DJ_SETUP_URL, GltfDJSetup } from './DJSetupModel';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** Ramp 0→1 across [a,b], hold, then 1→0 across [c,d]. */
function band(p: number, a: number, b: number, c: number, d: number): number {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  return 1 - (p - c) / (d - c);
}

/** Piecewise eased interpolation through scroll keyframes. */
function track(p: number, keys: Array<[number, number]>): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, v0] = keys[i];
    const [p1, v1] = keys[i + 1];
    if (p <= p1) return v0 + (v1 - v0) * smooth(clamp01((p - p0) / (p1 - p0)));
  }
  return keys[keys.length - 1][1];
}

const TAU = Math.PI * 2;

/**
 * The whole hero is a pure function of one scroll value, so scrolling back
 * reverses it exactly and stopping stops it.
 *
 * 0.00–0.16  headline, console floating
 * 0.16–0.40  rotation and tilt, camera closes in
 * 0.40–0.62  exploded view with technical labels
 * 0.62–0.80  rental storytelling
 * 0.80–0.92  reassembly, full turn back to the front
 * 0.92–1.00  final CTA
 */
function stageValues(p: number) {
  const explode = smooth(clamp01(band(p, 0.16, 0.40, 0.62, 0.82)));
  return {
    explode,
    intro: band(p, -0.01, 0, 0.07, 0.16),
    labels: band(p, 0.38, 0.45, 0.56, 0.62),
    story: band(p, 0.62, 0.68, 0.74, 0.80),
    final: band(p, 0.86, 0.92, 1.01, 1.02),
    spin: track(p, [[0.10, 0], [0.45, Math.PI * 0.42], [0.62, Math.PI * 0.55], [0.90, TAU], [1, TAU]]),
    tilt: track(p, [[0.16, 0], [0.42, 0.22], [0.62, 0.22], [0.84, 0]]),
    // Pull back while the console is apart so the whole exploded view stays in frame.
    dolly: 1.16 - 0.16 * smooth(clamp01(p / 0.16)) + 0.5 * explode,
  };
}

function Rig({ progress, distance }: { progress: React.MutableRefObject<number>; distance: number }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const { dolly, explode } = stageValues(progress.current);
    const damp = 1 - Math.pow(0.002, delta);
    camera.position.z += (distance * dolly - camera.position.z) * damp;
    camera.position.y += ((0.85 + explode * 0.5) - camera.position.y) * damp;
    camera.lookAt(0, explode * 0.15, 0);
  });
  return null;
}

function Drivers({
  progress, explode, spin, tilt,
}: {
  progress: React.MutableRefObject<number>;
  explode: React.MutableRefObject<number>;
  spin: React.MutableRefObject<number>;
  tilt: React.MutableRefObject<number>;
}) {
  useFrame(() => {
    const v = stageValues(progress.current);
    explode.current = v.explode;
    spin.current = v.spin;
    tilt.current = v.tilt;
  });
  return null;
}

/**
 * Keeps the product framed on every screen: scales it to the visible width and
 * drops it lower on portrait viewports so the headline stays readable.
 */
function ModelFrame({
  width, explode, spreadGrowth = 0.6, children,
}: {
  width: number;
  explode: React.MutableRefObject<number>;
  spreadGrowth?: number;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const visibleWidth = 2 * cam.position.z * Math.tan((cam.fov * Math.PI) / 360) * aspect;
    // The exploded arrangement is much wider than the assembled product.
    const spread = width * (1 + spreadGrowth * explode.current);
    const fit = Math.min(1, (visibleWidth * 0.86) / spread);
    const damp = 1 - Math.pow(0.002, delta);
    const next = g.scale.x + (fit - g.scale.x) * damp;
    g.scale.setScalar(next);
    const targetY = aspect < 1 ? -0.25 : 0;
    g.position.y += (targetY - g.position.y) * damp;
  });
  return <group ref={group} position={[0, -0.35, 0]}>{children}</group>;
}

/** Technical grid floor — the reference's studio-blueprint cue. */
function StudioFloor({ y }: { y: number }) {
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(26, 26, '#2E2E36', '#17171B');
    const material = helper.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.5;
    return helper;
  }, []);
  return <primitive object={grid} position={[0, y, 0]} />;
}

interface SceneProps {
  progress: React.MutableRefObject<number>;
  explode: React.MutableRefObject<number>;
  spin: React.MutableRefObject<number>;
  tilt: React.MutableRefObject<number>;
  modelType: 'dj_setup' | 'dj_mixer' | 'speaker';
  modelUrl?: string;
  cameraDistance: number;
  scale: number;
  rotationY: number;
  explodeDistance: number;
  accentLight: boolean;
  accent: string;
  background: string;
  quality: 'high' | 'low';
}

function Scene({
  progress, explode, spin, tilt, modelType, modelUrl, cameraDistance, scale, rotationY,
  explodeDistance, accentLight, accent, background, quality,
}: SceneProps) {
  const isMixer = modelType === 'dj_mixer' && !modelUrl;
  const isSetup = modelType === 'dj_setup' && !modelUrl;
  return (
    <>
      <fogExp2 attach="fog" args={[background, 0.055]} />

      <ambientLight intensity={0.22} />
      <hemisphereLight args={['#9FB4CC', '#0A0A0B', 0.28]} />
      <directionalLight
        position={[-4, 6, 5]} intensity={3.1} color="#FFF6E8"
        castShadow={quality === 'high'} shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[5, 3, -3]} intensity={1.4} color="#8FA8C8" />
      <directionalLight position={[-1.5, 1.5, 6]} intensity={1.5} color="#E8ECF2" />
      <spotLight position={[0, 7, 2]} angle={0.5} penumbra={1} intensity={9} color="#FFFFFF" />
      {accentLight && (
        <pointLight position={[3.2, -0.6, 3.2]} intensity={16} color={accent} distance={14} decay={2} />
      )}

      <ModelFrame width={isSetup ? 3.9 : isMixer ? 3.3 : 1.9} spreadGrowth={isSetup ? 0.2 : 0.6} explode={explode}>
        {modelUrl ? (
          <GltfSpeaker url={modelUrl} explode={explode} spin={spin} distance={explodeDistance}
                       scale={scale} baseRotationY={rotationY} />
        ) : isSetup ? (
          <GltfDJSetup url={DJ_SETUP_URL} explode={explode} spin={spin} tilt={tilt}
                       distance={explodeDistance} scale={scale} baseRotationY={rotationY} />
        ) : isMixer ? (
          <ProceduralDJMixer
            explode={explode} spin={spin} tilt={tilt} distance={explodeDistance}
            scale={scale} baseRotationY={rotationY} accent={accent}
          />
        ) : (
          <ProceduralSpeaker explode={explode} spin={spin} distance={explodeDistance}
                             scale={scale} baseRotationY={rotationY} />
        )}
      </ModelFrame>

      {quality === 'high' && (
        <>
          <StudioFloor y={isSetup ? -1.35 : isMixer ? -1.5 : -1.9} />
          <ContactShadows position={[0, isSetup ? -1.28 : isMixer ? -1.42 : -1.78, 0]} opacity={0.5}
                          scale={11} blur={2.8} far={5} resolution={512} color="#000000" />
        </>
      )}

      <Rig progress={progress} distance={cameraDistance} />
      <Drivers progress={progress} explode={explode} spin={spin} tilt={tilt} />
    </>
  );
}

function LoadingOverlay({ onDone }: { onDone: () => void }) {
  const { progress, active } = useProgress();
  useEffect(() => { if (!active) onDone(); }, [active, onDone]);
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#0A0A0B]">
      <div className="w-56">
        <div className="h-px bg-[#232327] overflow-hidden">
          <div className="h-full bg-[var(--accent)] transition-[width] duration-300"
               style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <p className="mt-4 text-[11px] tracking-[0.24em] text-[#6A6A72] font-display">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

export default function Hero3D() {
  const { lang, L, t } = useI18n();
  const { hero, settings } = useSettings();
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const explode = useRef(0);
  const spin = useRef(0);
  const tilt = useRef(0);

  const introRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const sync = () => { setReduced(mqMotion.matches); setIsMobile(mqMobile.matches); };
    sync();
    mqMotion.addEventListener('change', sync);
    mqMobile.addEventListener('change', sync);
    return () => { mqMotion.removeEventListener('change', sync); mqMobile.removeEventListener('change', sync); };
  }, []);

  const sectionHeight = reduced ? 100 : Math.max(150, hero.sectionHeight || 450);

  // Scroll drives one progress value, measured straight from the section's own
  // rect — that stays correct under smooth scrolling, HMR and resizes, which a
  // cached scroll-trigger range does not. Overlay opacity is written directly to
  // the DOM so React never re-renders while scrolling.
  useEffect(() => {
    if (reduced) { progress.current = 0; return; }
    const el = wrapRef.current;
    if (!el) return;

    let raf = 0;
    const paint = () => {
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      progress.current = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;

      const v = stageValues(progress.current);
      const set = (node: HTMLElement | null, o: number, y = 0) => {
        if (!node) return;
        node.style.opacity = String(o);
        node.style.transform = `translate3d(0, ${y}px, 0)`;
        node.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        node.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      };
      set(introRef.current, v.intro, (1 - v.intro) * -30);
      if (introRef.current) introRef.current.style.filter = `blur(${(1 - v.intro) * 6}px)`;
      set(labelsRef.current, hero.showLabels ? v.labels : 0);
      set(storyRef.current, v.story, (1 - v.story) * 24);
      set(finalRef.current, v.final, (1 - v.final) * 24);
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - progress.current * 14));
      if (barRef.current) barRef.current.style.width = `${progress.current * 100}%`;

      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [reduced, hero.showLabels]);

  const labels = useMemo(
    () => (hero.labels || []).filter((l) => l.visible).sort((a, b) => a.order - b.order).slice(0, 4),
    [hero.labels]
  );

  const modelUrl = (isMobile && hero.modelUrlMobile) ? hero.modelUrlMobile : hero.modelUrl || '';
  const modelType = hero.modelType === 'speaker' || hero.modelType === 'dj_mixer' ? hero.modelType : 'dj_setup';
  const quality: 'high' | 'low' = isMobile ? 'low' : 'high';
  const dpr: [number, number] = isMobile ? [1, 1.4] : [1, 2];
  const background = hero.background || '#0A0A0B';

  const staticHero = reduced || (isMobile && !hero.enabledOnMobile);

  return (
    <section
      ref={wrapRef}
      className="relative"
      style={{ height: `${sectionHeight}vh` }}
      aria-label={L(hero.title)}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background }}>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(255,255,255,0.06), transparent 70%)' }}
          aria-hidden="true"
        />

        {staticHero && hero.fallbackImage ? (
          <img src={hero.fallbackImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        ) : (
          <Canvas
            className="absolute inset-0"
            dpr={dpr}
            shadows={quality === 'high'}
            gl={{ antialias: quality === 'high', powerPreference: 'high-performance', alpha: true }}
            camera={{ fov: 36, position: [0, 0.85, hero.cameraDistance || 5.6] }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.1;
            }}
          >
            <Suspense fallback={null}>
              <Scene
                progress={progress}
                explode={explode}
                spin={spin}
                tilt={tilt}
                modelType={modelType}
                modelUrl={modelUrl || undefined}
                cameraDistance={hero.cameraDistance || 5.6}
                scale={hero.initialScale || 1}
                rotationY={hero.initialRotationY ?? -0.28}
                explodeDistance={(hero.explodeDistance || 1) * (hero.intensity || 1)}
                accentLight={hero.accentLight}
                accent={settings.accentColor}
                background={background}
                quality={quality}
              />
            </Suspense>
          </Canvas>
        )}

        {/* Studio vignettes: keep the console reading against the page above and below */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-28"
             style={{ background: `linear-gradient(to bottom, ${background}, transparent)` }} aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28"
             style={{ background: `linear-gradient(to top, ${background}, transparent)` }} aria-hidden="true" />

        {!ready && modelUrl && <LoadingOverlay onDone={() => setReady(true)} />}

        {/* Stage 1 — headline */}
        <div ref={introRef} className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          {/* Scrim: keeps the headline legible over the rig without hiding it */}
          <div className="absolute inset-0"
               style={{ background: `linear-gradient(to bottom, ${background}AA, ${background}26 45%, ${background}AA)` }}
               aria-hidden="true" />
          <div className="container-x w-full text-center relative">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#26262B] bg-[#0E0E10]/80 backdrop-blur-sm text-[var(--accent)] eyebrow !text-[10px] mb-7">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                {L(settings.siteName)}
              </span>
              <h1 className="text-[2.4rem] leading-[1.05] sm:text-6xl xl:text-7xl">{L(hero.title)}</h1>
              <p className="mt-6 text-lg text-[#9A9AA0] max-w-xl mx-auto leading-relaxed">{L(hero.subtitle)}</p>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Link to={href(lang, hero.ctaUrl)} className="btn btn-primary">{L(hero.ctaLabel)}</Link>
                <Link to={href(lang, hero.ctaSecondaryUrl)} className="btn btn-ghost">{L(hero.ctaSecondaryLabel)}</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3 — technical labels beside the exploded console */}
        {hero.showLabels && !staticHero && (
          <div ref={labelsRef} className="absolute inset-0 z-10 hidden md:flex items-center" style={{ opacity: 0 }}>
            <div className="container-x w-full flex justify-between gap-8">
              <div className="flex flex-col gap-5 max-w-[240px]">
                {labels.slice(0, 2).map((label) => (
                  <div key={label.id} className="p-4 border border-[#26262B] bg-[#0C0C0E]/85 backdrop-blur-sm">
                    <div className="w-6 h-px bg-[var(--accent)] mb-3" />
                    <p className="font-display text-sm">{L(label.title)}</p>
                    <p className="text-xs text-[#8C8C93] mt-1.5 leading-relaxed">{L(label.text)}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-5 max-w-[240px]">
                {labels.slice(2, 4).map((label) => (
                  <div key={label.id} className="p-4 border border-[#26262B] bg-[#0C0C0E]/85 backdrop-blur-sm">
                    <div className="w-6 h-px bg-[var(--accent)] mb-3" />
                    <p className="font-display text-sm">{L(label.title)}</p>
                    <p className="text-xs text-[#8C8C93] mt-1.5 leading-relaxed">{L(label.text)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stage 5 — rental storytelling */}
        <div ref={storyRef} className="absolute inset-0 z-10 flex items-end pb-24 md:pb-28 pointer-events-none" style={{ opacity: 0 }}>
          <div className="container-x w-full text-center">
            <h2 className="text-2xl md:text-4xl max-w-2xl mx-auto">{L(hero.storyTitle)}</h2>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 justify-center">
              {(hero.storyItems || []).map((s) => (
                <li key={s.id} className="text-sm text-[#9A9AA0] flex items-center gap-2">
                  <span className="w-1 h-1 bg-[var(--accent)]" aria-hidden="true" />
                  {L(s.title)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stage 7 — final CTA */}
        <div ref={finalRef} className="absolute inset-0 z-10 flex items-center justify-center text-center pointer-events-none" style={{ opacity: 0 }}>
          <div className="container-x pointer-events-auto">
            <div className="max-w-3xl mx-auto border border-[#1E1E22] bg-[#0A0A0B]/70 backdrop-blur-sm p-8 md:p-12">
              <h2 className="text-3xl md:text-5xl">{L(hero.finalTitle)}</h2>
              <div className="mt-9 flex flex-wrap gap-4 justify-center">
                <Link to={href(lang, hero.ctaUrl)} className="btn btn-primary">{L(hero.ctaLabel)}</Link>
                <Link to={href(lang, hero.ctaSecondaryUrl)} className="btn btn-ghost">{L(hero.ctaSecondaryLabel)}</Link>
              </div>
            </div>
          </div>
        </div>

        {!staticHero && (
          <div ref={hintRef} className="absolute bottom-8 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <span className="eyebrow flex items-center gap-2">
              {t('scroll')}
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" aria-hidden="true" />
            </span>
          </div>
        )}

        {/* Scroll progress through the sequence */}
        {!staticHero && (
          <div className="absolute bottom-0 inset-x-0 h-px bg-[#1A1A1D] z-20" aria-hidden="true">
            <div ref={barRef} className="h-full bg-[var(--accent)]" style={{ width: '0%' }} />
          </div>
        )}
      </div>
    </section>
  );
}
