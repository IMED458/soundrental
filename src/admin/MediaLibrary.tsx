import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Search, Trash2, Upload } from 'lucide-react';
import { deleteMedia, findMediaUsage, listMedia, updateMediaAlt, uploadMedia } from '../lib/media';
import type { MediaItem } from '../lib/types';
import { ConfirmDialog, Input, LocField, Panel, useToast } from './ui';

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [confirm, setConfirm] = useState<{ item: MediaItem; usage: string[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listMedia()); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not load media', 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) await uploadMedia(file, 'image');
      toast(`${files.length} file(s) uploaded`);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'err');
    } finally { setBusy(false); }
  };

  const askDelete = async (item: MediaItem) => {
    const usage = await findMediaUsage(item.url);
    setConfirm({ item, usage });
  };

  const filtered = items.filter((i) => i.filename.toLowerCase().includes(term.toLowerCase()));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Media library</h1>
          <p className="text-sm text-[#6A6A72] mt-1">
            {items.length} files · uploads are resized and converted to WebP automatically
          </p>
        </div>
        <button type="button" className="btn btn-primary !py-2" onClick={() => fileInput.current?.click()} disabled={busy}>
          <Upload className="w-4 h-4" /> {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden"
               onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />
      </div>

      <Panel>
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A72]" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by filename…" className="!pl-10" />
        </div>

        {loading ? (
          <p className="text-sm text-[#6A6A72] py-8 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#6A6A72] py-10 text-center">No media yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((item) => (
              <figure key={item.id} className="border border-[#232327]">
                <img src={item.url} alt="" className="w-full aspect-square object-cover bg-[#0E0E10]" loading="lazy" />
                <figcaption className="p-2">
                  <p className="text-[11px] text-[#C9C9CE] truncate" title={item.filename}>{item.filename}</p>
                  <p className="text-[10px] text-[#6A6A72]">
                    {item.width && item.height ? `${item.width}×${item.height}` : ''} {item.size ? `· ${Math.round(item.size / 1024)} KB` : ''}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <button type="button" onClick={() => setEditing(item)} className="text-[10px] text-[#8C8C93] hover:text-[var(--accent)]">Alt</button>
                    <button type="button" onClick={() => { void navigator.clipboard.writeText(item.url); toast('URL copied'); }}
                            className="text-[10px] text-[#8C8C93] hover:text-[var(--accent)] flex items-center gap-1">
                      <Copy className="w-3 h-3" />URL
                    </button>
                    <button type="button" onClick={() => void askDelete(item)}
                            className="ml-auto text-[10px] text-[#8C8C93] hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-[150] bg-black/80 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="admin-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <p className="font-display mb-4">{editing.filename}</p>
            <LocField label="Alt text" value={editing.alt} onChange={(alt) => setEditing({ ...editing, alt })}
                      hint="Describe the image. Shown to screen readers and search engines in the visitor's language." />
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

      {confirm && (
        <ConfirmDialog
          title={`Delete “${confirm.item.filename}”?`}
          body={confirm.usage.length
            ? `This file is still referenced in: ${confirm.usage.join(', ')}. Deleting it will leave those places without an image.`
            : 'This file is not referenced anywhere. It will be removed permanently.'}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await deleteMedia(confirm.item);
            setConfirm(null);
            toast('File deleted');
            await load();
          }}
        />
      )}
    </>
  );
}
