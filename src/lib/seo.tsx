import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LANGS, type Lang, type Loc } from './types';
import { useI18n } from './i18n';
import { useSettings } from './settings';
import { absoluteUrl, swapLang } from './links';

function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

function setLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const key = extra.hreflang ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(key);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
}

let jsonLdEl: HTMLScriptElement | null = null;

export interface SeoProps {
  title?: Loc | string;
  description?: Loc | string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  jsonLd?: object | null;
}

/** Head manager: title, description, canonical, hreflang, Open Graph, Twitter, JSON-LD. */
export function Seo({ title, description, image, type = 'website', noIndex, jsonLd }: SeoProps) {
  const { L, lang } = useI18n();
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    const siteName = L(settings.siteName);
    const pageTitle = L(title) || L(settings.seoTitle);
    const full = pageTitle && siteName && pageTitle !== siteName ? `${pageTitle} — ${siteName}` : (pageTitle || siteName);
    const desc = L(description) || L(settings.seoDescription);
    const img = image || settings.ogImage || '';
    const canonical = absoluteUrl(location.pathname);

    document.title = full;
    setMeta('meta[name="description"]', { name: 'description', content: desc });
    setMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex,nofollow' : 'index,follow' });

    setMeta('meta[property="og:title"]', { property: 'og:title', content: full });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: desc });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: lang === 'ka' ? 'ka_GE' : lang === 'ru' ? 'ru_RU' : 'en_US' });
    if (img) setMeta('meta[property="og:image"]', { property: 'og:image', content: img });

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: img ? 'summary_large_image' : 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: full });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc });
    if (img) setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: img });

    setLink('canonical', canonical);
    for (const l of LANGS as Lang[]) {
      setLink('alternate', absoluteUrl(swapLang(location.pathname, l)), { hreflang: l });
    }
    setLink('alternate', absoluteUrl(swapLang(location.pathname, settings.defaultLang)), { hreflang: 'x-default' });
  }, [title, description, image, type, noIndex, settings, lang, location.pathname, L]);

  useEffect(() => {
    if (jsonLdEl) { jsonLdEl.remove(); jsonLdEl = null; }
    if (!jsonLd) return;
    jsonLdEl = document.createElement('script');
    jsonLdEl.type = 'application/ld+json';
    jsonLdEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(jsonLdEl);
    return () => { jsonLdEl?.remove(); jsonLdEl = null; };
  }, [jsonLd]);

  return null;
}

export function organizationJsonLd(name: string, url: string, logo?: string, phones: string[] = [], socials: string[] = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url,
    ...(logo ? { logo, image: logo } : {}),
    ...(phones.length ? { telephone: phones[0] } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

export function productJsonLd(opts: {
  name: string; description: string; image?: string; brand?: string;
  price?: number; currency?: string; url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    description: opts.description,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.brand ? { brand: { '@type': 'Brand', name: opts.brand } } : {}),
    url: opts.url,
    ...(typeof opts.price === 'number'
      ? { offers: { '@type': 'Offer', price: opts.price, priceCurrency: opts.currency || 'GEL', availability: 'https://schema.org/InStock' } }
      : {}),
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
