import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import { useI18n, LANG_LABEL } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { useNavigation } from '../lib/content';
import { LANGS, type Lang, type NavItem } from '../lib/types';
import { href, swapLang } from '../lib/links';
import { cx } from '../lib/utils';
import { useWhatsAppUrl } from './WhatsApp';

const FALLBACK_NAV: Array<{ url: string; key: 'nav_equipment' | 'nav_packages' | 'nav_services' | 'nav_projects' | 'nav_about' | 'nav_contact' }> = [
  { url: '/equipment', key: 'nav_equipment' },
  { url: '/packages', key: 'nav_packages' },
  { url: '/services', key: 'nav_services' },
  { url: '/projects', key: 'nav_projects' },
  { url: '/about', key: 'nav_about' },
  { url: '/contact', key: 'nav_contact' },
];

export function LanguageSwitcher({ onPick }: { onPick?: () => void }) {
  const { lang, setLang, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const pick = (l: Lang) => {
    setLang(l);
    navigate(swapLang(location.pathname, l) + location.search, { replace: true });
    onPick?.();
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('language')}>
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="text-[#3a3a41] px-1" aria-hidden="true">/</span>}
          <button
            type="button"
            onClick={() => pick(l)}
            aria-current={l === lang ? 'true' : undefined}
            className={cx(
              'font-display text-xs tracking-[0.14em] px-1 py-1 transition-colors',
              l === lang ? 'text-[var(--accent)]' : 'text-[#8C8C93] hover:text-[#F2EFE9]'
            )}
          >
            {LANG_LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}

export function Header() {
  const { lang, L, t } = useI18n();
  const { settings } = useSettings();
  const { data: navItems } = useNavigation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const waUrl = useWhatsAppUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const items: Array<{ id: string; label: string; url: string; newTab: boolean }> =
    (navItems as NavItem[]).length
      ? (navItems as NavItem[]).filter((n) => !n.parentId).map((n) => ({ id: n.id, label: L(n.label), url: n.url, newTab: n.newTab }))
      : FALLBACK_NAV.map((n) => ({ id: n.url, label: t(n.key), url: n.url, newTab: false }));

  const siteName = L(settings.siteName) || settings.companyName;

  return (
    <>
      <header
        className={cx(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500',
          scrolled || open
            ? 'bg-[#0A0A0B]/95 backdrop-blur-sm border-b border-[#1A1A1D]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="container-x flex items-center justify-between" style={{ height: 'var(--nav-h)' }}>
          <Link to={`/${lang}`} className="flex items-center gap-3 shrink-0" aria-label={siteName}>
            {settings.logo ? (
              <img src={settings.logo} alt={siteName} className="h-7 md:h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-base md:text-lg tracking-[0.02em]">{siteName}</span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
            {items.map((item) => (
              item.newTab || /^https?:/i.test(item.url) ? (
                <a key={item.id} href={item.url} target={item.newTab ? '_blank' : undefined} rel="noopener noreferrer"
                   className="text-sm text-[#C9C9CE] hover:text-[#F2EFE9] link-underline transition-colors">
                  {item.label}
                </a>
              ) : (
                <Link key={item.id} to={href(lang, item.url)}
                      className={cx('text-sm link-underline transition-colors',
                        location.pathname.startsWith(href(lang, item.url)) && href(lang, item.url) !== `/${lang}`
                          ? 'text-[var(--accent)]' : 'text-[#C9C9CE] hover:text-[#F2EFE9]')}>
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            {waUrl && settings.whatsapp?.inHeader && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                 className="hidden md:inline-flex btn btn-ghost !py-2.5 !px-4">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xl:inline">{t('getQuote')}</span>
              </a>
            )}
            <button type="button" className="lg:hidden p-2 -mr-2" aria-label={t('menu')}
                    aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-[#0A0A0B] pt-[var(--nav-h)] lg:hidden overflow-y-auto">
          <nav className="container-x py-8 flex flex-col" aria-label="Mobile">
            {items.map((item, i) => (
              <Link key={item.id} to={href(lang, item.url)}
                    className="py-5 border-b border-[#1A1A1D] font-display text-2xl"
                    style={{ animationDelay: `${i * 40}ms` }}>
                {item.label}
              </Link>
            ))}
            <div className="pt-8 flex items-center justify-between">
              <LanguageSwitcher onPick={() => setOpen(false)} />
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <MessageCircle className="w-4 h-4" />{t('whatsapp')}
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
