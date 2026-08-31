import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCcw, Search, Trash2, Eye, EyeOff } from 'lucide-react';
import { COL, createDoc, listDocs, patchDoc, removeDoc, saveDoc, saveOrder } from '../lib/db';
import { LANGS, type Lang, type Loc } from '../lib/types';
import { LANG_LABEL, loc } from '../lib/i18n';
import { cx, slugify } from '../lib/utils';
import { SCHEMAS, type EntitySchema, type FieldDef } from './schema';
import {
  Collapsible, ConfirmDialog, Field, GalleryField, ImageField, Input, LocField,
  MultiSelectField, Panel, Select, SortableRows, Textarea, Toggle, useToast, useUnsavedWarning,
} from './ui';

type Record_ = Record<string, any> & { id: string };

/* ------------------------------------------------------------------ helpers */

function labelOf(record: Record_, schema: EntitySchema): string {
  const v = record[schema.titleField];
  if (typeof v === 'string') return v;
  return loc(v as Loc, 'ka') || loc(v as Loc, 'en') || '(untitled)';
}

function missingLangs(record: Record_, schema: EntitySchema): Lang[] {
  return LANGS.filter((l) =>
    schema.translated.some((key) => {
      const v = record[key] as Loc | undefined;
      const anyFilled = v && LANGS.some((x) => v[x]?.trim());
      return anyFilled && !v?.[l]?.trim();
    })
  );
}

/* --------------------------------------------------------------- list view */

export function CollectionListPage() {
  const { collection = '' } = useParams();
  const schema = SCHEMAS[collection];
  const [rows, setRows] = useState<Record_[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [confirm, setConfirm] = useState<Record_ | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    if (!schema) return;
    setLoading(true);
    try {
      const data = await listDocs<Record_>(schema.name);
      data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setRows(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load records', 'err');
    } finally { setLoading(false); }
  }, [schema, toast]);

  useEffect(() => { void load(); }, [load]);

  if (!schema) return <p className="text-sm text-[#8C8C93]">Unknown collection.</p>;

  const visible = rows
    .filter((r) => Boolean(r.deleted) === showTrash)
    .filter((r) => !term || labelOf(r, schema).toLowerCase().includes(term.toLowerCase()));

  const toggleActive = async (row: Record_) => {
    await patchDoc(schema.name, row.id, { active: !row.active });
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, active: !row.active } : r)));
  };

  const softDelete = async (row: Record_) => {
    await patchDoc(schema.name, row.id, { deleted: true, active: false });
    toast(`${schema.singular} moved to trash`);
    await load();
  };

  const restore = async (row: Record_) => {
    await patchDoc(schema.name, row.id, { deleted: false });
    toast('Restored');
    await load();
  };

  const purge = async (row: Record_) => {
    await removeDoc(schema.name, row.id);
    setConfirm(null);
    toast('Deleted permanently');
    await load();
  };

  const reorder = async (ids: string[]) => {
    setRows((s) => ids.map((id) => s.find((r) => r.id === id)!).filter(Boolean).concat(s.filter((r) => !ids.includes(r.id))));
    try { await saveOrder(schema.name, ids); }
    catch (e) { toast('Could not save the new order', 'err'); void load(); }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">{schema.title}</h1>
          <p className="text-sm text-[#6A6A72] mt-1">{visible.length} {showTrash ? 'in trash' : 'items'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowTrash(!showTrash)}
                  className={cx('btn !py-2 !px-3 text-xs', showTrash ? 'btn-primary' : 'btn-ghost')}>
            <Trash2 className="w-4 h-4" /> Trash
          </button>
          <Link to={`/admin/c/${collection}/new`} className="btn btn-primary !py-2">
            <Plus className="w-4 h-4" /> New {schema.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      <Panel>
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A72]" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search…" className="!pl-10" />
        </div>

        {loading ? (
          <p className="text-sm text-[#6A6A72] py-8 text-center">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[#6A6A72] py-10 text-center">
            {showTrash ? 'Trash is empty.' : `No ${schema.title.toLowerCase()} yet — create the first one.`}
          </p>
        ) : (
          <SortableRows items={visible} onReorder={reorder}>
            {(row) => {
              const missing = missingLangs(row, schema);
              return (
                <div className="flex items-center gap-4 py-3 pr-3">
                  {schema.imageField && (
                    <div className="w-12 h-12 bg-[#0E0E10] border border-[#232327] shrink-0 overflow-hidden">
                      {row[schema.imageField]
                        ? <img src={row[schema.imageField]} alt="" className="w-full h-full object-cover" />
                        : null}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/admin/c/${collection}/${row.id}`} className="text-sm text-[#E6E3DD] hover:text-[var(--accent)] block truncate">
                      {labelOf(row, schema)}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {row.slug && <span className="text-[11px] text-[#6A6A72]">/{row.slug}</span>}
                      {LANGS.map((l) => (
                        <span key={l} className={cx('text-[10px] tracking-widest',
                          missing.includes(l) ? 'text-[#C2903C]' : 'text-[#4A6B55]')}>
                          {LANG_LABEL[l]}{missing.includes(l) ? '⚠' : '✓'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!showTrash ? (
                    <>
                      <button type="button" onClick={() => void toggleActive(row)}
                              title={row.active ? 'Visible — click to hide' : 'Hidden — click to show'}
                              className="p-2 text-[#6A6A72] hover:text-[#E6E3DD]">
                        {row.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => void softDelete(row)} title="Move to trash"
                              className="p-2 text-[#6A6A72] hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => void restore(row)} title="Restore"
                              className="p-2 text-[#6A6A72] hover:text-[#5FA97A]">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setConfirm(row)} title="Delete permanently"
                              className="p-2 text-[#6A6A72] hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              );
            }}
          </SortableRows>
        )}
      </Panel>

      {confirm && (
        <ConfirmDialog
          title={`Delete “${labelOf(confirm, schema)}” permanently?`}
          body="This cannot be undone. Media files stay in the library."
          onCancel={() => setConfirm(null)}
          onConfirm={() => void purge(confirm)}
        />
      )}
    </>
  );
}

/* --------------------------------------------------------------- form view */

export function CollectionFormPage() {
  const { collection = '', id = '' } = useParams();
  const schema = SCHEMAS[collection];
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = id === 'new';

  const [record, setRecord] = useState<Record_ | null>(null);
  const [initial, setInitial] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, Array<{ id: string; label: string }>>>({});

  useEffect(() => {
    if (!schema) return;
    (async () => {
      if (isNew) {
        const blank = { id: 'new', ...schema.defaults() } as Record_;
        setRecord(blank);
        setInitial(JSON.stringify(blank));
      } else {
        const rows = await listDocs<Record_>(schema.name);
        const found = rows.find((r) => r.id === id);
        if (!found) { toast('Record not found', 'err'); navigate(`/admin/c/${collection}`); return; }
        const merged = { ...schema.defaults(), ...found } as Record_;
        setRecord(merged);
        setInitial(JSON.stringify(merged));
      }
    })();
  }, [schema, id, isNew, collection, navigate, toast]);

  // Load option lists for every relation field in this schema.
  useEffect(() => {
    if (!schema) return;
    const relFields = schema.fields.filter((f) => f.type === 'multiref' && f.ref);
    if (!relFields.length) return;
    (async () => {
      const out: Record<string, Array<{ id: string; label: string }>> = {};
      await Promise.all(relFields.map(async (f) => {
        const rows = await listDocs<Record_>(f.ref!);
        out[f.key] = rows
          .filter((r) => !r.deleted)
          .map((r) => ({ id: r.id, label: loc(r[f.refLabel ?? 'name'] as Loc, 'ka') || loc(r[f.refLabel ?? 'name'] as Loc, 'en') || r.id }));
      }));
      setRefs(out);
    })();
  }, [schema]);

  const dirty = Boolean(record) && JSON.stringify(record) !== initial;
  useUnsavedWarning(dirty);

  const set = useCallback((key: string, value: unknown) => {
    setRecord((r) => (r ? { ...r, [key]: value } : r));
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    if (!record || !schema) return false;
    const next: Record<string, string> = {};
    for (const f of schema.fields) {
      if (!f.required) continue;
      const v = record[f.key];
      const empty = f.type === 'loc' || f.type === 'locArea' || f.type === 'locHtml'
        ? !LANGS.some((l) => (v as Loc | undefined)?.[l]?.trim())
        : !String(v ?? '').trim();
      if (empty) next[f.key] = 'Required';
    }
    if (schema.fields.some((f) => f.type === 'slug') && record.slug) {
      const rows = await listDocs<Record_>(schema.name);
      if (rows.some((r) => r.slug === record.slug && r.id !== record.id)) {
        next.slug = 'This slug is already used by another record.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [record, schema]);

  const save = async () => {
    if (!record || !schema) return;
    if (!(await validate())) { toast('Please fix the highlighted fields', 'err'); return; }
    setSaving(true);
    try {
      const { id: _id, ...payload } = record;
      if (isNew) {
        const newId = await createDoc(schema.name, payload);
        toast(`${schema.singular} created`);
        setInitial(JSON.stringify({ ...record, id: newId }));
        navigate(`/admin/c/${collection}/${newId}`, { replace: true });
      } else {
        await saveDoc(schema.name, record.id, payload);
        setInitial(JSON.stringify(record));
        toast('Saved');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'err');
    } finally { setSaving(false); }
  };

  if (!schema) return <p className="text-sm text-[#8C8C93]">Unknown collection.</p>;
  if (!record) return <p className="text-sm text-[#6A6A72]">Loading…</p>;

  const renderField = (f: FieldDef) => {
    if (f.showIf && !f.showIf(record)) return null;
    const value = record[f.key];
    switch (f.type) {
      case 'loc':
        return <LocField key={f.key} label={f.label} required={f.required} hint={f.hint}
                         value={value as Loc} onChange={(v) => set(f.key, v)} />;
      case 'locArea':
        return <LocField key={f.key} label={f.label} required={f.required} hint={f.hint} multiline rows={f.rows}
                         value={value as Loc} onChange={(v) => set(f.key, v)} />;
      case 'locHtml':
        return <LocField key={f.key} label={f.label} required={f.required} html
                         hint={f.hint ?? 'Basic HTML is allowed: <p>, <h2>, <ul>, <a>, <strong>.'}
                         value={value as Loc} onChange={(v) => set(f.key, v)} />;
      case 'image':
        return <ImageField key={f.key} label={f.label} hint={f.hint} value={value as string} onChange={(v) => set(f.key, v)} />;
      case 'gallery':
        return <GalleryField key={f.key} label={f.label} value={(value as string[]) ?? []} onChange={(v) => set(f.key, v)} />;
      case 'multiref':
        return <MultiSelectField key={f.key} label={f.label} hint={f.hint}
                                 value={(value as string[]) ?? []} onChange={(v) => set(f.key, v)}
                                 options={refs[f.key] ?? []} />;
      case 'bool':
        return <Toggle key={f.key} label={f.label} hint={f.hint} checked={Boolean(value)} onChange={(v) => set(f.key, v)} />;
      case 'number':
        return (
          <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]}>
            <Input type="number" value={value === undefined || value === null ? '' : String(value)}
                   onChange={(e) => set(f.key, e.target.value === '' ? undefined : Number(e.target.value))} />
          </Field>
        );
      case 'select':
        return (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <Select value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)}>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
        );
      case 'date':
        return (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <Input type="date" value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)} />
          </Field>
        );
      case 'slug':
        return (
          <Field key={f.key} label={f.label} hint={f.hint} required={f.required} error={errors[f.key]}>
            <div className="flex gap-2">
              <Input value={String(value ?? '')} onChange={(e) => set(f.key, slugify(e.target.value))} />
              <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs whitespace-nowrap"
                      onClick={() => {
                        const source = record[schema.titleField] as Loc | string | undefined;
                        const base = typeof source === 'string' ? source : (source?.en || source?.ka || source?.ru || '');
                        set(f.key, slugify(base));
                      }}>
                From title
              </button>
            </div>
          </Field>
        );
      case 'specs': {
        const rows = (value as Array<{ key: Loc; value: Loc }>) ?? [];
        return (
          <Field key={f.key} label={f.label}>
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="border border-[#232327] p-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <LocField label="Label" value={row.key}
                              onChange={(v) => set(f.key, rows.map((r, j) => (j === i ? { ...r, key: v } : r)))} />
                    <LocField label="Value" value={row.value}
                              onChange={(v) => set(f.key, rows.map((r, j) => (j === i ? { ...r, value: v } : r)))} />
                  </div>
                  <button type="button" className="text-xs text-[#8C8C93] hover:text-red-400"
                          onClick={() => set(f.key, rows.filter((_, j) => j !== i))}>
                    Remove row
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs"
                      onClick={() => set(f.key, [...rows, { key: {}, value: {} }])}>
                <Plus className="w-4 h-4" /> Add specification
              </button>
            </div>
          </Field>
        );
      }
      default:
        return (
          <Field key={f.key} label={f.label} hint={f.hint} required={f.required} error={errors[f.key]}>
            <Input value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)} />
          </Field>
        );
    }
  };

  const grouped = schema.groups.map((g) => ({
    group: g,
    fields: schema.fields.filter((f) => (f.group ?? schema.groups[0]) === g),
  })).filter((g) => g.fields.length > 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/admin/c/${collection}`} className="p-2 text-[#8C8C93] hover:text-white" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl">
              {isNew ? `New ${schema.singular.toLowerCase()}` : labelOf(record, schema)}
            </h1>
            {dirty && <p className="text-xs text-[#C2903C] mt-1">Unsaved changes</p>}
          </div>
        </div>
        <button type="button" className="btn btn-primary !py-2" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
        {grouped.map(({ group, fields }, i) => (
          <Collapsible key={group} title={group} defaultOpen={i < 2}>
            {fields.map(renderField)}
          </Collapsible>
        ))}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </>
  );
}
