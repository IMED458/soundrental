import type { Lang, SiteSettings } from './types';
import { loc } from './i18n';

/** Digits only — wa.me rejects spaces, +, dashes and parentheses. */
export function normalizeWaNumber(raw: string): string {
  return (raw || '').replace(/[^\d]/g, '');
}

export function buildWhatsAppUrl(
  settings: SiteSettings,
  lang: Lang,
  itemName?: string
): string | null {
  const number = normalizeWaNumber(settings.whatsapp?.number || '');
  if (!settings.whatsapp?.enabled || !number) return null;

  const template = itemName
    ? loc(settings.whatsapp.itemMessage, lang, settings.defaultLang)
    : loc(settings.whatsapp.defaultMessage, lang, settings.defaultLang);

  const text = itemName
    ? (template.includes('{item}') ? template.replace('{item}', itemName) : `${template} ${itemName}`)
    : template;

  // wa.me handles the app/web split itself on both mobile and desktop.
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
