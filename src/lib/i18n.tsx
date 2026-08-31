import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, DEFAULT_LANG, type Lang, type Loc } from './types';

/**
 * Structural micro-copy (buttons, form labels, states) ships with the code in all
 * three languages. Everything the visitor reads as *content* comes from Firestore.
 */
export const UI = {
  ka: {
    nav_equipment: 'აპარატურა', nav_packages: 'პაკეტები', nav_services: 'სერვისები',
    nav_projects: 'პროექტები', nav_about: 'ჩვენ შესახებ', nav_contact: 'კონტაქტი',
    getQuote: 'შეთავაზების მიღება', viewAll: 'ყველას ნახვა', viewDetails: 'დეტალურად',
    contactForPrice: 'ფასი შეთანხმებით', from: '-დან', perDay: 'დღეში', perEvent: 'ღონისძიებაზე',
    perHour: 'საათში', whatsapp: 'WhatsApp', search: 'ძებნა', filters: 'ფილტრები',
    allCategories: 'ყველა კატეგორია', allBrands: 'ყველა ბრენდი', clearFilters: 'გასუფთავება',
    noResults: 'შედეგი ვერ მოიძებნა', empty: 'აქ ჯერჯერობით არაფერია',
    loading: 'იტვირთება', specifications: 'ტექნიკური მახასიათებლები', included: 'შედის კომპლექტში',
    deposit: 'დეპოზიტი', minDuration: 'მინიმალური ვადა', related: 'მსგავსი აპარატურა',
    gallery: 'გალერეა', category: 'კატეგორია', brand: 'ბრენდი', model: 'მოდელი',
    available: 'ხელმისაწვდომია', limited: 'შეზღუდული რაოდენობა', unavailable: 'დროებით არ არის',
    featured: 'რჩეული', new: 'ახალი', name: 'სახელი', phone: 'ტელეფონი', email: 'ელ. ფოსტა',
    eventDate: 'ღონისძიების თარიღი', eventType: 'ღონისძიების ტიპი', location: 'ლოკაცია',
    guests: 'სტუმრების რაოდენობა', message: 'შეტყობინება', send: 'გაგზავნა',
    sending: 'იგზავნება…', sent: 'მადლობა! თქვენი მოთხოვნა მიღებულია.',
    errorSend: 'გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.', required: 'სავალდებულო ველი',
    invalidEmail: 'არასწორი ელ. ფოსტა', invalidPhone: 'არასწორი ტელეფონის ნომერი',
    selectEquipment: 'აირჩიეთ აპარატურა', selectedItems: 'არჩეული',
    workingHours: 'სამუშაო საათები', address: 'მისამართი', followUs: 'გამოგვყევით',
    scroll: 'გადაახვიეთ', backToTop: 'ზემოთ', close: 'დახურვა', prev: 'წინა', next: 'შემდეგი',
    page404: 'გვერდი ვერ მოიძებნა', backHome: 'მთავარ გვერდზე', packageIncludes: 'პაკეტში შედის',
    faq: 'ხშირად დასმული კითხვები', menu: 'მენიუ', language: 'ენა',
    whatsappCta: 'მოგვწერეთ WhatsApp-ში',
  },
  en: {
    nav_equipment: 'Equipment', nav_packages: 'Packages', nav_services: 'Services',
    nav_projects: 'Projects', nav_about: 'About', nav_contact: 'Contact',
    getQuote: 'Get a Quote', viewAll: 'View all', viewDetails: 'View details',
    contactForPrice: 'Contact for price', from: 'from', perDay: 'per day', perEvent: 'per event',
    perHour: 'per hour', whatsapp: 'WhatsApp', search: 'Search', filters: 'Filters',
    allCategories: 'All categories', allBrands: 'All brands', clearFilters: 'Clear',
    noResults: 'Nothing matched your search', empty: 'Nothing here yet',
    loading: 'Loading', specifications: 'Specifications', included: 'Included',
    deposit: 'Deposit', minDuration: 'Minimum rental', related: 'Related equipment',
    gallery: 'Gallery', category: 'Category', brand: 'Brand', model: 'Model',
    available: 'Available', limited: 'Limited availability', unavailable: 'Currently unavailable',
    featured: 'Featured', new: 'New', name: 'Name', phone: 'Phone', email: 'Email',
    eventDate: 'Event date', eventType: 'Event type', location: 'Location',
    guests: 'Expected guests', message: 'Message', send: 'Send',
    sending: 'Sending…', sent: 'Thank you. We have received your request.',
    errorSend: 'Could not send. Please try again.', required: 'This field is required',
    invalidEmail: 'Invalid email address', invalidPhone: 'Invalid phone number',
    selectEquipment: 'Select equipment', selectedItems: 'Selected',
    workingHours: 'Working hours', address: 'Address', followUs: 'Follow us',
    scroll: 'Scroll', backToTop: 'Back to top', close: 'Close', prev: 'Previous', next: 'Next',
    page404: 'Page not found', backHome: 'Back to homepage', packageIncludes: 'This package includes',
    faq: 'Frequently asked questions', menu: 'Menu', language: 'Language',
    whatsappCta: 'Chat on WhatsApp',
  },
  ru: {
    nav_equipment: 'Оборудование', nav_packages: 'Пакеты', nav_services: 'Услуги',
    nav_projects: 'Проекты', nav_about: 'О нас', nav_contact: 'Контакты',
    getQuote: 'Запросить расчёт', viewAll: 'Смотреть все', viewDetails: 'Подробнее',
    contactForPrice: 'Цена по запросу', from: 'от', perDay: 'в сутки', perEvent: 'за мероприятие',
    perHour: 'в час', whatsapp: 'WhatsApp', search: 'Поиск', filters: 'Фильтры',
    allCategories: 'Все категории', allBrands: 'Все бренды', clearFilters: 'Сбросить',
    noResults: 'Ничего не найдено', empty: 'Здесь пока пусто',
    loading: 'Загрузка', specifications: 'Характеристики', included: 'В комплекте',
    deposit: 'Депозит', minDuration: 'Минимальный срок', related: 'Похожее оборудование',
    gallery: 'Галерея', category: 'Категория', brand: 'Бренд', model: 'Модель',
    available: 'В наличии', limited: 'Ограниченное количество', unavailable: 'Временно недоступно',
    featured: 'Избранное', new: 'Новинка', name: 'Имя', phone: 'Телефон', email: 'Эл. почта',
    eventDate: 'Дата мероприятия', eventType: 'Тип мероприятия', location: 'Локация',
    guests: 'Количество гостей', message: 'Сообщение', send: 'Отправить',
    sending: 'Отправка…', sent: 'Спасибо! Ваш запрос получен.',
    errorSend: 'Не удалось отправить. Попробуйте ещё раз.', required: 'Обязательное поле',
    invalidEmail: 'Некорректный адрес', invalidPhone: 'Некорректный номер',
    selectEquipment: 'Выберите оборудование', selectedItems: 'Выбрано',
    workingHours: 'Часы работы', address: 'Адрес', followUs: 'Мы в соцсетях',
    scroll: 'Прокрутите', backToTop: 'Наверх', close: 'Закрыть', prev: 'Назад', next: 'Далее',
    page404: 'Страница не найдена', backHome: 'На главную', packageIncludes: 'В пакет входит',
    faq: 'Частые вопросы', menu: 'Меню', language: 'Язык',
    whatsappCta: 'Написать в WhatsApp',
  },
} as const;

export type UIKey = keyof (typeof UI)['en'];

export const LANG_LABEL: Record<Lang, string> = { ka: 'KA', en: 'EN', ru: 'RU' };

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as string[]).includes(v);
}

/**
 * Resolve a localized field. Requested language first, then the configured default,
 * then any language that actually has content — a half-translated record still renders.
 */
export function loc(value: Loc | string | undefined | null, lang: Lang, fallback: Lang = DEFAULT_LANG): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const direct = value[lang];
  if (direct && direct.trim()) return direct;
  const def = value[fallback];
  if (def && def.trim()) return def;
  for (const l of LANGS) {
    const v = value[l];
    if (v && v.trim()) return v;
  }
  return '';
}

/** Which languages of a record are filled in — powers the KA ✓ / RU ⚠ admin badges. */
export function translationStatus(fields: Array<Loc | undefined>): Record<Lang, boolean> {
  const out = { ka: true, en: true, ru: true } as Record<Lang, boolean>;
  for (const l of LANGS) {
    out[l] = fields.every((f) => !f || Boolean(f[l] && f[l]!.trim()));
  }
  return out;
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: UIKey) => string;
  L: (value: Loc | string | undefined | null) => string;
  defaultLang: Lang;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = 'sr_lang';

export function readStoredLang(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

export function I18nProvider({
  lang, onLangChange, defaultLang = DEFAULT_LANG, children,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  defaultLang?: Lang;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<Lang>(lang);

  useEffect(() => setCurrent(lang), [lang]);
  useEffect(() => {
    document.documentElement.lang = current;
    try { localStorage.setItem(STORAGE_KEY, current); } catch { /* private mode */ }
  }, [current]);

  const value = useMemo<I18nValue>(() => ({
    lang: current,
    defaultLang,
    setLang: (l: Lang) => { setCurrent(l); onLangChange(l); },
    t: (key: UIKey) => UI[current][key] ?? UI.en[key] ?? String(key),
    L: (v) => loc(v, current, defaultLang),
  }), [current, defaultLang, onLangChange]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
