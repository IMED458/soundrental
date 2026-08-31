import type { Lang } from './types';

export const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : '';

export function isExternal(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || /^(mailto:|tel:)/i.test(url);
}

/** Prefix an admin-entered internal path with the active locale. */
export function href(lang: Lang, url: string | undefined | null): string {
  if (!url) return `/${lang}`;
  if (isExternal(url) || url.startsWith('#')) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  if (/^\/(ka|en|ru)(\/|$)/.test(clean)) return clean;
  return `/${lang}${clean === '/' ? '' : clean}`;
}

/** Same page, different locale — used by the language switcher and hreflang tags. */
export function swapLang(pathname: string, next: Lang): string {
  if (/^\/(ka|en|ru)(\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(ka|en|ru)/, `/${next}`);
  }
  return `/${next}${pathname === '/' ? '' : pathname}`;
}

export function absoluteUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const joined = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return `${SITE_ORIGIN}${joined}`;
}
