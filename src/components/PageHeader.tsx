import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { href } from '../lib/links';

export function PageHeader({
  eyebrow, title, subtitle, crumbs,
}: {
  eyebrow?: string; title: string; subtitle?: string;
  crumbs?: Array<{ label: string; to?: string }>;
}) {
  const { lang } = useI18n();
  return (
    <header className="container-x pt-32 md:pt-44 pb-10 md:pb-16">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[#6A6A72]">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                {c.to ? (
                  <Link to={href(lang, c.to)} className="hover:text-[#F2EFE9] transition-colors">{c.label}</Link>
                ) : (
                  <span className="text-[#9A9AA0]">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h1 className="text-4xl md:text-6xl leading-[1.04] max-w-4xl">{title}</h1>
      {subtitle && <p className="mt-5 text-lg text-[#9A9AA0] max-w-2xl leading-relaxed">{subtitle}</p>}
    </header>
  );
}
