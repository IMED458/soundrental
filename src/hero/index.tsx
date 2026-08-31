import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { href } from '../lib/links';

const Hero3D = lazy(() => import('./Hero3D'));

/** WebGL is not guaranteed — probe once before pulling in ~500KB of three.js. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

function StaticHero() {
  const { lang, L } = useI18n();
  const { hero, settings } = useSettings();
  return (
    <section className="relative min-h-[86svh] flex items-center overflow-hidden">
      {hero.fallbackImage && (
        <img src={hero.fallbackImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/85 to-transparent" aria-hidden="true" />
      <div className="container-x relative pt-32 pb-20">
        <p className="eyebrow mb-6">{L(settings.siteName)}</p>
        <h1 className="text-[2.6rem] leading-[1.03] sm:text-6xl xl:text-7xl max-w-3xl">{L(hero.title)}</h1>
        <p className="mt-6 text-lg text-[#9A9AA0] max-w-lg leading-relaxed">{L(hero.subtitle)}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to={href(lang, hero.ctaUrl)} className="btn btn-primary">{L(hero.ctaLabel)}</Link>
          <Link to={href(lang, hero.ctaSecondaryUrl)} className="btn btn-ghost">{L(hero.ctaSecondaryLabel)}</Link>
        </div>
      </div>
    </section>
  );
}

/** Decides between the full 3D experience and the static hero, then code-splits. */
export function Hero() {
  const { hero } = useSettings();
  const [capable, setCapable] = useState<boolean | null>(null);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!hero.enabled) return setCapable(false);
    if (mobile && !hero.enabledOnMobile) return setCapable(false);
    if (saveData) return setCapable(false);
    setCapable(hasWebGL() && !(mobile && lowCore && !hero.enabledOnMobile));
  }, [hero.enabled, hero.enabledOnMobile]);

  if (capable === null) return <div className="h-[86svh]" aria-hidden="true" />;
  if (!capable) return <StaticHero />;

  return (
    <Suspense fallback={<StaticHero />}>
      <Hero3D />
    </Suspense>
  );
}
