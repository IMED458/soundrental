import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useCategories, useEquipment } from '../lib/content';
import { Seo } from '../lib/seo';
import type { Category, Equipment as Item } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EquipmentCard } from '../components/cards';
import { EmptyState, Reveal, Spinner } from '../components/primitives';
import { cx } from '../lib/utils';

export function EquipmentPage() {
  const { L, t, lang } = useI18n();
  const { data: categories } = useCategories();
  const { data: items, loading } = useEquipment();
  const [params, setParams] = useSearchParams();

  const activeCategory = params.get('category') ?? '';
  const activeBrand = params.get('brand') ?? '';
  const [term, setTerm] = useState(params.get('q') ?? '');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const brands = useMemo(
    () => Array.from(new Set((items as Item[]).map((i) => i.brand).filter(Boolean) as string[])).sort(),
    [items]
  );

  const category = (categories as Category[]).find((c) => c.slug === activeCategory);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (items as Item[]).filter((item) => {
      if (category && !(item.categoryIds ?? []).includes(category.id)) return false;
      if (activeBrand && item.brand !== activeBrand) return false;
      if (!q) return true;
      // Search every stored translation, not just the visible one.
      const haystack = [
        ...Object.values(item.name ?? {}),
        ...Object.values(item.shortDescription ?? {}),
        ...Object.values(item.description ?? {}),
        item.brand, item.model, item.sku,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [items, category, activeBrand, term]);

  const catName = (id?: string) => {
    const c = (categories as Category[]).find((x) => x.id === id);
    return c ? L(c.name) : undefined;
  };

  const hasFilters = Boolean(activeCategory || activeBrand || term);

  return (
    <>
      <Seo
        title={category ? (category.seoTitle && L(category.seoTitle) ? category.seoTitle : category.name) : { ka: 'აპარატურა', en: 'Equipment', ru: 'Оборудование' }}
        description={category?.seoDescription ?? category?.description}
      />
      <PageHeader
        eyebrow={t('nav_equipment')}
        title={category ? L(category.name) : t('nav_equipment')}
        subtitle={category ? L(category.description) : undefined}
        crumbs={category ? [{ label: t('nav_equipment'), to: '/equipment' }, { label: L(category.name) }] : undefined}
      />

      <section className="container-x pb-24">
        <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-[#1A1A1D]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A72]" aria-hidden="true" />
            <input
              type="search" value={term}
              onChange={(e) => { setTerm(e.target.value); setParam('q', e.target.value); }}
              placeholder={t('search')} aria-label={t('search')}
              className="field !pl-10"
            />
          </div>
          <select
            className="field !w-auto min-w-[180px]" aria-label={t('category')}
            value={activeCategory} onChange={(e) => setParam('category', e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            {(categories as Category[]).map((c) => (
              <option key={c.id} value={c.slug}>{L(c.name)}</option>
            ))}
          </select>
          {brands.length > 0 && (
            <select
              className="field !w-auto min-w-[160px]" aria-label={t('brand')}
              value={activeBrand} onChange={(e) => setParam('brand', e.target.value)}
            >
              <option value="">{t('allBrands')}</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setTerm(''); setParams(new URLSearchParams(), { replace: true }); }}
              className="text-sm text-[#8C8C93] hover:text-[#F2EFE9] inline-flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />{t('clearFilters')}
            </button>
          )}
        </div>

        <p className={cx('py-6 text-xs tracking-[0.16em] uppercase text-[#6A6A72]')}>
          {filtered.length} / {(items as Item[]).length}
        </p>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState title={hasFilters ? t('noResults') : t('empty')} />
        ) : (
          <div className="grid gap-px bg-[#141417] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:bg-[#0A0A0B]">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 8) * 45}>
                <EquipmentCard item={item} categoryName={catName(item.categoryIds?.[0])} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
