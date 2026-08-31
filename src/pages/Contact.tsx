import { useI18n } from '../lib/i18n';
import { useEquipment, usePackages } from '../lib/content';
import { Seo } from '../lib/seo';
import type { Equipment, RentalPackage } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { ContactBlock } from '../components/ContactBlock';
import { LeadForm } from '../components/forms';

export function ContactPage() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={{ ka: 'კონტაქტი', en: 'Contact', ru: 'Контакты' }} />
      <PageHeader eyebrow={t('nav_contact')} title={t('nav_contact')} />
      <section className="container-x pb-28">
        <ContactBlock withMap />
      </section>
    </>
  );
}

export function QuotePage() {
  const { t, lang } = useI18n();
  const { data: equipment } = useEquipment();
  const { data: packages } = usePackages();
  return (
    <>
      <Seo title={{ ka: 'შეთავაზების მოთხოვნა', en: 'Request a Quote', ru: 'Запрос расчёта' }} />
      <PageHeader
        eyebrow={t('getQuote')}
        title={t('getQuote')}
        subtitle={{
          ka: 'აღწერეთ ღონისძიება და მოგამზადებთ ინდივიდუალურ შეთავაზებას.',
          en: 'Describe your event and we will prepare a tailored quote.',
          ru: 'Опишите мероприятие — подготовим индивидуальное предложение.',
        }[lang]}
      />
      <section className="container-x pb-28 max-w-3xl">
        <LeadForm variant="quote" equipment={equipment as Equipment[]} packages={packages as RentalPackage[]} />
      </section>
    </>
  );
}
