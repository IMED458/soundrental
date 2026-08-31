import type { Lang, Loc, PricePeriod } from './types';
import { UI } from './i18n';

export function slugify(input: string): string {
  const map: Record<string, string> = {
    ა:'a',ბ:'b',გ:'g',დ:'d',ე:'e',ვ:'v',ზ:'z',თ:'t',ი:'i',კ:'k',ლ:'l',მ:'m',ნ:'n',ო:'o',პ:'p',
    ჟ:'zh',რ:'r',ს:'s',ტ:'t',უ:'u',ფ:'f',ქ:'q',ღ:'gh',ყ:'y',შ:'sh',ჩ:'ch',ც:'ts',ძ:'dz',
    წ:'w',ჭ:'ch',ხ:'kh',ჯ:'j',ჰ:'h',
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',
    о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',
    ь:'',э:'e',ю:'yu',я:'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatPrice(
  opts: {
    showPrice?: boolean; price?: number; priceFrom?: boolean; currency?: string;
    pricePeriod?: PricePeriod; pricePeriodCustom?: Loc;
  },
  lang: Lang,
  L: (v: Loc | string | undefined) => string
): string {
  const t = UI[lang];
  if (!opts.showPrice || typeof opts.price !== 'number' || Number.isNaN(opts.price)) {
    return t.contactForPrice;
  }
  const amount = new Intl.NumberFormat(lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(opts.price);
  const money = `${amount} ${opts.currency || 'GEL'}`.trim();
  const periodLabel =
    opts.pricePeriod === 'day' ? t.perDay
    : opts.pricePeriod === 'event' ? t.perEvent
    : opts.pricePeriod === 'hour' ? t.perHour
    : opts.pricePeriod === 'custom' ? L(opts.pricePeriodCustom)
    : '';
  const base = lang === 'ka'
    ? (opts.priceFrom ? `${money}${t.from}` : money)
    : (opts.priceFrom ? `${t.from} ${money}` : money);
  return periodLabel ? `${base} / ${periodLabel}` : base;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function isValidPhone(v: string): boolean {
  const digits = v.replace(/[^\d]/g, '');
  return digits.length >= 6 && digits.length <= 16;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Hex accent -> readable foreground, so the admin can pick any accent safely. */
export function contrastOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#0A0A0B';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? '#0A0A0B' : '#FFFFFF';
}

export function stripHtml(html: string, max = 180): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
