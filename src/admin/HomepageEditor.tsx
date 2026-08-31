import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { COL, createDoc, listDocs, patchDoc, removeDoc, saveDoc, saveOrder } from '../lib/db';
import { DEFAULT_SECTIONS } from '../lib/defaults';
import { loc } from '../lib/i18n';
import type { HomepageSection, SectionType } from '../lib/types';
import { cx, uid } from '../lib/utils';
import {
  Collapsible, ConfirmDialog, Field, ImageField, Input, LocField, Panel, Select,
  SortableRows, useToast,
} from './ui';

const SECTION_LABELS: Record<SectionType, string> = {
  hero3d: '3D hero', intro: 'Introduction', categories: 'Categories', featured: 'Featured equipment',
  services: 'Services', packages: 'Packages', why: 'Why choose us', projects: 'Projects',
  imagebreak: 'Cinematic image break', process: 'Process steps', stats: 'Statistics',
  clients: 'Client logos', testimonials: 'Testimonials', faq: 'FAQ', cta: 'Call to action',
  contact: 'Contact', custom: 'Custom section',
};

/** Section types whose repeating items the admin edits by hand. */
const ITEM_SECTIONS: SectionType[] = ['why', 'process', 'stats', 'clients', 'custom'];

export function HomepageEditor() {
  const [rows, setRows] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<HomepageSection | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listDocs<HomepageSection>(COL.homepageSections);
    data.sort((a, b) => a.order - b.order);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const seed = async () => {
    for (const [i, section] of DEFAULT_SECTIONS.entries()) {
      await createDoc(COL.homepageSections, { ...section, order: i });
    }
    toast('Homepage initialised with the default layout');
    await load();
  };

  const addSection = async (type: SectionType) => {
    await createDoc(COL.homepageSections, { type, visible: true, order: rows.length, title: {}, subtitle: {}, items: [] });
    toast('Section added');
    await load();
  };

  const update = (id: string, patch: Partial<HomepageSection>) =>
    setRows((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const persist = async (section: HomepageSection) => {
    setSavingId(section.id);
    try {
      const { id, ...payload } = section;
      await saveDoc(COL.homepageSections, id, payload);
      toast('Section saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'err');
    } finally { setSavingId(null); }
  };

  const toggle = async (section: HomepageSection) => {
    update(section.id, { visible: !section.visible });
    await patchDoc(COL.homepageSections, section.id, { visible: !section.visible });
  };

  const reorder = async (ids: string[]) => {
    setRows((s) => ids.map((id) => s.find((r) => r.id === id)!).filter(Boolean));
    await saveOrder(COL.homepageSections, ids);
  };

  const drop = async (section: HomepageSection) => {
    await removeDoc(COL.homepageSections, section.id);
    setConfirm(null);
    toast('Section removed');
    await load();
  };

  if (loading) return <p className="text-sm text-[#6A6A72]">Loading…</p>;

  if (rows.length === 0) {
    return (
      <Panel title="Homepage">
        <p className="text-sm text-[#8C8C93] mb-6">
          The homepage is currently rendering the built-in default layout. Initialise it to take full control:
          reorder, hide and edit every section.
        </p>
        <button type="button" className="btn btn-primary !py-2" onClick={() => void seed()}>
          Initialise homepage sections
        </button>
      </Panel>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Homepage</h1>
          <p className="text-sm text-[#6A6A72] mt-1">Drag to reorder. Changes appear on the site immediately.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select onChange={(e) => { if (e.target.value) void addSection(e.target.value as SectionType); e.target.value = ''; }} defaultValue="">
            <option value="">Add section…</option>
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((k) => (
              <option key={k} value={k}>{SECTION_LABELS[k]}</option>
            ))}
          </Select>
        </div>
      </div>

      <Panel>
        <SortableRows items={rows} onReorder={reorder}>
          {(section) => (
            <div className="py-2 pr-3">
              <div className="flex items-center gap-3">
                <span className={cx('text-sm flex-1', section.visible ? 'text-[#E6E3DD]' : 'text-[#5A5A61] line-through')}>
                  {SECTION_LABELS[section.type] ?? section.type}
                  {loc(section.title, 'ka') && <span className="text-[#6A6A72]"> — {loc(section.title, 'ka')}</span>}
                </span>
                <button type="button" onClick={() => void toggle(section)} className="p-2 text-[#6A6A72] hover:text-[#E6E3DD]"
                        title={section.visible ? 'Visible' : 'Hidden'}>
                  {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => setConfirm(section)} className="p-2 text-[#6A6A72] hover:text-red-400" title="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {section.type !== 'hero3d' && (
                <Collapsible title="Edit content">
                  <LocField label="Title" value={section.title} onChange={(v) => update(section.id, { title: v })} />
                  <LocField label="Subtitle" value={section.subtitle} onChange={(v) => update(section.id, { subtitle: v })} multiline rows={2} />
                  {(section.type === 'intro' || section.type === 'custom') && (
                    <LocField label="Body text" value={section.content} onChange={(v) => update(section.id, { content: v })} multiline rows={6} />
                  )}
                  {(section.type === 'imagebreak' || section.type === 'custom') && (
                    <>
                      <ImageField label="Image (desktop)" value={section.image} onChange={(v) => update(section.id, { image: v })} />
                      <ImageField label="Image (mobile)" value={section.imageMobile} onChange={(v) => update(section.id, { imageMobile: v })} />
                    </>
                  )}
                  {(section.type === 'cta' || section.type === 'intro') && (
                    <>
                      <LocField label="Button label" value={section.ctaLabel} onChange={(v) => update(section.id, { ctaLabel: v })} />
                      <Field label="Button link">
                        <Input value={section.ctaUrl ?? ''} onChange={(e) => update(section.id, { ctaUrl: e.target.value })} />
                      </Field>
                    </>
                  )}

                  {ITEM_SECTIONS.includes(section.type) && (
                    <Field label="Items">
                      <div className="space-y-3">
                        {(section.items ?? []).map((item, i) => (
                          <div key={item.id} className="border border-[#232327] p-3">
                            <LocField label="Title" value={item.title}
                                      onChange={(v) => update(section.id, {
                                        items: (section.items ?? []).map((x, j) => j === i ? { ...x, title: v } : x),
                                      })} />
                            <LocField label="Text" value={item.text} multiline rows={2}
                                      onChange={(v) => update(section.id, {
                                        items: (section.items ?? []).map((x, j) => j === i ? { ...x, text: v } : x),
                                      })} />
                            {section.type === 'stats' && (
                              <Field label="Value">
                                <Input value={item.value ?? ''}
                                       onChange={(e) => update(section.id, {
                                         items: (section.items ?? []).map((x, j) => j === i ? { ...x, value: e.target.value } : x),
                                       })} />
                              </Field>
                            )}
                            {section.type === 'clients' && (
                              <ImageField label="Logo" value={item.image}
                                          onChange={(v) => update(section.id, {
                                            items: (section.items ?? []).map((x, j) => j === i ? { ...x, image: v } : x),
                                          })} />
                            )}
                            <button type="button" className="text-xs text-[#8C8C93] hover:text-red-400"
                                    onClick={() => update(section.id, { items: (section.items ?? []).filter((_, j) => j !== i) })}>
                              Remove item
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs"
                                onClick={() => update(section.id, { items: [...(section.items ?? []), { id: uid('item'), title: {}, text: {} }] })}>
                          <Plus className="w-4 h-4" /> Add item
                        </button>
                      </div>
                    </Field>
                  )}

                  <button type="button" className="btn btn-primary !py-2" onClick={() => void persist(section)} disabled={savingId === section.id}>
                    {savingId === section.id ? 'Saving…' : 'Save section'}
                  </button>
                </Collapsible>
              )}
            </div>
          )}
        </SortableRows>
      </Panel>

      {confirm && (
        <ConfirmDialog
          title={`Remove the “${SECTION_LABELS[confirm.type]}” section?`}
          body="The content stored on this section is deleted. Catalog data is untouched."
          confirmLabel="Remove"
          onCancel={() => setConfirm(null)}
          onConfirm={() => void drop(confirm)}
        />
      )}
    </>
  );
}
