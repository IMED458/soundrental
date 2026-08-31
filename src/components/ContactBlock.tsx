import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { LeadForm } from './forms';
import { WhatsAppLink } from './WhatsApp';

export function ContactBlock({ withMap = false }: { withMap?: boolean }) {
  const { L, t } = useI18n();
  const { settings } = useSettings();
  const c = settings.contact;

  return (
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-5">
        <dl className="space-y-6">
          {c.phones?.filter(Boolean).map((p) => (
            <div key={p} className="flex gap-4">
              <Phone className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" />
              <div>
                <dt className="eyebrow">{t('phone')}</dt>
                <dd><a href={`tel:${p.replace(/\s/g, '')}`} className="hover:text-[var(--accent)] transition-colors">{p}</a></dd>
              </div>
            </div>
          ))}
          {c.email && (
            <div className="flex gap-4">
              <Mail className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" />
              <div>
                <dt className="eyebrow">{t('email')}</dt>
                <dd><a href={`mailto:${c.email}`} className="hover:text-[var(--accent)] transition-colors">{c.email}</a></dd>
              </div>
            </div>
          )}
          {L(c.addresses) && (
            <div className="flex gap-4">
              <MapPin className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" />
              <div>
                <dt className="eyebrow">{t('address')}</dt>
                <dd>{L(c.addresses)}</dd>
              </div>
            </div>
          )}
          {L(c.workingHours) && (
            <div className="flex gap-4">
              <Clock className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" />
              <div>
                <dt className="eyebrow">{t('workingHours')}</dt>
                <dd>{L(c.workingHours)}</dd>
              </div>
            </div>
          )}
        </dl>

        <WhatsAppLink className="btn btn-ghost mt-8 inline-flex" />

        {withMap && c.mapEmbed && (
          <div className="mt-10 border border-[#1E1E22] aspect-[4/3]">
            <iframe
              src={c.mapEmbed}
              title={L(c.addresses) || 'Map'}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              style={{ border: 0, filter: 'grayscale(1) invert(0.92) contrast(0.85)' }}
            />
          </div>
        )}
      </div>

      <div className="lg:col-span-7">
        <LeadForm variant="contact" />
      </div>
    </div>
  );
}
