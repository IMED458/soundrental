import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { href } from '../lib/links';
import { cx, formatPrice, stripHtml } from '../lib/utils';
import type { Category, Equipment, Project, RentalPackage, Service } from '../lib/types';
import { Img } from './primitives';
import { WhatsAppLink } from './WhatsApp';

export function CategoryCard({ category }: { category: Category }) {
  const { lang, L } = useI18n();
  return (
    <Link
      to={`${href(lang, '/equipment')}?category=${encodeURIComponent(category.slug)}`}
      className="group block border border-[#1E1E22] hover:border-[#3a3a41] transition-colors duration-500"
    >
      <Img src={category.image} alt={category.name} ratio="4/3" className="grayscale-[0.25] group-hover:grayscale-0 transition-[filter] duration-700" />
      <div className="p-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg">{L(category.name)}</h3>
          {L(category.description) && (
            <p className="text-sm text-[#8C8C93] mt-1 line-clamp-2">{L(category.description)}</p>
          )}
        </div>
        <ArrowUpRight className="w-5 h-5 text-[#6A6A72] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1" />
      </div>
    </Link>
  );
}

export function EquipmentCard({ item, categoryName }: { item: Equipment; categoryName?: string }) {
  const { lang, L, t } = useI18n();
  const price = formatPrice(item, lang, L);
  return (
    <article className="group flex flex-col border border-[#1E1E22] hover:border-[#3a3a41] transition-colors duration-500">
      <Link to={href(lang, `/equipment/${item.slug}`)} className="block relative">
        <Img src={item.image} alt={item.name} ratio="1/1" className="bg-[#101012]" cover />
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isNew && <span className="px-2 py-1 text-[10px] tracking-[0.16em] uppercase bg-[var(--accent)] text-[var(--accent-contrast)]">{t('new')}</span>}
          {item.featured && !item.isNew && <span className="px-2 py-1 text-[10px] tracking-[0.16em] uppercase border border-[#3a3a41] text-[#C9C9CE] bg-[#0A0A0B]/70">{t('featured')}</span>}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-1">
        {(categoryName || item.brand) && (
          <p className="eyebrow mb-2">{[categoryName, item.brand].filter(Boolean).join(' · ')}</p>
        )}
        <h3 className="font-display text-lg leading-snug">
          <Link to={href(lang, `/equipment/${item.slug}`)} className="hover:text-[var(--accent)] transition-colors">
            {L(item.name)}
          </Link>
        </h3>
        {L(item.shortDescription) && (
          <p className="text-sm text-[#8C8C93] mt-2 line-clamp-2">{stripHtml(L(item.shortDescription), 110)}</p>
        )}
        <div className="mt-auto pt-5 flex items-end justify-between gap-3">
          <span className={cx('text-sm', item.showPrice ? 'text-[#F2EFE9]' : 'text-[#8C8C93]')}>{price}</span>
          <WhatsAppLink
            itemName={L(item.name)}
            className="p-2 -mr-2 text-[#6A6A72] hover:text-[var(--accent)] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </WhatsAppLink>
        </div>
      </div>
    </article>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const { lang, L, t } = useI18n();
  return (
    <Link to={href(lang, `/services/${service.slug}`)}
          className="group flex flex-col border border-[#1E1E22] hover:border-[#3a3a41] transition-colors duration-500 p-6 md:p-8">
      <h3 className="font-display text-xl md:text-2xl">{L(service.title)}</h3>
      {L(service.shortDescription) && (
        <p className="text-[#8C8C93] mt-3 leading-relaxed line-clamp-3">{L(service.shortDescription)}</p>
      )}
      <span className="mt-6 inline-flex items-center gap-2 text-sm text-[#C9C9CE] group-hover:text-[var(--accent)] transition-colors">
        {t('viewDetails')} <ArrowUpRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export function PackageCard({ pkg }: { pkg: RentalPackage }) {
  const { lang, L, t } = useI18n();
  return (
    <article className="group flex flex-col border border-[#1E1E22] hover:border-[#3a3a41] transition-colors duration-500">
      <Link to={href(lang, `/packages/${pkg.slug}`)}>
        <Img src={pkg.image} alt={pkg.name} ratio="16/10" />
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl">
          <Link to={href(lang, `/packages/${pkg.slug}`)} className="hover:text-[var(--accent)] transition-colors">{L(pkg.name)}</Link>
        </h3>
        {L(pkg.description) && <p className="text-sm text-[#8C8C93] mt-2 line-clamp-3">{stripHtml(L(pkg.description), 140)}</p>}
        <div className="mt-auto pt-6 flex items-center justify-between gap-4">
          <span className="text-sm">{formatPrice({ ...pkg, pricePeriod: 'event' }, lang, L)}</span>
          <Link to={href(lang, `/packages/${pkg.slug}`)} className="text-sm text-[#C9C9CE] group-hover:text-[var(--accent)] inline-flex items-center gap-2 transition-colors">
            {t('viewDetails')} <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProjectCard({ project, large }: { project: Project; large?: boolean }) {
  const { lang, L } = useI18n();
  return (
    <Link to={href(lang, `/projects/${project.slug}`)} className="group block">
      <Img src={project.image} alt={project.title} ratio={large ? '16/9' : '4/3'}
           className="grayscale-[0.4] group-hover:grayscale-0 transition-[filter] duration-700" />
      <div className="pt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className={cx('font-display', large ? 'text-2xl md:text-3xl' : 'text-lg')}>{L(project.title)}</h3>
          <p className="eyebrow mt-2">
            {[L(project.location), project.date].filter(Boolean).join(' · ')}
          </p>
        </div>
        <ArrowUpRight className="w-5 h-5 text-[#6A6A72] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1" />
      </div>
    </Link>
  );
}
