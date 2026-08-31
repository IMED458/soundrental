import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { href } from '../lib/links';
import { Seo } from '../lib/seo';

export function NotFound() {
  const { lang, t } = useI18n();
  return (
    <>
      <Seo title="404" noIndex />
      <section className="container-x min-h-[70svh] flex flex-col items-center justify-center text-center pt-32">
        <p className="font-display text-[var(--accent)] text-sm tracking-[0.24em]">404</p>
        <h1 className="text-3xl md:text-5xl mt-5">{t('page404')}</h1>
        <Link to={`/${lang}`} className="btn btn-ghost mt-10">{t('backHome')}</Link>
      </section>
    </>
  );
}
