import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COL, listDocs } from '../lib/db';
import { loc } from '../lib/i18n';
import type { ContactRequest, Loc } from '../lib/types';
import { Panel } from './ui';

interface Counts { equipment: number; categories: number; services: number; packages: number; projects: number; featured: number; }

export function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [leads, setLeads] = useState<ContactRequest[]>([]);
  const [newLeads, setNewLeads] = useState(0);

  useEffect(() => {
    (async () => {
      const [equipment, categories, services, packages, projects, contact, quotes] = await Promise.all([
        listDocs<any>(COL.equipment), listDocs<any>(COL.categories), listDocs<any>(COL.services),
        listDocs<any>(COL.packages), listDocs<any>(COL.projects),
        listDocs<ContactRequest>(COL.contactRequests), listDocs<ContactRequest>(COL.quoteRequests),
      ]);
      const live = (rows: any[]) => rows.filter((r) => !r.deleted);
      setCounts({
        equipment: live(equipment).length,
        categories: live(categories).length,
        services: live(services).length,
        packages: live(packages).length,
        projects: live(projects).length,
        featured: live(equipment).filter((e) => e.featured).length,
      });
      const all = [...contact, ...quotes].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setLeads(all.slice(0, 8));
      setNewLeads(all.filter((l) => l.status === 'new').length);
    })().catch((e) => console.error(e));
  }, []);

  const stat = (label: string, value: number | undefined, to: string) => (
    <Link to={to} className="admin-card p-5 hover:border-[#3a3a41] transition-colors">
      <p className="text-3xl font-display">{value ?? '—'}</p>
      <p className="text-xs text-[#6A6A72] mt-2 tracking-[0.12em] uppercase">{label}</p>
    </Link>
  );

  return (
    <>
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stat('Equipment', counts?.equipment, '/admin/c/equipment')}
        {stat('Categories', counts?.categories, '/admin/c/categories')}
        {stat('Services', counts?.services, '/admin/c/services')}
        {stat('Packages', counts?.packages, '/admin/c/packages')}
        {stat('Projects', counts?.projects, '/admin/c/projects')}
        {stat('Featured items', counts?.featured, '/admin/c/equipment')}
        {stat('New inquiries', newLeads, '/admin/leads')}
      </div>

      <Panel title="Recent inquiries" right={<Link to="/admin/leads" className="text-xs text-[var(--accent)]">View all</Link>}>
        {leads.length === 0 ? (
          <p className="text-sm text-[#6A6A72] py-6 text-center">No inquiries yet.</p>
        ) : (
          <ul className="divide-y divide-[#1E1E22]">
            {leads.map((l) => (
              <li key={l.id} className="py-3 flex items-center gap-4">
                <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${l.status === 'new' ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border border-[#2C2C31] text-[#8C8C93]'}`}>
                  {l.status}
                </span>
                <span className="text-sm text-[#E6E3DD] flex-1 truncate">{l.name}</span>
                <span className="text-xs text-[#6A6A72]">{l.refName ?? ''}</span>
                <span className="text-xs text-[#6A6A72]">{new Date(l.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
