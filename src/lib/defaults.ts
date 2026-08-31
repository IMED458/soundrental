import type { HeroSettings, HomepageSection, SiteSettings } from './types';

/**
 * Placeholder content only — no invented business data. Every value here is
 * overwritten the moment an administrator saves the corresponding admin form.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: { ka: 'კომპანიის სახელი', en: 'Company Name', ru: 'Название компании' },
  companyName: 'Company Name',
  accentColor: '#C8963E',
  defaultLang: 'ka',
  seoTitle: {
    ka: 'პროფესიონალური ხმისა და DJ აპარატურის გაქირავება',
    en: 'Professional Sound & DJ Equipment Rental',
    ru: 'Аренда профессионального звука и DJ-оборудования',
  },
  seoDescription: {
    ka: 'ხმის სისტემები, DJ აპარატურა, განათება და სრული ტექნიკური უზრუნველყოფა ღონისძიებებისთვის.',
    en: 'Sound systems, DJ equipment, lighting and full technical support for events.',
    ru: 'Звуковые системы, DJ-оборудование, свет и полное техническое обеспечение мероприятий.',
  },
  copyright: {
    ka: '© Company Name. ყველა უფლება დაცულია.',
    en: '© Company Name. All rights reserved.',
    ru: '© Company Name. Все права защищены.',
  },
  footerDescription: {
    ka: 'პროფესიონალური ხმის, DJ და ღონისძიების აპარატურის გაქირავება.',
    en: 'Professional sound, DJ and event equipment rental.',
    ru: 'Аренда профессионального звукового, DJ и event-оборудования.',
  },
  contact: {
    phones: ['+000 000 000 000'],
    email: 'info@example.com',
    addresses: { ka: 'მისამართი', en: 'Address', ru: 'Адрес' },
    workingHours: {
      ka: 'ორშ – შაბ, 10:00 – 19:00',
      en: 'Mon – Sat, 10:00 – 19:00',
      ru: 'Пн – Сб, 10:00 – 19:00',
    },
    mapEmbed: '',
    mapLink: '',
  },
  whatsapp: {
    enabled: true,
    number: '',
    floating: true,
    inHeader: true,
    defaultMessage: {
      ka: 'გამარჯობა, მაინტერესებს თქვენი აპარატურის გაქირავება.',
      en: "Hello, I'm interested in renting your equipment.",
      ru: 'Здравствуйте, меня интересует аренда вашего оборудования.',
    },
    itemMessage: {
      ka: 'გამარჯობა, მაინტერესებს გაქირავება: {item}',
      en: "Hello, I'm interested in renting: {item}",
      ru: 'Здравствуйте, меня интересует аренда: {item}',
    },
  },
  socials: [
    { id: 'instagram', network: 'Instagram', url: '', active: true },
    { id: 'facebook', network: 'Facebook', url: '', active: true },
    { id: 'tiktok', network: 'TikTok', url: '', active: false },
    { id: 'youtube', network: 'YouTube', url: '', active: false },
  ],
};

export const DEFAULT_HERO: HeroSettings = {
  enabled: true,
  enabledOnMobile: true,
  modelUrl: '',
  modelUrlMobile: '',
  fallbackImage: '',
  initialScale: 1,
  initialRotationY: -0.35,
  cameraDistance: 6.2,
  intensity: 1,
  explodeDistance: 1,
  sectionHeight: 450,
  showLabels: true,
  background: '#0A0A0B',
  accentLight: true,
  title: {
    ka: 'პროფესიონალური ხმა ნებისმიერი ღონისძიებისთვის',
    en: 'Professional Sound for Every Event',
    ru: 'Профессиональный звук для любого мероприятия',
  },
  subtitle: {
    ka: 'ხმის სისტემები, DJ აპარატურა, განათება და ტექნიკური გუნდი — მიწოდებით და მონტაჟით.',
    en: 'Sound systems, DJ gear, lighting and a technical crew — delivered and installed.',
    ru: 'Звуковые системы, DJ-оборудование, свет и техническая команда — с доставкой и монтажом.',
  },
  ctaLabel: { ka: 'აპარატურის ნახვა', en: 'View Equipment', ru: 'Смотреть оборудование' },
  ctaUrl: '/equipment',
  ctaSecondaryLabel: { ka: 'შეთავაზების მიღება', en: 'Get a Quote', ru: 'Запросить расчёт' },
  ctaSecondaryUrl: '/quote',
  storyTitle: {
    ka: 'ხმისა და DJ აპარატურის პროფესიონალური გაქირავება',
    en: 'Professional Sound & DJ Equipment Rental',
    ru: 'Профессиональная аренда звука и DJ-оборудования',
  },
  storyItems: [
    { id: 's1', title: { ka: 'მიწოდება', en: 'Delivery', ru: 'Доставка' } },
    { id: 's2', title: { ka: 'მონტაჟი', en: 'Installation', ru: 'Монтаж' } },
    { id: 's3', title: { ka: 'ტექნიკური მხარდაჭერა', en: 'Technical Support', ru: 'Техподдержка' } },
    { id: 's4', title: { ka: 'დინამიკები', en: 'Speakers', ru: 'Акустика' } },
    { id: 's5', title: { ka: 'DJ აპარატურა', en: 'DJ Equipment', ru: 'DJ-оборудование' } },
    { id: 's6', title: { ka: 'ღონისძიების პაკეტები', en: 'Event Packages', ru: 'Event-пакеты' } },
  ],
  finalTitle: {
    ka: 'ააწყვეთ თქვენი ღონისძიების სისტემა',
    en: 'Build Your Event Setup',
    ru: 'Соберите систему для вашего мероприятия',
  },
  labels: [
    {
      id: 'l1', visible: true, order: 0,
      title: { ka: 'მაღალი სიმძლავრის ვუფერი', en: 'High Output Woofer', ru: 'Мощный вуфер' },
      text: { ka: 'ღრმა, კონტროლირებადი დაბალი სიხშირეები.', en: 'Deep, controlled low frequencies.', ru: 'Глубокие, контролируемые низкие частоты.' },
    },
    {
      id: 'l2', visible: true, order: 1,
      title: { ka: 'ზუსტი HF დრაივერი', en: 'Precision HF Driver', ru: 'Точный ВЧ-драйвер' },
      text: { ka: 'გამჭვირვალე მაღალი სიხშირეები დარბაზის ბოლომდე.', en: 'Transparent highs across the room.', ru: 'Прозрачные высокие по всему залу.' },
    },
    {
      id: 'l3', visible: true, order: 2,
      title: { ka: 'გამაგრებული კორპუსი', en: 'Reinforced Cabinet', ru: 'Усиленный корпус' },
      text: { ka: 'ტურ-კლასის კონსტრუქცია.', en: 'Tour-grade construction.', ru: 'Конструкция гастрольного класса.' },
    },
    {
      id: 'l4', visible: true, order: 3,
      title: { ka: 'პროფესიონალური I/O', en: 'Professional I/O', ru: 'Профессиональный I/O' },
      text: { ka: 'XLR in/through, სუფთა კომუტაცია.', en: 'XLR in/through, clean patching.', ru: 'XLR in/through, чистая коммутация.' },
    },
  ],
};

/** Seeded once; afterwards the admin reorders, hides and edits them freely. */
export const DEFAULT_SECTIONS: Omit<HomepageSection, 'id'>[] = [
  { type: 'hero3d', visible: true, order: 0 },
  {
    type: 'intro', visible: true, order: 1,
    title: { ka: 'ტექნიკა, რომელსაც ენდობით', en: 'Equipment you can rely on', ru: 'Оборудование, которому доверяют' },
    content: {
      ka: 'ჩვენ ვაქირავებთ პროფესიონალურ ხმის, DJ და განათების აპარატურას და ვუზრუნველყოფთ სრულ ტექნიკურ მომსახურებას — დაგეგმვიდან ღონისძიების დასრულებამდე.',
      en: 'We rent professional sound, DJ and lighting equipment and provide full technical service — from planning to the end of the event.',
      ru: 'Мы сдаём в аренду профессиональное звуковое, DJ и световое оборудование и обеспечиваем полное техническое сопровождение — от планирования до завершения мероприятия.',
    },
  },
  { type: 'categories', visible: true, order: 2, title: { ka: 'კატეგორიები', en: 'Categories', ru: 'Категории' } },
  { type: 'featured', visible: true, order: 3, title: { ka: 'რჩეული აპარატურა', en: 'Featured Equipment', ru: 'Избранное оборудование' } },
  { type: 'services', visible: true, order: 4, title: { ka: 'სერვისები', en: 'Services', ru: 'Услуги' } },
  { type: 'packages', visible: true, order: 5, title: { ka: 'მზა პაკეტები', en: 'Complete Packages', ru: 'Готовые пакеты' } },
  {
    type: 'why', visible: true, order: 6,
    title: { ka: 'რატომ ჩვენ', en: 'Why choose us', ru: 'Почему мы' },
    items: [
      { id: 'w1', title: { ka: 'ტურ-კლასის აპარატურა', en: 'Tour-grade equipment', ru: 'Оборудование гастрольного класса' }, text: { ka: 'რეგულარულად სერვისირებული, ცნობილი ბრენდები.', en: 'Regularly serviced, industry-standard brands.', ru: 'Регулярное обслуживание, проверенные бренды.' } },
      { id: 'w2', title: { ka: 'ტექნიკოსი ადგილზე', en: 'On-site technician', ru: 'Техник на площадке' }, text: { ka: 'გუნდი, რომელიც ღონისძიების ბოლომდე რჩება.', en: 'A crew that stays until the last track.', ru: 'Команда остаётся до последнего трека.' } },
      { id: 'w3', title: { ka: 'მიწოდება და მონტაჟი', en: 'Delivery & setup', ru: 'Доставка и монтаж' }, text: { ka: 'დროული ლოგისტიკა და სუფთა კაბელაჟი.', en: 'Punctual logistics and clean cabling.', ru: 'Пунктуальная логистика и аккуратная коммутация.' } },
    ],
  },
  { type: 'projects', visible: true, order: 7, title: { ka: 'შერჩეული პროექტები', en: 'Selected Projects', ru: 'Избранные проекты' } },
  { type: 'imagebreak', visible: false, order: 8 },
  {
    type: 'process', visible: true, order: 9,
    title: { ka: 'როგორ ვმუშაობთ', en: 'How it works', ru: 'Как это работает' },
    items: [
      { id: 'p1', title: { ka: 'მოგვიყევით ღონისძიების შესახებ', en: 'Tell us about your event', ru: 'Расскажите о мероприятии' } },
      { id: 'p2', title: { ka: 'აირჩიეთ აპარატურა', en: 'Choose equipment', ru: 'Выберите оборудование' } },
      { id: 'p3', title: { ka: 'მიწოდება და მონტაჟი', en: 'Delivery & setup', ru: 'Доставка и монтаж' } },
      { id: 'p4', title: { ka: 'მხარდაჭერა ღონისძიებაზე', en: 'Event support', ru: 'Поддержка на мероприятии' } },
    ],
  },
  { type: 'stats', visible: false, order: 10, title: { ka: 'ციფრებში', en: 'In numbers', ru: 'В цифрах' }, items: [] },
  { type: 'testimonials', visible: false, order: 11, title: { ka: 'გამოხმაურებები', en: 'Testimonials', ru: 'Отзывы' } },
  { type: 'faq', visible: true, order: 12, title: { ka: 'ხშირად დასმული კითხვები', en: 'Frequently asked questions', ru: 'Частые вопросы' } },
  {
    type: 'cta', visible: true, order: 13,
    title: { ka: 'მზად ხართ დასაგეგმად?', en: 'Ready to plan your event?', ru: 'Готовы планировать?' },
    subtitle: { ka: 'მოგვწერეთ და მოგამზადებთ შეთავაზებას.', en: 'Send us the details and we will prepare a quote.', ru: 'Отправьте детали — подготовим предложение.' },
    ctaLabel: { ka: 'შეთავაზების მიღება', en: 'Get a Quote', ru: 'Запросить расчёт' },
    ctaUrl: '/quote',
  },
  { type: 'contact', visible: true, order: 14, title: { ka: 'კონტაქტი', en: 'Contact', ru: 'Контакты' } },
];
