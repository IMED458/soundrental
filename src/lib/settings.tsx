import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase';
import { DEFAULT_HERO, DEFAULT_SETTINGS } from './defaults';
import type { HeroSettings, SiteSettings } from './types';
import { contrastOn } from './utils';

interface SettingsValue {
  settings: SiteSettings;
  hero: HeroSettings;
  loading: boolean;
  configured: boolean;
}

const SettingsContext = createContext<SettingsValue>({
  settings: DEFAULT_SETTINGS,
  hero: DEFAULT_HERO,
  loading: true,
  configured: false,
});

/** Merge stored settings over the defaults so a partially-filled document never breaks the site. */
function merge<T>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    const cur = out[k];
    if (cur && typeof cur === 'object' && !Array.isArray(cur) && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = merge(cur, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return; }
    let settled = 0;
    const done = () => { if (++settled >= 2) setLoading(false); };
    const unsubSite = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => { setSettings(merge(DEFAULT_SETTINGS, snap.data() as Partial<SiteSettings>)); done(); },
      (err) => { console.error('settings/site', err); done(); }
    );
    const unsubHero = onSnapshot(
      doc(db, 'settings', 'hero3d'),
      (snap) => { setHero(merge(DEFAULT_HERO, snap.data() as Partial<HeroSettings>)); done(); },
      (err) => { console.error('settings/hero3d', err); done(); }
    );
    return () => { unsubSite(); unsubHero(); };
  }, []);

  // Accent colour is admin-controlled, so it lives on the root element, not in the stylesheet.
  useEffect(() => {
    const accent = settings.accentColor || DEFAULT_SETTINGS.accentColor;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-contrast', contrastOn(accent));
  }, [settings.accentColor]);

  useEffect(() => {
    if (!settings.favicon) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.favicon;
  }, [settings.favicon]);

  return (
    <SettingsContext.Provider value={{ settings, hero, loading, configured: firebaseConfigured }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export { merge as mergeSettings };
