import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { COL } from '../lib/db';
import { useCategories, useDocBySlug, useDocsByIds } from '../lib/content';
import { Seo, productJsonLd } from '../lib/seo';
import { absoluteUrl } from '../lib/links';
import { formatPrice } from '../lib/utils';
import type { Category, Equipment } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { Img, Lightbox, Reveal, SectionHeading, Spinner } from '../components/primitives';
import { EquipmentCard } from '../components/cards';
import { WhatsAppLink } from '../components/WhatsApp';
import { LeadForm } from '../components/forms';
import { NotFound } from './NotFound';

export function EquipmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, L, t } = useI18n();
  const { data: item, loading, notFound } = useDocBySlug<Equipment>(COL.equipment, slug);
  const { data: categories } = useCategories();
  const related = useDocsByIds<Equipment>(COL.equipment, item?.relatedIds ?? []);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [active, setActive] = useState(0);

  const gallery = useMemo(
    () => [item?.image, ...(item?.gallery ?? [])].filter(Boolean) as string[],
    [item]
  );

  const jsonLd = useMemo(() => {
    if (!item) return null;
    return productJsonLd({
      name: L(item.name),
      description: L(item.shortDescription) || L(item.description),
      image: item.image,
      brand: item.brand,
      price: item.showPrice ? item.price : undefined,
      currency: item.currency,
      url: absoluteUrl(`/${lang}/equipment/${item.slug}`),
    });
  }, [item, lang, L]);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (notFound || !item) return <NotFound />;

  const category = (categories as Category[]).find((c) => (item.categoryIds ?? []).includes(c.id));
  const price = formatPrice(item, lang, L);
  const availabilityLabel =
    item.availability === 'limited' ? t('limited')
    : item.availability === 'unavailable' ? t('unavailable')
    : t('available');

  return (
    <>
      <Seo
        title={item.seoTitle && L(item.seoTitle) ? item.seoTitle : item.name}
        description={item.seoDescription ?? item.shortDescription}
        image={item.image}
        type="product"
        jsonLd={jsonLd}
      />
      <PageHeader
        eyebrow={[category ? L(category.name) : null, item.brand].filter(Boolean).join(' · ')}
        title={L(item.name)}
        crumbs={[
          { label: t('nav_equipment'), to: '/equipment' },
          ...(category ? [{ label: L(category.name), to: `/equipment?category=${category.slug}` }] : []),
          { label: L(item.name) },
        ]}
      />

      <section className="container-x pb-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <button type="button" onClick={() => gallery.length && setLightbox(active)} className="block w-full text-left" aria-label={t('gallery')}>
            <Img src={gallery[active]} alt={item.name} ratio="4/3" cover={false} className="bg-[#101012] border border-[#1A1A1D]" priority />
          </button>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {gallery.map((src, i) => (
                <button
                  key={src + i} type="button" onClick={() => setActive(i)}
                  className={`border ${i === active ? 'border-[var(--accent)]' : 'border-[#1E1E22] hover:border-[#3a3a41]'}`}
                  aria-label={`${t('gallery')} ${i + 1}`}
                >
                  <Img src={src} alt={item.name} ratio="1/1" />
                </button>
              ))}
            </div>
          )}
          {item.video && (
            <div className="mt-6 aspect-video border border-[#1A1A1D]">
              <iframe src={item.video} title={L(item.name)} allowFullScreen loading="lazy" className="w-full h-full" style={{ border: 0 }} />
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-[#1E1E22] p-7">
            <p className="eyebrow">{availabilityLabel}</p>
            <p className="font-display text-2xl md:text-3xl mt-3">{price}</p>
            {L(item.shortDescription) && (
              <p className="text-[#9A9AA0] mt-5 leading-relaxed">{L(item.shortDescription)}</p>
            )}
            <div className="mt-7 flex flex-col gap-3">
              <WhatsAppLink itemName={L(item.name)} className="btn btn-primary justify-center">
                <MessageCircle className="w-4 h-4" />{t('whatsapp')}
              </WhatsAppLink>
              <a href="#inquiry" className="btn btn-ghost justify-center">{t('getQuote')}</a>
            </div>

            <dl className="mt-8 space-y-3 text-sm border-t border-[#1E1E22] pt-6">
              {item.brand && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('brand')}</dt><dd>{item.brand}</dd></div>)}
              {item.model && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('model')}</dt><dd>{item.model}</dd></div>)}
              {L(item.minDuration) && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('minDuration')}</dt><dd>{L(item.minDuration)}</dd></div>)}
              {L(item.deposit) && (<div className="flex justify-between gap-4"><dt className="text-[#6A6A72]">{t('deposit')}</dt><dd>{L(item.deposit)}</dd></div>)}
            </dl>
          </div>
        </aside>
      </section>

      {(L(item.description) || item.specs?.length || L(item.accessories)) && (
        <section className="container-x pb-24 grid lg:grid-cols-12 gap-12">
          {L(item.description) && (
            <div className="lg:col-span-7">
              <p className="text-lg text-[#C9C9CE] leading-relaxed whitespace-pre-line">{L(item.description)}</p>
              {L(item.accessories) && (
                <>
                  <h2 className="font-display text-xl mt-12 mb-4">{t('included')}</h2>
                  <p className="text-[#9A9AA0] leading-relaxed whitespace-pre-line">{L(item.accessories)}</p>
                </>
              )}
            </div>
          )}
          {item.specs?.length > 0 && (
            <div className="lg:col-span-5">
              <h2 className="font-display text-xl mb-5">{t('specifications')}</h2>
              <dl className="border-t border-[#1E1E22]">
                {item.specs.map((row, i) => (
                  <div key={i} className="flex justify-between gap-6 py-3 border-b border-[#1A1A1D] text-sm">
                    <dt className="text-[#6A6A72]">{L(row.key)}</dt>
                    <dd className="text-right">{L(row.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x pb-24">
          <SectionHeading title={t('related')} />
          <div className="grid gap-px bg-[#141417] sm:grid-cols-2 lg:grid-cols-4 [&>*]:bg-[#0A0A0B]">
            {related.map((r, i) => <Reveal key={r.id} delay={i * 50}><EquipmentCard item={r} /></Reveal>)}
          </div>
        </section>
      )}

      <section id="inquiry" className="container-x pb-28 scroll-mt-24">
        <SectionHeading title={t('getQuote')} />
        <div className="max-w-3xl">
          <LeadForm variant="contact" reference={{ type: 'equipment', id: item.id, name: L(item.name) }} />
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox images={gallery} index={lightbox} alt={L(item.name)}
                  onClose={() => setLightbox(null)} onIndex={setLightbox} />
      )}
    </>
  );
}
