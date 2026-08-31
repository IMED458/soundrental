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
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp')}
      className={cx(
        'fixed z-50 bottom-5 right-5 md:bottom-8 md:right-8',
        'w-13 h-13 md:w-14 md:h-14 grid place-items-center',
        'bg-[#141417] border border-[#2C2C31] text-[#F2EFE9]',
        'hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-300'
      )}
      style={{ width: 54, height: 54 }}
    >
      <MessageCircle className="w-5 h-5" />
    </a>
  );
}
