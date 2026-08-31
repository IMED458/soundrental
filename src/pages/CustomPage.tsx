import { useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { COL } from '../lib/db';
import { useDocBySlug } from '../lib/content';
import { Seo } from '../lib/seo';
import type { Page } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { Img, Spinner } from '../components/primitives';
import { NotFound } from './NotFound';

/** Renders any admin-created page, including /about. */
export function CustomPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = fixedSlug ?? params.slug;
  const { L } = useI18n();
  const { data: page, loading, notFound } = useDocBySlug<Page>(COL.pages, slug);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (notFound || !page) return <NotFound />;

  return (
    <>
      <Seo
        title={page.seoTitle && L(page.seoTitle) ? page.seoTitle : page.title}
        description={page.seoDescription}
        image={page.heroImage}
      />
      <PageHeader title={L(page.title)} />
      {page.heroImage && (
        <section className="container-x pb-12"><Img src={page.heroImage} alt={page.title} ratio="21/9" priority /></section>
      )}
      <section className="container-x pb-28">
        <div
          className="max-w-3xl text-[#C9C9CE] leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_a]:text-[var(--accent)] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: L(page.content) }}
        />
      </section>
    </>
  );
}
