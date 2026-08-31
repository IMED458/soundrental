import { useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { COL } from '../lib/db';
import { useDocBySlug, useServices } from '../lib/content';
import { Seo } from '../lib/seo';
import { formatPrice } from '../lib/utils';
import type { Service } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { ServiceCard } from '../components/cards';
import { EmptyState, Img, Reveal, SectionHeading, Spinner } from '../components/primitives';
import { WhatsAppLink } from '../components/WhatsApp';
import { LeadForm } from '../components/forms';
import { NotFound } from './NotFound';

export function ServicesPage() {
  const { L, t } = useI18n();
  const { data, loading } = useServices();
  return (
    <>
      <Seo title={{ ka: 'სერვისები', en: 'Services', ru: 'Услуги' }} />
      <PageHeader eyebrow={t('nav_services')} title={t('nav_services')} />
      <section className="container-x pb-24">
        {loading ? <Spinner /> : (data as Service[]).length === 0 ? <EmptyState /> : (
          <div className="grid gap-px bg-[#141417] sm:grid-cols-2 lg:grid-cols-3 [&>*]:bg-[#0A0A0B]">
            {(data as Service[]).map((s, i) => (
              <Reveal key={s.id} delay={i * 60}><ServiceCard service={s} /></Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, L, t } = useI18n();
  const { data: service, loading, notFound } = useDocBySlug<Service>(COL.services, slug);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (notFound || !service) return <NotFound />;

  return (
    <>
      <Seo
        title={service.seoTitle && L(service.seoTitle) ? service.seoTitle : service.title}
        description={service.seoDescription ?? service.shortDescription}
        image={service.image}
      />
      <PageHeader
        eyebrow={t('nav_services')}
        title={L(service.title)}
        subtitle={L(service.shortDescription)}
        crumbs={[{ label: t('nav_services'), to: '/services' }, { label: L(service.title) }]}
      />
      <section className="container-x pb-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          {service.image && <Img src={service.image} alt={service.title} ratio="16/9" className="mb-10" />}
          <p className="text-lg text-[#C9C9CE] leading-relaxed whitespace-pre-line">{L(service.description)}</p>
          {service.gallery?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mt-10">
              {service.gallery.map((g, i) => <Img key={g + i} src={g} alt={service.title} ratio="4/3" />)}
            </div>
          )}
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-[#1E1E22] p-7 sticky top-28">
            <p className="font-display text-2xl">{formatPrice({ ...service, priceFrom: true }, lang, L)}</p>
            <div className="mt-6 flex flex-col gap-3">
              <WhatsAppLink itemName={L(service.title)} className="btn btn-primary justify-center" />
              <a href="#inquiry" className="btn btn-ghost justify-center">{L(service.ctaLabel) || t('getQuote')}</a>
            </div>
          </div>
        </aside>
      </section>
      <section id="inquiry" className="container-x pb-28 scroll-mt-24">
        <SectionHeading title={t('getQuote')} />
        <div className="max-w-3xl">
          <LeadForm variant="contact" reference={{ type: 'service', id: service.id, name: L(service.title) }} />
        </div>
      </section>
    </>
  );
}
