import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Music2, Mail, Phone, MapPin, Clock, ArrowUp } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { useNavigation, usePages } from '../lib/content';
import { href } from '../lib/links';
import type { NavItem, Page } from '../lib/types';
import { WhatsAppLink } from './WhatsApp';

const ICONS: Record<string, React.ElementType> = {
  instagram: Instagram, facebook: Facebook, youtube: Youtube, tiktok: Music2,
};

export function Footer() {
  const { lang, L, t } = useI18n();
  const { settings } = useSettings();
  const { data: navItems } = useNavigation();
  const { data: pages } = usePages();
  const contact = settings.contact;

  return (
    <footer className="border-t border-[#1A1A1D] bg-[#08080A] mt-24">
      <div className="container-x py-16 md:py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          {settings.logoFooter || settings.logo ? (
            <img src={settings.logoFooter || settings.logo} alt={L(settings.siteName)} className="h-8 w-auto object-contain mb-6" />
          ) : (
            <p className="font-display text-xl mb-6">{L(settings.siteName) || settings.companyName}</p>
          )}
          <p className="text-[#8C8C93] leading-relaxed max-w-sm">{L(settings.footerDescription)}</p>
          <WhatsAppLink className="btn btn-ghost mt-8 inline-flex" />
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow mb-5">{t('menu')}</p>
          <ul className="space-y-3">
            {(navItems as NavItem[]).filter((n) => !n.parentId).map((n) => (
              <li key={n.id}>
                <Link to={href(lang, n.url)} className="text-sm text-[#C9C9CE] hover:text-[var(--accent)] transition-colors">
                  {L(n.label)}
                </Link>
              </li>
            ))}
            {(pages as Page[]).filter((p) => p.inNavigation).map((p) => (
              <li key={p.id}>
                <Link to={href(lang, `/p/${p.slug}`)} className="text-sm text-[#C9C9CE] hover:text-[var(--accent)] transition-colors">
                  {L(p.title)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="eyebrow mb-5">{t('nav_contact')}</p>
          <ul className="space-y-4 text-sm text-[#C9C9CE]">
            {contact.phones?.filter(Boolean).map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-[#6A6A72] shrink-0" />
                <a href={`tel:${p.replace(/\s/g, '')}`} className="hover:text-[var(--accent)] transition-colors">{p}</a>
              </li>
            ))}
            {contact.email && (
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-[#6A6A72] shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-[var(--accent)] transition-colors">{contact.email}</a>
              </li>
            )}
            {L(contact.addresses) && (
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[#6A6A72] shrink-0" />
                <span>{L(contact.addresses)}</span>
              </li>
            )}
            {L(contact.workingHours) && (
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-[#6A6A72] shrink-0" />
                <span>{L(contact.workingHours)}</span>
              </li>
            )}
          </ul>

          <div className="flex items-center gap-3 mt-8">
            {settings.socials?.filter((s) => s.active && s.url).map((s) => {
              const Icon = ICONS[s.network.toLowerCase()] ?? Music2;
              return (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.network}
                   className="w-10 h-10 grid place-items-center border border-[#26262B] text-[#9A9AA0] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1A1A1D]">
        <div className="container-x py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#6A6A72]">{L(settings.copyright)}</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-xs text-[#6A6A72] hover:text-[#F2EFE9] flex items-center gap-2 transition-colors">
            {t('backToTop')} <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
