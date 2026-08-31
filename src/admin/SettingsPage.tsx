import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { COL, getDocById, saveDoc } from '../lib/db';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import { mergeSettings } from '../lib/settings';
import type { SiteSettings } from '../lib/types';
import { uid } from '../lib/utils';
import {
  Field, ImageField, Input, LocField, Panel, Select, Textarea, Toggle, useToast, useUnsavedWarning,
} from './ui';

export function SettingsPage() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [initial, setInitial] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const stored = await getDocById<Partial<SiteSettings>>(COL.settings, 'site');
      const merged = mergeSettings(DEFAULT_SETTINGS, stored ?? undefined);
      setS(merged);
      setInitial(JSON.stringify(merged));
    })().catch((e) => toast(String(e), 'err'));
  }, [toast]);

  const dirty = Boolean(s) && JSON.stringify(s) !== initial;
  useUnsavedWarning(dirty);

  if (!s) return <p className="text-sm text-[#6A6A72]">Loading…</p>;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const setContact = <K extends keyof SiteSettings['contact']>(k: K, v: SiteSettings['contact'][K]) =>
    setS({ ...s, contact: { ...s.contact, [k]: v } });
  const setWa = <K extends keyof SiteSettings['whatsapp']>(k: K, v: SiteSettings['whatsapp'][K]) =>
    setS({ ...s, whatsapp: { ...s.whatsapp, [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      const { id: _drop, ...payload } = s as SiteSettings & { id?: string };
      await saveDoc(COL.settings, 'site', payload);
      setInitial(JSON.stringify(s));
      toast('Website settings saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'err');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Website settings</h1>
          {dirty && <p className="text-xs text-[#C2903C] mt-1">Unsaved changes</p>}
        </div>
        <button type="button" className="btn btn-primary !py-2" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <Panel title="General">
        <LocField label="Site name" value={s.siteName} onChange={(v) => set('siteName', v)} />
        <Field label="Legal company name">
          <Input value={s.companyName} onChange={(e) => set('companyName', e.target.value)} />
        </Field>
        <Field label="Default language" hint="Used when a translation is missing.">
          <Select value={s.defaultLang} onChange={(e) => set('defaultLang', e.target.value as SiteSettings['defaultLang'])}>
            <option value="ka">Georgian</option>
            <option value="en">English</option>
            <option value="ru">Russian</option>
          </Select>
        </Field>
        <Field label="Accent colour" hint="One restrained accent is enough — it drives buttons, links and the 3D rim light.">
          <div className="flex items-center gap-3">
            <input type="color" value={s.accentColor} onChange={(e) => set('accentColor', e.target.value)}
                   className="w-12 h-10 bg-transparent border border-[#232327] cursor-pointer" />
            <Input value={s.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="w-40" />
          </div>
        </Field>
        <LocField label="Copyright line" value={s.copyright} onChange={(v) => set('copyright', v)} />
        <LocField label="Footer description" value={s.footerDescription} onChange={(v) => set('footerDescription', v)} multiline rows={3} />
      </Panel>

      <Panel title="Branding">
        <ImageField label="Logo" value={s.logo} onChange={(v) => set('logo', v)} hint="Shown in the header. SVG or PNG with transparency works best." />
        <ImageField label="Light logo" value={s.logoLight} onChange={(v) => set('logoLight', v)} />
        <ImageField label="Footer logo" value={s.logoFooter} onChange={(v) => set('logoFooter', v)} />
        <ImageField label="Favicon" value={s.favicon} onChange={(v) => set('favicon', v)} hint="Square, at least 64×64." />
      </Panel>

      <Panel title="Contact information">
        <Field label="Phone numbers" hint="One per line.">
          <Textarea rows={3} value={(s.contact.phones ?? []).join('\n')}
                    onChange={(e) => setContact('phones', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
        </Field>
        <Field label="Email">
          <Input type="email" value={s.contact.email} onChange={(e) => setContact('email', e.target.value)} />
        </Field>
        <LocField label="Address" value={s.contact.addresses} onChange={(v) => setContact('addresses', v)} />
        <LocField label="Working hours" value={s.contact.workingHours} onChange={(v) => setContact('workingHours', v)} />
        <Field label="Google Maps embed URL" hint="Maps → Share → Embed a map → copy the src value only.">
          <Input value={s.contact.mapEmbed ?? ''} onChange={(e) => setContact('mapEmbed', e.target.value)} />
        </Field>
        <Field label="Map link">
          <Input value={s.contact.mapLink ?? ''} onChange={(e) => setContact('mapLink', e.target.value)} />
        </Field>
        <LocField label="Company registration details" value={s.contact.registration} onChange={(v) => setContact('registration', v)} multiline rows={2} />
      </Panel>

      <Panel title="WhatsApp">
        <Toggle label="Enable WhatsApp" checked={s.whatsapp.enabled} onChange={(v) => setWa('enabled', v)} />
        <Field label="WhatsApp number" hint="International format, e.g. 995555123456. Digits only are used for the link.">
          <Input value={s.whatsapp.number} onChange={(e) => setWa('number', e.target.value)} />
        </Field>
        <Toggle label="Floating button on every page" checked={s.whatsapp.floating} onChange={(v) => setWa('floating', v)} />
        <Toggle label="Button in the header" checked={s.whatsapp.inHeader} onChange={(v) => setWa('inHeader', v)} />
        <LocField label="Default message" value={s.whatsapp.defaultMessage} onChange={(v) => setWa('defaultMessage', v)} multiline rows={2} />
        <LocField label="Message from an equipment page" value={s.whatsapp.itemMessage}
                  onChange={(v) => setWa('itemMessage', v)} multiline rows={2}
                  hint="Use {item} where the equipment name should appear." />
      </Panel>

      <Panel title="Social networks" right={
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 text-xs"
                onClick={() => set('socials', [...s.socials, { id: uid('soc'), network: '', url: '', active: true }])}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      }>
        {s.socials.length === 0 && <p className="text-sm text-[#6A6A72]">No social links yet.</p>}
        {s.socials.map((soc, i) => (
          <div key={soc.id} className="flex flex-wrap items-end gap-3 border border-[#232327] p-3 mb-3">
            <div className="w-40">
              <label className="field-label">Network</label>
              <Input value={soc.network} placeholder="Instagram"
                     onChange={(e) => set('socials', s.socials.map((x, j) => j === i ? { ...x, network: e.target.value } : x))} />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="field-label">URL</label>
              <Input value={soc.url} placeholder="https://"
                     onChange={(e) => set('socials', s.socials.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#8C8C93] pb-2.5">
              <input type="checkbox" checked={soc.active} className="accent-[var(--accent)]"
                     onChange={(e) => set('socials', s.socials.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))} />
              Visible
            </label>
            <button type="button" className="p-2 text-[#6A6A72] hover:text-red-400 pb-2.5"
                    onClick={() => set('socials', s.socials.filter((_, j) => j !== i))} aria-label="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </Panel>

      <Panel title="SEO defaults">
        <LocField label="Default SEO title" value={s.seoTitle} onChange={(v) => set('seoTitle', v)} />
        <LocField label="Default SEO description" value={s.seoDescription} onChange={(v) => set('seoDescription', v)} multiline rows={3} />
        <ImageField label="Social sharing image" value={s.ogImage} onChange={(v) => set('ogImage', v)} hint="1200×630 works best." />
        <Field label="Analytics ID" hint="Optional. e.g. G-XXXXXXXXXX">
          <Input value={s.analyticsId ?? ''} onChange={(e) => set('analyticsId', e.target.value)} />
        </Field>
      </Panel>

      <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save all settings'}
      </button>
    </>
  );
}
