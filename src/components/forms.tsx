import { useMemo, useRef, useState } from 'react';
import { COL, createDoc } from '../lib/db';
import { useI18n } from '../lib/i18n';
import { isValidEmail, isValidPhone } from '../lib/utils';
import type { Equipment, RentalPackage } from '../lib/types';

const RATE_KEY = 'sr_last_submit';
const RATE_MS = 45 * 1000;
const MIN_FILL_MS = 2500;

export interface LeadRef { type: 'equipment' | 'package' | 'service'; id: string; name: string; }

interface BaseProps {
  variant: 'contact' | 'quote';
  reference?: LeadRef;
  equipment?: Equipment[];
  packages?: RentalPackage[];
}

export function LeadForm({ variant, reference, equipment = [], packages = [] }: BaseProps) {
  const { t, lang } = useI18n();
  const [values, setValues] = useState({
    name: '', phone: '', email: '', eventDate: '', eventType: '',
    location: '', guests: '', message: '', packageId: '',
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const honeypot = useRef<HTMLInputElement>(null);
  const startedAt = useMemo(() => Date.now(), []);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = t('required');
    if (!values.phone.trim() && !values.email.trim()) {
      next.phone = t('required');
      next.email = t('required');
    }
    if (values.phone.trim() && !isValidPhone(values.phone)) next.phone = t('invalidPhone');
    if (values.email.trim() && !isValidEmail(values.email)) next.email = t('invalidEmail');
    if (variant === 'contact' && !values.message.trim()) next.message = t('required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (honeypot.current?.value) return;                    // bot filled the hidden field
    if (Date.now() - startedAt < MIN_FILL_MS) return;       // submitted impossibly fast
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    if (Date.now() - last < RATE_MS) {
      setStatus('error');
      setServerError(t('errorSend'));
      return;
    }
    if (!validate()) return;

    setStatus('sending');
    try {
      const payload = {
        name: values.name.trim().slice(0, 180),
        phone: values.phone.trim().slice(0, 40) || undefined,
        email: values.email.trim().slice(0, 180) || undefined,
        eventDate: values.eventDate || undefined,
        eventType: values.eventType.trim().slice(0, 120) || undefined,
        location: values.location.trim().slice(0, 180) || undefined,
        message: values.message.trim().slice(0, 4000),
        lang,
        status: 'new' as const,
        createdAt: Date.now(),
        refType: reference?.type,
        refId: reference?.id,
        refName: reference?.name,
        ...(variant === 'quote'
          ? {
              guests: values.guests.trim().slice(0, 40) || undefined,
              equipmentIds: selected,
              packageId: values.packageId || undefined,
            }
          : {}),
      };
      await createDoc(variant === 'quote' ? COL.quoteRequests : COL.contactRequests, payload);
      localStorage.setItem(RATE_KEY, String(Date.now()));
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setServerError(err instanceof Error ? err.message : t('errorSend'));
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="border border-[var(--accent)] p-10 text-center">
        <p className="font-display text-xl">{t('sent')}</p>
      </div>
    );
  }

  const field = (
    key: keyof typeof values,
    label: string,
    type: string = 'text',
    required = false
  ) => (
    <div>
      <label className="field-label" htmlFor={`f-${key}`}>
        {label}{required && <span className="text-[var(--accent)]"> *</span>}
      </label>
      <input
        id={`f-${key}`} type={type} value={values[key]} onChange={set(key)}
        className="field" aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `e-${key}` : undefined}
      />
      {errors[key] && <p id={`e-${key}`} className="text-xs text-red-400 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {reference && (
        <p className="text-sm text-[#8C8C93] border border-[#1E1E22] px-4 py-3">
          {t('selectedItems')}: <span className="text-[#F2EFE9]">{reference.name}</span>
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {field('name', t('name'), 'text', true)}
        {field('phone', t('phone'), 'tel')}
        {field('email', t('email'), 'email')}
        {field('eventDate', t('eventDate'), 'date')}
        {field('eventType', t('eventType'))}
        {field('location', t('location'))}
        {variant === 'quote' && field('guests', t('guests'))}
      </div>

      {variant === 'quote' && packages.length > 0 && (
        <div>
          <label className="field-label" htmlFor="f-package">{t('nav_packages')}</label>
          <select id="f-package" className="field" value={values.packageId} onChange={set('packageId')}>
            <option value="">—</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>{p.name[lang] || p.name.ka || p.name.en}</option>
            ))}
          </select>
        </div>
      )}

      {variant === 'quote' && equipment.length > 0 && (
        <fieldset>
          <legend className="field-label">{t('selectEquipment')}</legend>
          <div className="max-h-64 overflow-y-auto border border-[#26262B] p-3 grid sm:grid-cols-2 gap-2">
            {equipment.map((item) => {
              const checked = selected.includes(item.id);
              return (
                <label key={item.id} className="flex items-center gap-3 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox" checked={checked}
                    onChange={() => setSelected((s) => checked ? s.filter((x) => x !== item.id) : [...s, item.id])}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  <span className="text-[#C9C9CE]">{item.name[lang] || item.name.ka || item.name.en}</span>
                </label>
              );
            })}
          </div>
          {selected.length > 0 && <p className="text-xs text-[#6A6A72] mt-2">{t('selectedItems')}: {selected.length}</p>}
        </fieldset>
      )}

      <div>
        <label className="field-label" htmlFor="f-message">
          {t('message')}{variant === 'contact' && <span className="text-[var(--accent)]"> *</span>}
        </label>
        <textarea
          id="f-message" rows={5} value={values.message} onChange={set('message')}
          className="field resize-y" aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
      </div>

      {/* Honeypot — hidden from people, irresistible to bots */}
      <input ref={honeypot} type="text" name="company_website" tabIndex={-1} autoComplete="off"
             className="absolute left-[-9999px] w-px h-px" aria-hidden="true" />

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === 'sending'}>
        {status === 'sending' ? t('sending') : t('send')}
      </button>
    </form>
  );
}
