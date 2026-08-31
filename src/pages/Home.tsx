import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import {
  useCategories, useEquipment, useFaqs, useHomepageSections, usePackages,
  useProjects, useServices, useTestimonials,
} from '../lib/content';
import { href } from '../lib/links';
import { Seo, faqJsonLd, organizationJsonLd } from '../lib/seo';
import { absoluteUrl } from '../lib/links';
import { DEFAULT_SECTIONS } from '../lib/defaults';
import type {
  Category, Equipment, Faq, HomepageSection, Project, RentalPackage, Service, Testimonial,
} from '../lib/types';
import { Hero } from '../hero';
import { Accordion, EmptyState, Img, Reveal, SectionHeading } from '../components/primitives';
import { CategoryCard, EquipmentCard, PackageCard, ProjectCard, ServiceCard } from '../components/cards';
import { ContactBlock } from '../components/ContactBlock';

function Grid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };
  return <div className={`grid gap-px bg-[#141417] ${map[cols]} [&>*]:bg-[#0A0A0B]`}>{children}</div>;
}

function Band({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`container-x py-20 md:py-28 ${className}`}>{children}</section>;
}

export function Home() {
  const { lang, L, t } = useI18n();
  const { settings } = useSettings();
  const { data: dbSections } = useHomepageSections(false);
  const { data: categories } = useCategories();
  const { data: equipment } = useEquipment();
  const { data: services } = useServices();
  const { data: packages } = usePackages();
  const { data: projects } = useProjects();
  const { data: faqs } = useFaqs();
  const { data: testimonials } = useTestimonials();

  // Until an admin saves the homepage once, fall back to the shipped default layout.
  const sections: HomepageSection[] = useMemo(() => {
    const rows = (dbSections as HomepageSection[]).filter((s) => s.visible !== false);
    if (rows.length) return [...rows].sort((a, b) => a.order - b.order);
    return DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}` })) as HomepageSection[];
  }, [dbSections]);

  const featured = (equipment as Equipment[]).filter((e) => e.featured).slice(0, 8);
  const catName = (id?: string) => {
    const c = (categories as Category[]).find((x) => x.id === id);
    return c ? L(c.name) : undefined;
  };

  const jsonLd = useMemo(() => {
    const org = organizationJsonLd(
      L(settings.siteName) || settings.companyName,
      absoluteUrl(`/${lang}`),
      settings.logo,
      settings.contact.phones?.filter(Boolean) ?? [],
      settings.socials?.filter((s) => s.active && s.url).map((s) => s.url) ?? []
    );
    const faq = faqJsonLd((faqs as Faq[]).slice(0, 8).map((f) => ({ q: L(f.question), a: L(f.answer) })));
    return faq ? { '@context': 'https://schema.org', '@graph': [org, faq] } : org;
  }, [settings, faqs, lang, L]);

  const renderSection = (s: HomepageSection) => {
    const title = L(s.title);
    const subtitle = L(s.subtitle);

    switch (s.type) {
      case 'hero3d':
        return <Hero key={s.id} />;

      case 'intro':
        return (
          <Band key={s.id}>
            <Reveal>
              <div className="grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                  <h2 className="text-3xl md:text-5xl leading-[1.05]">{title}</h2>
                </div>
                <div className="md:col-span-6 md:col-start-7">
                  <p className="text-lg text-[#9A9AA0] leading-relaxed whitespace-pre-line">{L(s.content)}</p>
                  {L(s.ctaLabel) && (
                    <Link to={href(lang, s.ctaUrl)} className="btn btn-ghost mt-8">{L(s.ctaLabel)}</Link>
                  )}
                </div>
              </div>
            </Reveal>
          </Band>
        );

      case 'categories':
        return (
          <Band key={s.id}>
            <SectionHeading eyebrow={t('nav_equipment')} title={title} subtitle={subtitle}
              action={<Link to={href(lang, '/equipment')} className="btn btn-ghost">{t('viewAll')}</Link>} />
            {(categories as Category[]).length ? (
              <Grid cols={4}>
                {(categories as Category[]).slice(0, 8).map((c, i) => (
                  <Reveal key={c.id} delay={i * 60}><CategoryCard category={c} /></Reveal>
                ))}
              </Grid>
            ) : <EmptyState />}
          </Band>
        );

      case 'featured':
        return (
          <Band key={s.id}>
            <SectionHeading eyebrow={t('featured')} title={title} subtitle={subtitle}
              action={<Link to={href(lang, '/equipment')} className="btn btn-ghost">{t('viewAll')}</Link>} />
            {featured.length ? (
              <Grid cols={4}>
                {featured.map((e, i) => (
                  <Reveal key={e.id} delay={i * 50}>
                    <EquipmentCard item={e} categoryName={catName(e.categoryIds?.[0])} />
                  </Reveal>
                ))}
              </Grid>
            ) : <EmptyState />}
          </Band>
        );

      case 'services':
        return (
          <Band key={s.id}>
            <SectionHeading eyebrow={t('nav_services')} title={title} subtitle={subtitle}
              action={<Link to={href(lang, '/services')} className="btn btn-ghost">{t('viewAll')}</Link>} />
            {(services as Service[]).length ? (
              <Grid cols={3}>
                {(services as Service[]).slice(0, 6).map((sv, i) => (
                  <Reveal key={sv.id} delay={i * 60}><ServiceCard service={sv} /></Reveal>
                ))}
              </Grid>
            ) : <EmptyState />}
          </Band>
        );

      case 'packages':
        return (
          <Band key={s.id}>
            <SectionHeading eyebrow={t('nav_packages')} title={title} subtitle={subtitle}
              action={<Link to={href(lang, '/packages')} className="btn btn-ghost">{t('viewAll')}</Link>} />
            {(packages as RentalPackage[]).length ? (
              <Grid cols={3}>
                {(packages as RentalPackage[]).slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} delay={i * 60}><PackageCard pkg={p} /></Reveal>
                ))}
              </Grid>
            ) : <EmptyState />}
          </Band>
        );

      case 'why':
        return (
          <Band key={s.id}>
            <SectionHeading title={title} subtitle={subtitle} />
            <div className="grid md:grid-cols-3 gap-px bg-[#141417] [&>*]:bg-[#0A0A0B]">
              {(s.items ?? []).map((it, i) => (
                <Reveal key={it.id} delay={i * 80}>
                  <div className="p-8 md:p-10 h-full">
                    <span className="font-display text-xs text-[var(--accent)] tracking-[0.2em]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl mt-5">{L(it.title)}</h3>
                    <p className="text-[#8C8C93] mt-3 leading-relaxed">{L(it.text)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Band>
        );

      case 'projects': {
        const list = projects as Project[];
        if (!list.length) return null;
        return (
          <Band key={s.id}>
            <SectionHeading eyebrow={t('nav_projects')} title={title} subtitle={subtitle}
              action={<Link to={href(lang, '/projects')} className="btn btn-ghost">{t('viewAll')}</Link>} />
            <div className="grid md:grid-cols-2 gap-10 md:gap-14">
              {list.slice(0, 4).map((p, i) => (
                <Reveal key={p.id} delay={i * 70}><ProjectCard project={p} large={i < 2} /></Reveal>
              ))}
            </div>
          </Band>
        );
      }

      case 'imagebreak':
        if (!s.image) return null;
        return (
          <section key={s.id} className="relative h-[60vh] md:h-[80vh] overflow-hidden my-8">
            <picture>
              {s.imageMobile && <source media="(max-width: 767px)" srcSet={s.imageMobile} />}
              <img src={s.image} alt={title} className="w-full h-full object-cover" loading="lazy" />
            </picture>
            {title && (
              <div className="absolute inset-0 bg-black/40 flex items-end">
                <div className="container-x pb-14">
                  <h2 className="text-3xl md:text-5xl max-w-2xl">{title}</h2>
                </div>
              </div>
            )}
          </section>
        );

      case 'process':
        return (
          <Band key={s.id}>
            <SectionHeading title={title} subtitle={subtitle} />
            <ol className="grid md:grid-cols-4 gap-px bg-[#141417] [&>*]:bg-[#0A0A0B]">
              {(s.items ?? []).map((it, i) => (
                <Reveal key={it.id} delay={i * 70}>
                  <li className="p-8 h-full">
                    <div className="flex items-center gap-3 text-[var(--accent)]">
                      <span className="font-display text-2xl">{String(i + 1).padStart(2, '0')}</span>
                      {i < (s.items?.length ?? 0) - 1 && <ArrowRight className="w-4 h-4 opacity-50" />}
                    </div>
                    <h3 className="font-display text-lg mt-5">{L(it.title)}</h3>
                    {L(it.text) && <p className="text-sm text-[#8C8C93] mt-2 leading-relaxed">{L(it.text)}</p>}
                  </li>
                </Reveal>
              ))}
            </ol>
          </Band>
        );

      case 'stats':
        if (!s.items?.length) return null;
        return (
          <Band key={s.id}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {s.items.map((it) => (
                <Reveal key={it.id}>
                  <p className="font-display text-4xl md:text-6xl text-[var(--accent)]">{it.value}</p>
                  <p className="mt-3 text-sm text-[#8C8C93]">{L(it.title)}</p>
                </Reveal>
              ))}
            </div>
          </Band>
        );

      case 'clients':
        if (!s.items?.length) return null;
        return (
          <Band key={s.id}>
            <SectionHeading title={title} subtitle={subtitle} />
            <div className="flex flex-wrap items-center gap-10 opacity-60">
              {s.items.map((it) => it.image && (
                <img key={it.id} src={it.image} alt={L(it.title)} className="h-8 md:h-10 w-auto object-contain" loading="lazy" />
              ))}
            </div>
          </Band>
        );

      case 'testimonials': {
        const list = testimonials as Testimonial[];
        if (!list.length) return null;
        return (
          <Band key={s.id}>
            <SectionHeading title={title} subtitle={subtitle} />
            <div className="grid md:grid-cols-3 gap-px bg-[#141417] [&>*]:bg-[#0A0A0B]">
              {list.map((tm, i) => (
                <Reveal key={tm.id} delay={i * 70}>
                  <figure className="p-8 h-full flex flex-col">
                    <blockquote className="text-lg leading-relaxed flex-1">“{L(tm.quote)}”</blockquote>
                    <figcaption className="mt-6 text-sm">
                      <span className="text-[#F2EFE9]">{tm.author}</span>
                      {L(tm.role) && <span className="text-[#6A6A72]"> — {L(tm.role)}</span>}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Band>
        );
      }

      case 'faq': {
        const list = faqs as Faq[];
        if (!list.length) return null;
        return (
          <Band key={s.id}>
            <SectionHeading title={title || t('faq')} subtitle={subtitle} />
            <Accordion items={list.map((f) => ({ id: f.id, q: L(f.question), a: L(f.answer) }))} />
          </Band>
        );
      }

      case 'cta':
        return (
          <section key={s.id} className="container-x py-24 md:py-32">
            <Reveal>
              <div className="border border-[#1E1E22] p-10 md:p-20 text-center">
                <h2 className="text-3xl md:text-5xl max-w-2xl mx-auto leading-[1.08]">{title}</h2>
                {subtitle && <p className="mt-5 text-[#9A9AA0] max-w-xl mx-auto">{subtitle}</p>}
                <Link to={href(lang, s.ctaUrl || '/quote')} className="btn btn-primary mt-10">
                  {L(s.ctaLabel) || t('getQuote')}
                </Link>
              </div>
            </Reveal>
          </section>
        );

      case 'contact':
        return (
          <Band key={s.id}>
            <SectionHeading title={title || t('nav_contact')} subtitle={subtitle} />
            <ContactBlock />
          </Band>
        );

      case 'custom':
        return (
          <Band key={s.id}>
            <SectionHeading title={title} subtitle={subtitle} />
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {s.image && <Img src={s.image} alt={s.title} ratio="4/3" />}
              <div className="prose-invert max-w-none text-[#9A9AA0] leading-relaxed whitespace-pre-line">
                {L(s.content)}
              </div>
            </div>
          </Band>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Seo jsonLd={jsonLd} />
      {sections.map(renderSection)}
    </>
  );
}
