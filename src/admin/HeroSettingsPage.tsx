import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { COL, getDocById, saveDoc } from '../lib/db';
import { DEFAULT_HERO } from '../lib/defaults';
import { mergeSettings } from '../lib/settings';
import { uploadMedia } from '../lib/media';
import type { HeroSettings } from '../lib/types';
import { uid } from '../lib/utils';
import { Field, ImageField, Input, LocField, Panel, Select, Toggle, useToast, useUnsavedWarning } from './ui';

function ModelField({
  label, value, onChange, hint,
}: { label: string; value?: string; onChange: (v: string) => void; hint?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadMedia(file, 'model');
      onChange(res.url);
      toast('Model uploaded');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'err');
    } finally { setBusy(false); }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs" onClick={() => input.current?.click()} disabled={busy}>
          <Upload className="w-4 h-4" /> {busy ? 'Uploading…' : 'Upload .glb'}
        </button>
        <input ref={input} type="file" accept=".glb,.gltf" className="hidden"
               onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a model URL" className="flex-1 min-w-[240px]" />
        {value && (
          <button type="button" className="text-xs text-[#8C8C93] hover:text-red-400" onClick={() => onChange('')}>
            Use built-in speaker
          </button>
        )}
      </div>
    </Field>
  );
}

function NumberSlider({
  label, value, onChange, min, max, step, hint,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; hint?: string }) {
  return (
    <Field label={`${label} — ${value}`} hint={hint}>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(Number(e.target.value))}
             className="w-full accent-[var(--accent)]" />
    </Field>
  );
}

export function HeroSettingsPage() {
  const [h, setH] = useState<HeroSettings | null>(null);
  const [initial, setInitial] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const stored = await getDocById<Partial<HeroSettings>>(COL.settings, 'hero3d');
      const merged = mergeSettings(DEFAULT_HERO, stored ?? undefined);
      setH(merged);
      setInitial(JSON.stringify(merged));
    })().catch((e) => toast(String(e), 'err'));
  }, [toast]);

  const dirty = Boolean(h) && JSON.stringify(h) !== initial;
  useUnsavedWarning(dirty);

  if (!h) return <p className="text-sm text-[#6A6A72]">Loading…</p>;
  const set = <K extends keyof HeroSettings>(k: K, v: HeroSettings[K]) => setH({ ...h, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const { id: _drop, ...payload } = h as HeroSettings & { id?: string };
      await saveDoc(COL.settings, 'hero3d', payload);
      setInitial(JSON.stringify(h));
      toast('3D hero settings saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'err');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">3D hero settings</h1>
          {dirty && <p className="text-xs text-[#C2903C] mt-1">Unsaved changes</p>}
        </div>
        <button type="button" className="btn btn-primary !py-2" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <Panel title="Behaviour">
        <Toggle label="Enable the 3D hero" checked={h.enabled} onChange={(v) => set('enabled', v)}
                hint="When off, the homepage shows the static hero with the fallback image." />
        <Toggle label="Enable on mobile" checked={h.enabledOnMobile} onChange={(v) => set('enabledOnMobile', v)}
                hint="The scene already drops shadows and pixel ratio on phones." />
        <Toggle label="Show exploded-view labels" checked={h.showLabels} onChange={(v) => set('showLabels', v)} />
        <Toggle label="Accent rim light" checked={h.accentLight} onChange={(v) => set('accentLight', v)} />
      </Panel>

      <Panel title="Model">
        <Field label="Built-in product" hint="Used when no GLB is uploaded below.">
          <Select value={h.modelType ?? 'dj_mixer'}
                  onChange={(e) => set('modelType', e.target.value as HeroSettings['modelType'])}>
            <option value="dj_mixer">DJ controller / mixer</option>
            <option value="speaker">PA speaker</option>
          </Select>
        </Field>
        <ModelField label="Desktop 3D model" value={h.modelUrl} onChange={(v) => set('modelUrl', v)}
                    hint="GLB or GLTF. Leave empty to use the built-in PA speaker. Each top-level object in the file becomes one exploded part." />
        <ModelField label="Mobile 3D model (lighter)" value={h.modelUrlMobile} onChange={(v) => set('modelUrlMobile', v)}
                    hint="Optional low-poly version served to phones." />
        <ImageField label="Fallback hero image" value={h.fallbackImage} onChange={(v) => set('fallbackImage', v)}
                    hint="Shown when 3D is off, WebGL is unavailable, or the visitor prefers reduced motion." />
        <Field label="Background colour">
          <div className="flex items-center gap-3">
            <input type="color" value={h.background} onChange={(e) => set('background', e.target.value)}
                   className="w-12 h-10 bg-transparent border border-[#232327] cursor-pointer" />
            <Input value={h.background} onChange={(e) => set('background', e.target.value)} className="w-40" />
          </div>
        </Field>
      </Panel>

      <Panel title="Camera & motion">
        <NumberSlider label="Initial scale" value={h.initialScale} onChange={(v) => set('initialScale', v)} min={0.4} max={2.5} step={0.05} />
        <NumberSlider label="Initial rotation (Y)" value={h.initialRotationY} onChange={(v) => set('initialRotationY', v)} min={-3.14} max={3.14} step={0.05} />
        <NumberSlider label="Camera distance" value={h.cameraDistance} onChange={(v) => set('cameraDistance', v)} min={3} max={12} step={0.1} />
        <NumberSlider label="Animation intensity" value={h.intensity} onChange={(v) => set('intensity', v)} min={0.2} max={2} step={0.05} />
        <NumberSlider label="Exploded distance multiplier" value={h.explodeDistance} onChange={(v) => set('explodeDistance', v)} min={0.2} max={3} step={0.05} />
        <NumberSlider label="Scroll section height (vh)" value={h.sectionHeight} onChange={(v) => set('sectionHeight', v)} min={200} max={700} step={10}
                      hint="How much scrolling the full sequence takes. 450 is a good default." />
      </Panel>

      <Panel title="Hero copy">
        <LocField label="Title" value={h.title} onChange={(v) => set('title', v)} multiline rows={2} />
        <LocField label="Subtitle" value={h.subtitle} onChange={(v) => set('subtitle', v)} multiline rows={3} />
        <LocField label="Primary CTA label" value={h.ctaLabel} onChange={(v) => set('ctaLabel', v)} />
        <Field label="Primary CTA link"><Input value={h.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} /></Field>
        <LocField label="Secondary CTA label" value={h.ctaSecondaryLabel} onChange={(v) => set('ctaSecondaryLabel', v)} />
        <Field label="Secondary CTA link"><Input value={h.ctaSecondaryUrl} onChange={(e) => set('ctaSecondaryUrl', e.target.value)} /></Field>
        <LocField label="Storytelling headline" value={h.storyTitle} onChange={(v) => set('storyTitle', v)} multiline rows={2} />
        <LocField label="Final headline" value={h.finalTitle} onChange={(v) => set('finalTitle', v)} multiline rows={2} />
      </Panel>

      <Panel title="Service highlights" right={
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 text-xs"
                onClick={() => set('storyItems', [...h.storyItems, { id: uid('story'), title: {} }])}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      }>
        {h.storyItems.map((item, i) => (
          <div key={item.id} className="border border-[#232327] p-3 mb-3">
            <LocField label={`Highlight ${i + 1}`} value={item.title}
                      onChange={(v) => set('storyItems', h.storyItems.map((x, j) => j === i ? { ...x, title: v } : x))} />
            <button type="button" className="text-xs text-[#8C8C93] hover:text-red-400"
                    onClick={() => set('storyItems', h.storyItems.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
      </Panel>

      <Panel title="Exploded-view labels" right={
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 text-xs"
                onClick={() => set('labels', [...h.labels, { id: uid('lbl'), title: {}, text: {}, visible: true, order: h.labels.length }])}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      }>
        <p className="text-xs text-[#6A6A72] mb-4">Up to four labels are shown, in order, around the disassembled product.</p>
        {h.labels.sort((a, b) => a.order - b.order).map((label, i) => (
          <div key={label.id} className="border border-[#232327] p-4 mb-3">
            <LocField label="Label title" value={label.title}
                      onChange={(v) => set('labels', h.labels.map((x, j) => j === i ? { ...x, title: v } : x))} />
            <LocField label="Label description" value={label.text} multiline rows={2}
                      onChange={(v) => set('labels', h.labels.map((x, j) => j === i ? { ...x, text: v } : x))} />
            <div className="flex items-end gap-4">
              <div className="w-28">
                <label className="field-label">Order</label>
                <Input type="number" value={label.order}
                       onChange={(e) => set('labels', h.labels.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#8C8C93] pb-2.5">
                <input type="checkbox" checked={label.visible} className="accent-[var(--accent)]"
                       onChange={(e) => set('labels', h.labels.map((x, j) => j === i ? { ...x, visible: e.target.checked } : x))} />
                Visible
              </label>
              <button type="button" className="p-2 text-[#6A6A72] hover:text-red-400 pb-2.5"
                      onClick={() => set('labels', h.labels.filter((_, j) => j !== i))} aria-label="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Panel>

      <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save 3D hero settings'}
      </button>
    </>
  );
}
