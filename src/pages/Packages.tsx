import { useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { COL } from '../lib/db';
import { useDocBySlug, useDocsByIds, usePackages } from '../lib/content';
import { Seo } from '../lib/seo';
import { formatPrice } from '../lib/utils';
import type { Equipment, RentalPackage } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EquipmentCard, PackageCard } from '../components/cards';
import { EmptyState, Img, Reveal, SectionHeading, Spinner } from '../components/primitives';
import { WhatsAppLink } from '../components/WhatsApp';
import { LeadForm } from '../components/forms';
import { NotFound } from './NotFound';

export function PackagesPage() {
  const { t } = useI18n();
  const { data, loading } = usePackages();
  return (
    <>
      <Seo title={{ ka: 'პაკეტები', en: 'Packages', ru: 'Пакеты' }} />
      <PageHeader eyebrow={t('nav_packages')} title={t('nav_packages')} />
      <section className="container-x pb-24">
        {loading ? <Spinner /> : (data as RentalPackage[]).length === 0 ? <EmptyState /> : (
          <div className="grid gap-px bg-[#141417] sm:grid-cols-2 lg:grid-cols-3 [&>*]:bg-[#0A0A0B]">
            {(data as RentalPackage[]).map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><PackageCard pkg={p} /></Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, L, t } = useI18n();
  const { data: pkg, loading, notFound } = useDocBySlug<RentalPackage>(COL.packages, slug);
  const items = useDocsByIds<Equipment>(COL.equipment, pkg?.equipmentIds ?? []);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (notFound || !pkg) return <NotFound />;

  return (
    <>
      <Seo
        title={pkg.seoTitle && L(pkg.seoTitle) ? pkg.seoTitle : pkg.name}
        description={pkg.seoDescription ?? pkg.description}
        image={pkg.image}
      />
      <PageHeader
        eyebrow={t('nav_packages')}
        title={L(pkg.name)}
        crumbs={[{ label: t('nav_packages'), to: '/packages' }, { label: L(pkg.name) }]}
      />
      <section className="container-x pb-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <Img src={pkg.image} alt={pkg.name} ratio="16/9" />
          <p className="text-lg text-[#C9C9CE] leading-relaxed whitespace-pre-line mt-10">{L(pkg.description)}</p>
          {pkg.gallery?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mt-10">
              {pkg.gallery.map((g, i) => <Img key={g + i} src={g} alt={pkg.name} ratio="4/3" />)}
            </div>
          )}
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-[#1E1E22] p-7 sticky top-28">
            <p className="font-display text-2xl md:text-3xl">{formatPrice({ ...pkg, pricePeriod: 'event' }, lang, L)}</p>
            <dl className="mt-6 space-y-3 text-sm">
              {pkg.guests && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('guests')}</dt><dd>{pkg.guests}</dd></div>)}
              {L(pkg.venueSize) && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('location')}</dt><dd>{L(pkg.venueSize)}</dd></div>)}
            </dl>
            <div className="mt-7 flex flex-col gap-3">
              <WhatsAppLink itemName={L(pkg.name)} className="btn btn-primary justify-center" />
              <a href="#inquiry" className="btn btn-ghost justify-center">{t('getQuote')}</a>
            </div>
          </div>
        </aside>
      </section>

      {items.length > 0 && (
        <section className="container-x pb-24">
          <SectionHeading title={t('packageIncludes')} />
          <div className="grid gap-px bg-[#141417] sm:grid-cols-2 lg:grid-cols-4 [&>*]:bg-[#0A0A0B]">
            {items.map((e, i) => <Reveal key={e.id} delay={i * 45}><EquipmentCard item={e} /></Reveal>)}
          </div>
        </section>
      )}

      <section id="inquiry" className="container-x pb-28 scroll-mt-24">
        <SectionHeading title={t('getQuote')} />
        <div className="max-w-3xl">
          <LeadForm variant="contact" reference={{ type: 'package', id: pkg.id, name: L(pkg.name) }} />
        </div>
      </section>
    </>
  );
}
