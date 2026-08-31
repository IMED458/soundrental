import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useProgress } from '@react-three/drei';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { href } from '../lib/links';
import { cx } from '../lib/utils';
import { GltfSpeaker, ProceduralSpeaker } from './SpeakerModel';

gsap.registerPlugin(ScrollTrigger);

/** Ramp 0→1 across [a,b], hold, then 1→0 across [c,d]. */
function band(p: number, a: number, b: number, c: number, d: number): number {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  return 1 - (p - c) / (d - c);
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** Scroll timeline — the whole hero is a pure function of one progress value. */
function stageValues(p: number) {
  return {
    intro: band(p, -0.01, 0, 0.06, 0.16),
    explode: smooth(clamp01(band(p, 0.18, 0.42, 0.68, 0.88))),
    spin: (clamp01((p - 0.08) / 0.5)) * Math.PI * 0.55,
    labels: band(p, 0.40, 0.47, 0.60, 0.66),
    story: band(p, 0.60, 0.67, 0.76, 0.83),
    final: band(p, 0.86, 0.93, 1.01, 1.02),
    dolly: 1.14 - smooth(clamp01(p / 0.35)) * 0.14 + smooth(clamp01((p - 0.6) / 0.4)) * 0.06,
  };
}

function Rig({ progress, distance }: { progress: React.MutableRefObject<number>; distance: number }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const { dolly } = stageValues(progress.current);
    const target = distance * dolly;
    const damp = 1 - Math.pow(0.002, delta);
    camera.position.z += (target - camera.position.z) * damp;
    camera.position.y += (0.15 - camera.position.y) * damp;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Drivers({
  progress, explode, spin,
}: {
  progress: React.MutableRefObject<number>;
  explode: React.MutableRefObject<number>;
  spin: React.MutableRefObject<number>;
}) {
  useFrame(() => {
    const v = stageValues(progress.current);
    explode.current = v.explode;
    spin.current = v.spin;
  });
  return null;
}

function Scene({
  progress, explode, spin, modelUrl, scale, rotationY, explodeDistance, accentLight, accent, quality,
}: {
  progress: React.MutableRefObject<number>;
  explode: React.MutableRefObject<number>;
  spin: React.MutableRefObject<number>;
  modelUrl?: string;
  scale: number;
  rotationY: number;
  explodeDistance: number;
  accentLight: boolean;
  accent: string;
  quality: 'high' | 'low';
}) {
  return (
    <>
      <ambientLight intensity={0.34} />
      <directionalLight
        position={[-4, 6, 5]} intensity={2.1} color="#FFF6E8"
        castShadow={quality === 'high'} shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[5, 1, -3]} intensity={0.9} color="#8FA8C8" />
      {accentLight && <pointLight position={[2.6, -1.4, 2.6]} intensity={22} color={accent} distance={11} decay={2} />}
      <spotLight position={[0, 7, 2]} angle={0.5} penumbra={1} intensity={9} color="#FFFFFF" />

      {modelUrl ? (
        <GltfSpeaker url={modelUrl} explode={explode} spin={spin} distance={explodeDistance} scale={scale} baseRotationY={rotationY} />
      ) : (
        <ProceduralSpeaker explode={explode} spin={spin} distance={explodeDistance} scale={scale} baseRotationY={rotationY} />
      )}

      {quality === 'high' && (
        <ContactShadows position={[0, -1.75, 0]} opacity={0.55} scale={9} blur={2.6} far={4} resolution={512} color="#000000" />
      )}
      <Rig progress={progress} distance={5} />
      <Drivers progress={progress} explode={explode} spin={spin} />
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
          <div className="h-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <p className="mt-4 text-[11px] tracking-[0.24em] text-[#6A6A72] font-display">{Math.round(progress)}%</p>
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

  const introRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

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

  // Scroll -> progress. Overlay opacity is written straight to the DOM so the
  // hero never re-renders React while scrolling.
  useEffect(() => {
    if (reduced) { progress.current = 0; return; }
    const el = wrapRef.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => { progress.current = self.progress; },
    });

    let raf = 0;
    const paint = () => {
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
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);

    return () => { st.kill(); cancelAnimationFrame(raf); };
  }, [reduced, hero.showLabels, sectionHeight]);

  const labels = useMemo(
    () => (hero.labels || []).filter((l) => l.visible).sort((a, b) => a.order - b.order).slice(0, 4),
    [hero.labels]
  );

  const modelUrl = (isMobile && hero.modelUrlMobile) ? hero.modelUrlMobile : hero.modelUrl || '';
  const quality: 'high' | 'low' = isMobile ? 'low' : 'high';
  const dpr: [number, number] = isMobile ? [1, 1.4] : [1, 2];

  // Static, still-premium presentation when the device or the visitor opts out of motion.
  const staticHero = reduced || (isMobile && !hero.enabledOnMobile);

  const LABEL_POS = [
    { left: '8%', top: '30%' },
    { right: '8%', top: '22%' },
    { left: '10%', bottom: '26%' },
    { right: '9%', bottom: '20%' },
  ];

  return (
    <section
      ref={wrapRef}
      className="relative"
      style={{ height: `${sectionHeight}vh` }}
      aria-label={L(hero.title)}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background: hero.background || '#0A0A0B' }}>
        {/* Depth: a restrained radial pool of light behind the product */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(255,255,255,0.055), transparent 70%)' }}
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
            camera={{ fov: 34, position: [0, 0.15, hero.cameraDistance || 6.2] }}
            onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
          >
            <Suspense fallback={null}>
              <Scene
                progress={progress}
                explode={explode}
                spin={spin}
                modelUrl={modelUrl || undefined}
                scale={hero.initialScale || 1}
                rotationY={hero.initialRotationY ?? -0.35}
                explodeDistance={(hero.explodeDistance || 1) * (hero.intensity || 1)}
                accentLight={hero.accentLight}
                accent={settings.accentColor}
                quality={quality}
              />
            </Suspense>
          </Canvas>
        )}

        {!ready && modelUrl && <LoadingOverlay onDone={() => setReady(true)} />}

        {/* Stage 1 — headline */}
        <div ref={introRef} className="absolute inset-0 z-10 flex items-center pointer-events-none">
          <div className="container-x w-full">
            <div className="max-w-2xl pointer-events-auto">
              <p className="eyebrow mb-6">{L(settings.siteName)}</p>
              <h1 className="text-[2.6rem] leading-[1.03] sm:text-6xl xl:text-7xl">{L(hero.title)}</h1>
              <p className="mt-6 text-lg text-[#9A9AA0] max-w-lg leading-relaxed">{L(hero.subtitle)}</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to={href(lang, hero.ctaUrl)} className="btn btn-primary">{L(hero.ctaLabel)}</Link>
                <Link to={href(lang, hero.ctaSecondaryUrl)} className="btn btn-ghost">{L(hero.ctaSecondaryLabel)}</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 4 — technical labels around the exploded product */}
        {hero.showLabels && !staticHero && (
          <div ref={labelsRef} className="absolute inset-0 z-10 hidden md:block" style={{ opacity: 0 }}>
            {labels.map((label, i) => (
              <div key={label.id} className="absolute max-w-[220px]" style={LABEL_POS[i % LABEL_POS.length]}>
                <div className="w-8 h-px bg-[var(--accent)] mb-3" />
                <p className="font-display text-sm tracking-wide">{L(label.title)}</p>
                <p className="text-xs text-[#8C8C93] mt-1 leading-relaxed">{L(label.text)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stage 5 — rental storytelling */}
        <div ref={storyRef} className="absolute inset-0 z-10 flex items-end pb-20 md:pb-28 pointer-events-none" style={{ opacity: 0 }}>
          <div className="container-x w-full">
            <h2 className="text-2xl md:text-4xl max-w-2xl">{L(hero.storyTitle)}</h2>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
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
            <h2 className="text-3xl md:text-6xl max-w-3xl mx-auto">{L(hero.finalTitle)}</h2>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link to={href(lang, hero.ctaUrl)} className="btn btn-primary">{L(hero.ctaLabel)}</Link>
              <Link to={href(lang, hero.ctaSecondaryUrl)} className="btn btn-ghost">{L(hero.ctaSecondaryLabel)}</Link>
            </div>
          </div>
        </div>

        {!staticHero && (
          <div ref={hintRef} className="absolute bottom-7 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <span className="eyebrow flex items-center gap-3">
              {t('scroll')}
              <span className="block w-10 h-px bg-[#3a3a41] relative overflow-hidden">
                <span className={cx('absolute inset-y-0 left-0 w-3 bg-[var(--accent)]')} style={{ animation: 'srScroll 2.2s ease-in-out infinite' }} />
              </span>
            </span>
          </div>
        )}
      </div>

      <style>{`@keyframes srScroll { 0%{transform:translateX(-12px)} 50%{transform:translateX(40px)} 100%{transform:translateX(-12px)} }`}</style>
    </section>
  );
}
