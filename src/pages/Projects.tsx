import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { COL } from '../lib/db';
import { useDocBySlug, useDocsByIds, useProjects } from '../lib/content';
import { Seo } from '../lib/seo';
import type { Equipment, Project, Service } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { ProjectCard } from '../components/cards';
import { EmptyState, Img, Lightbox, Reveal, Spinner } from '../components/primitives';
import { NotFound } from './NotFound';

export function ProjectsPage() {
  const { t } = useI18n();
  const { data, loading } = useProjects();
  return (
    <>
      <Seo title={{ ka: 'პროექტები', en: 'Projects', ru: 'Проекты' }} />
      <PageHeader eyebrow={t('nav_projects')} title={t('nav_projects')} />
      <section className="container-x pb-24">
        {loading ? <Spinner /> : (data as Project[]).length === 0 ? <EmptyState /> : (
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {(data as Project[]).map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProjectCard project={p} large={i % 3 === 0} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { L, t } = useI18n();
  const { data: project, loading, notFound } = useDocBySlug<Project>(COL.projects, slug);
  const equipment = useDocsByIds<Equipment>(COL.equipment, project?.equipmentIds ?? []);
  const services = useDocsByIds<Service>(COL.services, project?.serviceIds ?? []);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (notFound || !project) return <NotFound />;

  const gallery = (project.gallery ?? []).filter(Boolean);

  return (
    <>
      <Seo
        title={project.seoTitle && L(project.seoTitle) ? project.seoTitle : project.title}
        description={project.seoDescription ?? project.description}
        image={project.image}
        type="article"
      />
      <PageHeader
        eyebrow={[L(project.location), project.date].filter(Boolean).join(' · ')}
        title={L(project.title)}
        crumbs={[{ label: t('nav_projects'), to: '/projects' }, { label: L(project.title) }]}
      />
      <section className="container-x pb-16">
        <Img src={project.image} alt={project.title} ratio="16/9" priority />
      </section>
      <section className="container-x pb-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <p className="text-lg text-[#C9C9CE] leading-relaxed whitespace-pre-line">{L(project.description)}</p>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9 text-sm space-y-6">
          {project.client && (
            <div><p className="eyebrow mb-2">Client</p><p>{project.client}</p></div>
          )}
          {equipment.length > 0 && (
            <div>
              <p className="eyebrow mb-2">{t('nav_equipment')}</p>
              <ul className="space-y-1 text-[#9A9AA0]">
                {equipment.map((e) => <li key={e.id}>{L(e.name)}</li>)}
              </ul>
            </div>
          )}
          {services.length > 0 && (
            <div>
              <p className="eyebrow mb-2">{t('nav_services')}</p>
              <ul className="space-y-1 text-[#9A9AA0]">
                {services.map((s) => <li key={s.id}>{L(s.title)}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {project.video && (
        <section className="container-x pb-20">
          <div className="aspect-video border border-[#1A1A1D]">
            <iframe src={project.video} title={L(project.title)} allowFullScreen loading="lazy" className="w-full h-full" style={{ border: 0 }} />
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="container-x pb-28 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((g, i) => (
            <button key={g + i} type="button" onClick={() => setLightbox(i)} aria-label={`${t('gallery')} ${i + 1}`}>
              <Img src={g} alt={project.title} ratio="4/3" className="hover:opacity-85 transition-opacity" />
            </button>
          ))}
        </section>
      )}

      {lightbox !== null && (
        <Lightbox images={gallery} index={lightbox} alt={L(project.title)}
                  onClose={() => setLightbox(null)} onIndex={setLightbox} />
      )}
    </>
  );
}
