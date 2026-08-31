import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { COL, listDocs, patchDoc, removeDoc } from '../lib/db';
import type { LeadStatus, QuoteRequest } from '../lib/types';
import { cx } from '../lib/utils';
import { ConfirmDialog, Panel, Select, Textarea, useToast } from './ui';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'confirmed', 'closed'];

export function LeadsPage() {
  const [rows, setRows] = useState<Array<QuoteRequest & { kind: 'contact' | 'quote' }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [open, setOpen] = useState<(QuoteRequest & { kind: 'contact' | 'quote' }) | null>(null);
  const [confirm, setConfirm] = useState<(QuoteRequest & { kind: 'contact' | 'quote' }) | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contact, quotes] = await Promise.all([
        listDocs<QuoteRequest>(COL.contactRequests),
        listDocs<QuoteRequest>(COL.quoteRequests),
      ]);
      const all = [
        ...contact.map((r) => ({ ...r, kind: 'contact' as const })),
        ...quotes.map((r) => ({ ...r, kind: 'quote' as const })),
      ].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setRows(all);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load inquiries', 'err');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const collectionOf = (kind: 'contact' | 'quote') => (kind === 'quote' ? COL.quoteRequests : COL.contactRequests);

  const setStatus = async (row: QuoteRequest & { kind: 'contact' | 'quote' }, status: LeadStatus) => {
    await patchDoc(collectionOf(row.kind), row.id, { status });
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, status } : r)));
    if (open?.id === row.id) setOpen({ ...open, status });
  };

  const saveNotes = async (row: QuoteRequest & { kind: 'contact' | 'quote' }, notes: string) => {
    await patchDoc(collectionOf(row.kind), row.id, { notes });
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, notes } : r)));
    toast('Note saved');
  };

  const drop = async (row: QuoteRequest & { kind: 'contact' | 'quote' }) => {
    await removeDoc(collectionOf(row.kind), row.id);
    setConfirm(null);
    setOpen(null);
    toast('Inquiry deleted');
    await load();
  };

  const visible = useMemo(
    () => rows.filter((r) => filter === 'all' || r.status === filter),
    [rows, filter]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Inquiries</h1>
          <p className="text-sm text-[#6A6A72] mt-1">{visible.length} of {rows.length}</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | LeadStatus)} className="!w-auto">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <Panel>
        {loading ? (
          <p className="text-sm text-[#6A6A72] py-8 text-center">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[#6A6A72] py-10 text-center">No inquiries here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#6A6A72] border-b border-[#232327]">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Reference</th>
                  <th className="py-3 pr-4">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-b border-[#1A1A1D] hover:bg-[#131316]">
                    <td className="py-3 pr-4 text-[#6A6A72] whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <button type="button" onClick={() => setOpen(row)} className="text-[#E6E3DD] hover:text-[var(--accent)]">
                        {row.name}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-[#8C8C93]">{row.phone || row.email || '—'}</td>
                    <td className="py-3 pr-4 text-[#8C8C93]">{row.kind}</td>
                    <td className="py-3 pr-4 text-[#8C8C93] truncate max-w-[180px]">{row.refName ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <Select value={row.status} onChange={(e) => void setStatus(row, e.target.value as LeadStatus)}
                              className="!py-1 !px-2 text-xs !w-auto">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => setConfirm(row)} className="p-2 text-[#6A6A72] hover:text-red-400" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="admin-card w-full max-w-2xl max-h-[88vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl">{open.name}</h2>
                <p className="text-xs text-[#6A6A72] mt-1">
                  {new Date(open.createdAt).toLocaleString()} · {open.kind} · {open.lang?.toUpperCase()}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="p-2 text-[#8C8C93] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              {([
                ['Phone', open.phone], ['Email', open.email], ['Event date', open.eventDate],
                ['Event type', open.eventType], ['Location', open.location], ['Guests', open.guests],
                ['Reference', open.refName],
              ] as Array<[string, string | undefined]>).filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A6A72]">{k}</dt>
                  <dd className="text-[#E6E3DD] mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>

            {open.message && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#6A6A72] mb-2">Message</p>
                <p className="text-sm text-[#C9C9CE] whitespace-pre-line border border-[#232327] p-4">{open.message}</p>
              </div>
            )}

            {open.equipmentIds?.length > 0 && (
              <p className="text-sm text-[#8C8C93] mb-6">Selected equipment ids: {open.equipmentIds.join(', ')}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => void setStatus(open, s)}
                        className={cx('px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors',
                          open.status === s ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)]'
                                            : 'border-[#2C2C31] text-[#8C8C93] hover:text-[#E6E3DD]')}>
                  {s}
                </button>
              ))}
            </div>

            <label className="field-label">Internal note</label>
            <Textarea rows={3} defaultValue={open.notes ?? ''} onBlur={(e) => void saveNotes(open, e.target.value)} />

            <div className="flex gap-3 mt-6">
              {open.phone && <a href={`tel:${open.phone}`} className="btn btn-ghost !py-2">Call</a>}
              {open.email && <a href={`mailto:${open.email}`} className="btn btn-ghost !py-2">Email</a>}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog title={`Delete the inquiry from “${confirm.name}”?`}
                       body="This cannot be undone."
                       onCancel={() => setConfirm(null)} onConfirm={() => void drop(confirm)} />
      )}
    </>
  );
}
