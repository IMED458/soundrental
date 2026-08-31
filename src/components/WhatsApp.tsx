import { MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { cx } from '../lib/utils';

export function useWhatsAppUrl(itemName?: string): string | null {
  const { settings } = useSettings();
  const { lang } = useI18n();
  return buildWhatsAppUrl(settings, lang, itemName);
}

export function WhatsAppLink({
  itemName, className, children, label,
}: { itemName?: string; className?: string; children?: React.ReactNode; label?: string }) {
  const url = useWhatsAppUrl(itemName);
  const { t } = useI18n();
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} aria-label={label || t('whatsapp')}>
      {children ?? (<><MessageCircle className="w-4 h-4" />{t('whatsapp')}</>)}
    </a>
  );
}

export function WhatsAppFab() {
  const { settings } = useSettings();
  const url = useWhatsAppUrl();
  const { t } = useI18n();
  if (!url || !settings.whatsapp?.floating) return null;

  return (
    <div className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 flex items-center group">
      <span
        className={cx(
          'hidden md:flex items-center mr-3 px-3 py-2 text-xs whitespace-nowrap',
          'bg-[#101013] text-[#E6E3DD] border border-[#26262B] shadow-xl',
          'opacity-0 translate-x-2 pointer-events-none transition-all duration-300',
          'group-hover:opacity-100 group-hover:translate-x-0'
        )}
        aria-hidden="true"
      >
        {t('whatsappCta')}
      </span>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsappCta')}
        className={cx(
          'relative w-14 h-14 rounded-full grid place-items-center',
          'bg-[#25D366] text-[#07301A] shadow-2xl shadow-[#25D366]/25',
          'transition-transform duration-300 hover:scale-105 active:scale-95'
        )}
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping -z-10" aria-hidden="true" />
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true" focusable="false">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.947c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.94 11.94 0 005.71 1.454h.005c6.585 0 11.946-5.36 11.949-11.948 0-3.192-1.24-6.192-3.495-8.448" />
        </svg>
      </a>
    </div>
  );
}
