import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Check, ChevronDown, GripVertical, Image as ImageIcon, Loader2,
  Plus, Search, Trash2, Upload, X,
} from 'lucide-react';
import { LANGS, type Lang, type Loc, type MediaItem } from '../lib/types';
import { LANG_LABEL } from '../lib/i18n';
import { cx } from '../lib/utils';
import { deleteMedia, findMediaUsage, listMedia, uploadMedia, updateMediaAlt } from '../lib/media';

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; text: string; kind: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, kind }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] space-y-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx(
            'px-4 py-3 text-sm border shadow-lg max-w-sm',
            t.kind === 'ok' ? 'bg-[#14261A] border-[#2C5138] text-[#B9E7C9]' : 'bg-[#2A1416] border-[#5A2A2E] text-[#F0B6BB]'
          )}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------ basic fields */

export function Field({
  label, hint, error, required, children,
}: { label?: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {label && (
        <label className="field-label">
          {label}{required && <span className="text-[var(--accent)]"> *</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-[#6A6A72] mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('field', props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('field resize-y', props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx('field', props.className)} />;
}

export function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cx('mt-0.5 w-10 h-6 shrink-0 border transition-colors relative',
          checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[#141417] border-[#2C2C31]')}
      >
        <span className={cx('absolute top-0.5 w-4 h-4 bg-[#0A0A0B] transition-transform',
          checked ? 'translate-x-[19px]' : 'translate-x-0.5')} />
      </button>
      <span>
        <span className="text-sm text-[#E6E3DD] block">{label}</span>
        {hint && <span className="text-xs text-[#6A6A72]">{hint}</span>}
      </span>
    </label>
  );
}

/* --------------------------------------------------- localized text fields */

export function LocField({
  label, value, onChange, multiline, rows = 4, required, hint, html,
}: {
  label: string;
  value: Loc | undefined;
  onChange: (v: Loc) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
  html?: boolean;
}) {
  const [tab, setTab] = useState<Lang>('ka');
  const v = value ?? {};
  const filled = (l: Lang) => Boolean(v[l] && v[l]!.trim());

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="field-label !mb-0">
          {label}{required && <span className="text-[var(--accent)]"> *</span>}
        </label>
        <div className="flex items-center gap-1">
          {LANGS.map((l) => (
            <button
              key={l} type="button" onClick={() => setTab(l)}
              className={cx('px-2.5 py-1 text-[11px] font-display tracking-[0.12em] border transition-colors flex items-center gap-1.5',
                tab === l ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[#26262B] text-[#8C8C93] hover:text-[#E6E3DD]')}
              title={filled(l) ? 'Translated' : 'Missing translation'}
            >
              {LANG_LABEL[l]}
              {filled(l)
                ? <Check className="w-3 h-3 text-[#5FA97A]" />
                : <AlertTriangle className="w-3 h-3 text-[#C2903C]" />}
            </button>
          ))}
        </div>
      </div>
      {multiline || html ? (
        <Textarea
          rows={html ? Math.max(rows, 10) : rows}
          value={v[tab] ?? ''}
          onChange={(e) => onChange({ ...v, [tab]: e.target.value })}
          placeholder={html ? '<p>…</p>' : undefined}
          className={html ? 'font-mono text-[13px]' : undefined}
        />
      ) : (
        <Input value={v[tab] ?? ''} onChange={(e) => onChange({ ...v, [tab]: e.target.value })} />
      )}
      {hint && <p className="text-xs text-[#6A6A72] mt-1.5">{hint}</p>}
    </div>
  );
}

/* --------------------------------------------------------- media selection */

export function MediaModal({
  onPick, onClose, multiple,
}: { onPick: (urls: string[]) => void; onClose: () => void; multiple?: boolean }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listMedia()); }
    catch (e) { toast(String(e), 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadMedia(file, 'image');
        urls.push(res.url);
      }
      await load();
      toast(`${urls.length} file(s) uploaded`);
      if (!multiple) { onPick(urls.slice(0, 1)); onClose(); }
      else setSelected((s) => [...s, ...urls]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'err');
    } finally { setBusy(false); }
  };

  const remove = async (item: MediaItem) => {
    const usage = await findMediaUsage(item.url);
    const message = usage.length
      ? `This file is still referenced in: ${usage.join(', ')}.\nDelete it anyway?`
      : 'Delete this file permanently?';
    if (!window.confirm(message)) return;
    await deleteMedia(item);
    toast('File deleted');
    await load();
  };

  const filtered = items.filter((i) => i.filename.toLowerCase().includes(term.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="admin-card w-full max-w-5xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 p-4 border-b border-[#232327]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A72]" />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search media…" className="!pl-10" />
          </div>
          <button type="button" className="btn btn-ghost !py-2" onClick={() => fileInput.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden"
                 onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-[#8C8C93] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-[#6A6A72] py-10 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#6A6A72] py-10 text-center">No media yet. Upload your first image.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map((item) => {
                const isSel = selected.includes(item.url);
                return (
                  <div key={item.id} className={cx('border relative group', isSel ? 'border-[var(--accent)]' : 'border-[#232327]')}>
                    <button
                      type="button"
                      onClick={() => multiple
                        ? setSelected((s) => isSel ? s.filter((u) => u !== item.url) : [...s, item.url])
                        : (onPick([item.url]), onClose())}
                      className="block w-full aspect-square bg-[#0E0E10]"
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                    <div className="p-2 text-[10px] text-[#6A6A72] truncate">{item.filename}</div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setEditing(item)} title="Alt text"
                              className="p-1.5 bg-black/70 text-[#C9C9CE] hover:text-white"><ImageIcon className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => void remove(item)} title="Delete"
                              className="p-1.5 bg-black/70 text-[#C9C9CE] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="p-4 border-t border-[#232327] flex items-center justify-between">
            <span className="text-sm text-[#8C8C93]">{selected.length} selected</span>
            <button type="button" className="btn btn-primary !py-2"
                    onClick={() => { onPick(selected); onClose(); }} disabled={!selected.length}>
              Add selected
            </button>
          </div>
        )}

        {editing && (
          <div className="absolute inset-0 bg-black/80 grid place-items-center p-4" onClick={() => setEditing(null)}>
            <div className="admin-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <p className="font-display mb-1">{editing.filename}</p>
              <p className="text-xs text-[#6A6A72] mb-5">
                {editing.width && editing.height ? `${editing.width}×${editing.height} · ` : ''}
                {editing.size ? `${Math.round(editing.size / 1024)} KB` : ''}
              </p>
              <LocField label="Alt text" value={editing.alt} onChange={(alt) => setEditing({ ...editing, alt })} />
              <div className="flex gap-3">
                <button type="button" className="btn btn-primary !py-2"
                        onClick={async () => { await updateMediaAlt(editing); toast('Alt text saved'); setEditing(null); await load(); }}>
                  Save
                </button>
                <button type="button" className="btn btn-ghost !py-2" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageField({
  label, value, onChange, hint,
}: { label: string; value?: string; onChange: (v: string) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-4">
        <div className="w-28 h-28 border border-[#232327] bg-[#0E0E10] shrink-0 grid place-items-center overflow-hidden">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" />
                 : <ImageIcon className="w-5 h-5 text-[#3a3a41]" />}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs" onClick={() => setOpen(true)}>
            {value ? 'Replace' : 'Choose image'}
          </button>
          {value && (
            <button type="button" className="text-xs text-[#8C8C93] hover:text-red-400 text-left" onClick={() => onChange('')}>
              Remove
            </button>
          )}
          <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a URL" className="!py-1.5 text-xs w-64" />
        </div>
      </div>
      {open && <MediaModal onClose={() => setOpen(false)} onPick={(urls) => urls[0] && onChange(urls[0])} />}
    </Field>
  );
}

export function GalleryField({
  label, value, onChange,
}: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <Field label={label} hint="Drag order with the arrows. First image shows first.">
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url + i} className="w-24 border border-[#232327]">
            <img src={url} alt="" className="w-full h-24 object-cover" />
            <div className="flex divide-x divide-[#232327] border-t border-[#232327]">
              <button type="button" onClick={() => move(i, i - 1)} className="flex-1 py-1 text-xs text-[#8C8C93] hover:text-white">←</button>
              <button type="button" onClick={() => move(i, i + 1)} className="flex-1 py-1 text-xs text-[#8C8C93] hover:text-white">→</button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                      className="flex-1 py-1 text-xs text-[#8C8C93] hover:text-red-400">×</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)}
                className="w-24 h-24 border border-dashed border-[#2C2C31] grid place-items-center text-[#6A6A72] hover:text-[var(--accent)] hover:border-[var(--accent)]">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {open && <MediaModal multiple onClose={() => setOpen(false)} onPick={(urls) => onChange([...value, ...urls])} />}
    </Field>
  );
}

/* --------------------------------------------------------------- relations */

export function MultiSelectField({
  label, value, onChange, options, hint,
}: {
  label: string; value: string[]; onChange: (v: string[]) => void;
  options: Array<{ id: string; label: string }>; hint?: string;
}) {
  const [term, setTerm] = useState('');
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(term.toLowerCase())),
    [options, term]
  );
  return (
    <Field label={label} hint={hint}>
      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter…" className="mb-2" />
      <div className="max-h-56 overflow-y-auto border border-[#232327] p-2 space-y-1">
        {filtered.length === 0 && <p className="text-xs text-[#6A6A72] p-2">Nothing to choose yet.</p>}
        {filtered.map((o) => {
          const checked = value.includes(o.id);
          return (
            <label key={o.id} className="flex items-center gap-3 text-sm py-1 cursor-pointer">
              <input
                type="checkbox" checked={checked} className="accent-[var(--accent)] w-4 h-4"
                onChange={() => onChange(checked ? value.filter((v) => v !== o.id) : [...value, o.id])}
              />
              <span className="text-[#C9C9CE]">{o.label}</span>
            </label>
          );
        })}
      </div>
      {value.length > 0 && <p className="text-xs text-[#6A6A72] mt-1.5">{value.length} selected</p>}
    </Field>
  );
}

/* ------------------------------------------------------ ordering & dialogs */

export function SortableRows<T extends { id: string }>({
  items, onReorder, children,
}: {
  items: T[];
  onReorder: (ids: string[]) => void;
  children: (item: T, index: number) => React.ReactNode;
}) {
  const dragId = useRef<string | null>(null);

  const drop = (targetId: string) => {
    const from = items.findIndex((i) => i.id === dragId.current);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((i) => i.id));
  };

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => { dragId.current = item.id; }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop(item.id)}
          className="flex items-center gap-3 border-b border-[#1E1E22] hover:bg-[#131316] transition-colors"
        >
          <GripVertical className="w-4 h-4 text-[#3a3a41] shrink-0 ml-3 cursor-grab" aria-hidden="true" />
          <div className="flex-1 min-w-0">{children(item, index)}</div>
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  title, body, confirmLabel = 'Delete', onConfirm, onCancel,
}: { title: string; body?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[160] bg-black/80 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="admin-card p-7 max-w-md w-full">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-[#C2903C] shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-lg">{title}</p>
            {body && <p className="text-sm text-[#8C8C93] mt-2 leading-relaxed">{body}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-7 justify-end">
          <button type="button" className="btn btn-ghost !py-2" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn !py-2 bg-[#7A2A2E] text-white hover:bg-[#8f3238]" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Warns before leaving a form with unsaved edits. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

export function Panel({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="admin-card p-6 mb-6">
      {(title || right) && (
        <div className="flex items-center justify-between gap-4 mb-6">
          {title && <h2 className="font-display text-base tracking-wide text-[#E6E3DD]">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Collapsible({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="border border-[#232327] mb-4">
      <button type="button" onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#E6E3DD] hover:bg-[#131316]">
        {title}
        <ChevronDown className={cx('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="p-4 border-t border-[#232327]">{children}</div>}
    </div>
  );
}
