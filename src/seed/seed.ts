/**
 * Demo/seed data loader.
 *
 *   1. Create the first admin in the Firebase console:
 *        Authentication -> Users -> Add user (email + password)
 *        Firestore -> collection `adminUsers` -> document id = that user's UID
 *        fields: email (string), role: "superadmin", active: true, createdAt: <number>
 *   2. Put those credentials in .env as SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   3. npm run seed
 *
 * Running it twice overwrites the seeded records (they use fixed ids) and leaves
 * anything you created yourself untouched.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, setDoc, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_HERO, DEFAULT_SECTIONS, DEFAULT_SETTINGS } from '../lib/defaults';
import type { Loc } from '../lib/types';

const env = (key: string): string => {
  const v = (import.meta as unknown as { env: Record<string, string> }).env?.[key] ?? process.env[key];
  if (!v) throw new Error(`Missing ${key} — copy .env.example to .env and fill it in.`);
  return v;
};

const app = initializeApp({
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  appId: env('VITE_FIREBASE_APP_ID'),
});
const db = getFirestore(app);
const auth = getAuth(app);

const L = (ka: string, en: string, ru: string): Loc => ({ ka, en, ru });

const categories = [
  { id: 'cat-speakers', slug: 'speakers', order: 0, name: L('დინამიკები', 'Speakers', 'Акустика'),
    description: L('აქტიური და პასიური PA სისტემები დარბაზისა და ღია სივრცისთვის.', 'Active and passive PA systems for indoor and open-air events.', 'Активные и пассивные PA-системы для залов и открытых площадок.') },
  { id: 'cat-subs', slug: 'subwoofers', order: 1, name: L('სუბვუფერები', 'Subwoofers', 'Сабвуферы'),
    description: L('დაბალი სიხშირეების გამაძლიერებელი სისტემები.', 'Low-frequency systems that carry the room.', 'Системы низких частот.') },
  { id: 'cat-dj', slug: 'dj-equipment', order: 2, name: L('DJ აპარატურა', 'DJ Equipment', 'DJ-оборудование'),
    description: L('CDJ, მიქშერები, კონტროლერები და DJ ბუთები.', 'CDJs, mixers, controllers and DJ booths.', 'CDJ, микшеры, контроллеры и DJ-стойки.') },
  { id: 'cat-mics', slug: 'microphones', order: 3, name: L('მიკროფონები', 'Microphones', 'Микрофоны'),
    description: L('სადენიანი და უსადენო მიკროფონები, სტენდები.', 'Wired and wireless microphones and stands.', 'Проводные и беспроводные микрофоны, стойки.') },
  { id: 'cat-light', slug: 'lighting', order: 4, name: L('განათება', 'Lighting', 'Свет'),
    description: L('Moving head, LED და სასცენო განათება.', 'Moving heads, LED and stage lighting.', 'Moving head, LED и сценический свет.') },
  { id: 'cat-stage', slug: 'stage', order: 5, name: L('სცენა და ტრასები', 'Stage & Truss', 'Сцена и фермы'),
    description: L('სასცენო კონსტრუქციები და ტრასის სისტემები.', 'Stage decks and truss systems.', 'Сценические конструкции и фермы.') },
];

const equipment = [
  {
    id: 'eq-pa-15', slug: 'active-pa-speaker-15', order: 0, categoryIds: ['cat-speakers'],
    name: L('აქტიური PA დინამიკი 15"', 'Active PA Speaker 15"', 'Активная PA-акустика 15"'),
    shortDescription: L('1000W აქტიური სისტემა საშუალო ზომის ღონისძიებისთვის.', '1000W active cabinet for mid-size events.', 'Активная система 1000 Вт для средних мероприятий.'),
    description: L('ტურ-კლასის აქტიური დინამიკი ჩაშენებული გამაძლიერებლითა და DSP-ით. გამოდგება 150–300 სტუმრისთვის.', 'Tour-grade active cabinet with built-in amplification and DSP. Comfortable for 150–300 guests.', 'Активная система гастрольного класса со встроенным усилителем и DSP. Комфортно для 150–300 гостей.'),
    brand: 'RCF', model: 'ART 915-A', showPrice: true, price: 90, priceFrom: false, pricePeriod: 'day',
    currency: 'GEL', featured: true, isNew: false, availability: 'available',
    specs: [
      { key: L('სიმძლავრე', 'Power', 'Мощность'), value: L('1000 W', '1000 W', '1000 Вт') },
      { key: L('SPL', 'SPL', 'SPL'), value: L('129 dB', '129 dB', '129 дБ') },
      { key: L('სიხშირე', 'Frequency', 'Частота'), value: L('45 Hz – 20 kHz', '45 Hz – 20 kHz', '45 Гц – 20 кГц') },
    ],
    accessories: L('სტენდი, XLR კაბელი, კვების კაბელი.', 'Speaker stand, XLR cable, power cable.', 'Стойка, XLR-кабель, кабель питания.'),
    minDuration: L('1 დღე', '1 day', '1 сутки'),
  },
  {
    id: 'eq-sub-18', slug: 'subwoofer-18', order: 1, categoryIds: ['cat-subs'],
    name: L('სუბვუფერი 18"', 'Subwoofer 18"', 'Сабвуфер 18"'),
    shortDescription: L('აქტიური სუბვუფერი ღრმა ბასისთვის.', 'Active subwoofer for deep low end.', 'Активный сабвуфер для глубокого низа.'),
    description: L('აქტიური 18-დუიმიანი სუბვუფერი, რომელიც სიმხნევეს მატებს ნებისმიერ PA სისტემას.', 'Active 18" subwoofer that gives any PA system its weight.', 'Активный 18" сабвуфер, добавляющий вес любой PA-системе.'),
    brand: 'RCF', model: 'SUB 8004-AS', showPrice: true, price: 120, pricePeriod: 'day', currency: 'GEL',
    featured: true, availability: 'available', specs: [], accessories: L('', '', ''),
  },
  {
    id: 'eq-cdj', slug: 'cdj-3000', order: 2, categoryIds: ['cat-dj'],
    name: L('CDJ პლეიერი', 'CDJ Player', 'CDJ-плеер'),
    shortDescription: L('პროფესიონალური DJ პლეიერი კლუბური სტანდარტი.', 'The club-standard professional DJ player.', 'Клубный стандарт профессионального DJ-плеера.'),
    description: L('ინდუსტრიის სტანდარტული პლეიერი დიდი ეკრანით და ზუსტი ჯოგ-ბორბლით.', 'Industry-standard player with a large display and precise jog wheel.', 'Индустриальный стандарт с большим дисплеем и точным джог-колесом.'),
    brand: 'Pioneer DJ', model: 'CDJ-3000', showPrice: false, pricePeriod: 'event', currency: 'GEL',
    featured: true, isNew: true, availability: 'limited', specs: [],
  },
  {
    id: 'eq-mixer', slug: 'dj-mixer-djm-a9', order: 3, categoryIds: ['cat-dj'],
    name: L('DJ მიქშერი', 'DJ Mixer', 'DJ-микшер'),
    shortDescription: L('4-არხიანი კლუბური მიქშერი ეფექტებით.', '4-channel club mixer with effects.', '4-канальный клубный микшер с эффектами.'),
    description: L('კლუბური მიქშერი მაღალი ხარისხის ხმით, ჩაშენებული ეფექტებითა და ორი დამოუკიდებელი გამოსასვლელით.', 'Club mixer with high-grade sound, onboard effects and two independent outputs.', 'Клубный микшер с качественным звуком, эффектами и двумя независимыми выходами.'),
    brand: 'Pioneer DJ', model: 'DJM-A9', showPrice: false, currency: 'GEL', featured: true, availability: 'available', specs: [],
  },
  {
    id: 'eq-wireless-mic', slug: 'wireless-microphone', order: 4, categoryIds: ['cat-mics'],
    name: L('უსადენო მიკროფონი', 'Wireless Microphone', 'Беспроводной микрофон'),
    shortDescription: L('ორარხიანი უსადენო სისტემა ტოსტმასტერისთვის.', 'Dual-channel wireless system for hosts and speeches.', 'Двухканальная радиосистема для ведущего и речей.'),
    description: L('სტაბილური UHF სისტემა, ორი ხელის მიკროფონით და ავტომატური სიხშირის შერჩევით.', 'Reliable UHF system with two handhelds and automatic frequency scanning.', 'Надёжная UHF-система с двумя ручными микрофонами и автосканированием частот.'),
    brand: 'Shure', model: 'BLX288', showPrice: true, price: 60, pricePeriod: 'event', currency: 'GEL',
    availability: 'available', specs: [],
  },
  {
    id: 'eq-moving-head', slug: 'moving-head-beam', order: 5, categoryIds: ['cat-light'],
    name: L('Moving Head სანათი', 'Moving Head Beam', 'Moving Head Beam'),
    shortDescription: L('დინამიური სასცენო სანათი პრიზმითა და გობოებით.', 'Dynamic stage fixture with prism and gobos.', 'Динамический прибор с призмой и гобо.'),
    description: L('ენერგიული სხივი, რომელიც ცოცხალ სივრცეს ქმნის ცეკვის ზონაში.', 'An energetic beam that shapes the dance floor.', 'Энергичный луч, формирующий пространство танцпола.'),
    brand: 'Chauvet', showPrice: true, price: 45, pricePeriod: 'day', currency: 'GEL',
    availability: 'available', specs: [],
  },
];

const services = [
  { id: 'srv-rental', slug: 'equipment-rental', order: 0, featured: true,
    title: L('აპარატურის გაქირავება', 'Equipment Rental', 'Аренда оборудования'),
    shortDescription: L('ხმა, შუქი და სცენა — ერთი შეთანხმებით.', 'Sound, light and stage — under one agreement.', 'Звук, свет и сцена — по одному договору.'),
    description: L('ჩვენ ვაწვდით სრულ ტექნიკურ კომპლექტს ღონისძიების მასშტაბის მიხედვით.', 'We supply a complete technical package sized to your event.', 'Мы предоставляем полный технический комплект под масштаб мероприятия.') },
  { id: 'srv-dj', slug: 'dj-service', order: 1, featured: true,
    title: L('DJ სერვისი', 'DJ Service', 'DJ-сервис'),
    shortDescription: L('გამოცდილი DJ თქვენი ღონისძიების ფორმატისთვის.', 'An experienced DJ matched to your format.', 'Опытный DJ под формат вашего мероприятия.'),
    description: L('ვირჩევთ DJ-ს ღონისძიების სტილისა და აუდიტორიის მიხედვით.', 'We match the DJ to the style and audience of the event.', 'Подбираем DJ под стиль и аудиторию мероприятия.') },
  { id: 'srv-install', slug: 'delivery-installation', order: 2,
    title: L('მიწოდება და მონტაჟი', 'Delivery & Installation', 'Доставка и монтаж'),
    shortDescription: L('ჩამოტანა, აწყობა, ტესტირება და დემონტაჟი.', 'Delivery, setup, sound check and strike.', 'Доставка, монтаж, проверка и демонтаж.'),
    description: L('ტექნიკური გუნდი ჩამოდის ადრე და აწყობს სისტემას სტუმრების მოსვლამდე.', 'Our crew arrives early and has the system ready before the guests do.', 'Команда приезжает заранее и готовит систему до прихода гостей.') },
  { id: 'srv-support', slug: 'technical-support', order: 3,
    title: L('ტექნიკური მხარდაჭერა', 'Technical Support', 'Техническая поддержка'),
    shortDescription: L('ტექნიკოსი ღონისძიების ბოლომდე რჩება.', 'A technician stays until the last track.', 'Техник остаётся до последнего трека.'),
    description: L('ხმის ინჟინერი აკონტროლებს სისტემას მთელი საღამოს განმავლობაში.', 'A sound engineer keeps the system under control all evening.', 'Звукорежиссёр контролирует систему весь вечер.') },
];

const packages = [
  { id: 'pkg-party', slug: 'small-party', order: 0, featured: true,
    name: L('პატარა წვეულება', 'Small Party', 'Небольшая вечеринка'),
    description: L('40–80 სტუმარი. ორი აქტიური დინამიკი, მიკროფონი და მარტივი განათება.', '40–80 guests. Two active speakers, a microphone and simple lighting.', '40–80 гостей. Две активные колонки, микрофон и простой свет.'),
    equipmentIds: ['eq-pa-15', 'eq-wireless-mic'], guests: '40–80', showPrice: true, price: 350, priceFrom: true, currency: 'GEL' },
  { id: 'pkg-wedding', slug: 'wedding', order: 1, featured: true,
    name: L('ქორწილის პაკეტი', 'Wedding Package', 'Свадебный пакет'),
    description: L('150–300 სტუმარი. სრული PA სისტემა სუბვუფერებით, DJ აპარატურა, უსადენო მიკროფონები და განათება.', '150–300 guests. Full PA with subwoofers, DJ equipment, wireless microphones and lighting.', '150–300 гостей. Полная PA-система с сабвуферами, DJ-оборудование, радиомикрофоны и свет.'),
    equipmentIds: ['eq-pa-15', 'eq-sub-18', 'eq-cdj', 'eq-mixer', 'eq-wireless-mic', 'eq-moving-head'],
    guests: '150–300', showPrice: true, price: 1200, priceFrom: true, currency: 'GEL' },
  { id: 'pkg-club', slug: 'club-setup', order: 2,
    name: L('კლუბური სეტაპი', 'Club Setup', 'Клубный сетап'),
    description: L('DJ ბუთი კლუბური სტანდარტის პლეიერებითა და მიქშერით.', 'A DJ booth with club-standard players and mixer.', 'DJ-стойка с плеерами и микшером клубного стандарта.'),
    equipmentIds: ['eq-cdj', 'eq-mixer', 'eq-sub-18'], showPrice: false, currency: 'GEL' },
];

const projects = [
  { id: 'prj-open-air', slug: 'open-air-summer', order: 0, featured: true, date: '2025-07-19',
    title: L('ღია ცის ქვეშ ზაფხულის ღონისძიება', 'Open-Air Summer Event', 'Летнее мероприятие под открытым небом'),
    location: L('კახეთი', 'Kakheti', 'Кахетия'),
    description: L('600 სტუმარი, ორი სცენა, სრული ხმისა და განათების უზრუნველყოფა.', '600 guests, two stages, full sound and lighting supply.', '600 гостей, две сцены, полное звуковое и световое обеспечение.'),
    equipmentIds: ['eq-pa-15', 'eq-sub-18', 'eq-moving-head'], serviceIds: ['srv-rental', 'srv-support'] },
  { id: 'prj-corporate', slug: 'corporate-conference', order: 1, date: '2025-11-08',
    title: L('კორპორატიული კონფერენცია', 'Corporate Conference', 'Корпоративная конференция'),
    location: L('თბილისი', 'Tbilisi', 'Тбилиси'),
    description: L('კონფერენციის ხმა, პრეზენტაციის აუდიო და უსადენო მიკროფონები.', 'Conference sound, presentation audio and wireless microphones.', 'Звук конференции, аудио презентаций и радиомикрофоны.'),
    equipmentIds: ['eq-pa-15', 'eq-wireless-mic'], serviceIds: ['srv-rental', 'srv-install'] },
];

const faqs = [
  { id: 'faq-1', order: 0,
    question: L('რამდენად ადრე უნდა დავჯავშნო?', 'How early should I book?', 'За сколько нужно бронировать?'),
    answer: L('სეზონზე რეკომენდებულია 3–4 კვირით ადრე, თუმცა ხშირად შეგვიძლია მოკლე ვადაშიც.', 'In season we recommend 3–4 weeks ahead, though short notice is often possible.', 'В сезон рекомендуем за 3–4 недели, но часто возможно и в короткий срок.') },
  { id: 'faq-2', order: 1,
    question: L('შედის თუ არა მიწოდება ფასში?', 'Is delivery included?', 'Входит ли доставка в стоимость?'),
    answer: L('მიწოდება და მონტაჟი ითვლება ცალკე, ლოკაციის მიხედვით.', 'Delivery and setup are quoted separately, based on the location.', 'Доставка и монтаж рассчитываются отдельно, в зависимости от локации.') },
  { id: 'faq-3', order: 2,
    question: L('რჩება თუ არა ტექნიკოსი ღონისძიებაზე?', 'Does a technician stay at the event?', 'Остаётся ли техник на мероприятии?'),
    answer: L('დიახ, ტექნიკური მხარდაჭერის სერვისით ინჟინერი ბოლომდე რჩება.', 'Yes — with the technical support service an engineer stays until the end.', 'Да — с услугой техподдержки инженер остаётся до конца.') },
];

const pages = [
  { id: 'page-about', slug: 'about', order: 0, inNavigation: false,
    title: L('ჩვენ შესახებ', 'About', 'О нас'),
    content: L(
      '<p>ჩვენ ვაქირავებთ პროფესიონალურ ხმის, DJ და განათების აპარატურას და ვუზრუნველყოფთ სრულ ტექნიკურ მომსახურებას.</p><h2>გამოცდილება</h2><p>წლების განმავლობაში ვმუშაობთ ქორწილებზე, კორპორატიულ ღონისძიებებზე, ფესტივალებსა და კლუბებში.</p>',
      '<p>We rent professional sound, DJ and lighting equipment and provide full technical service.</p><h2>Experience</h2><p>We have worked weddings, corporate events, festivals and clubs for years.</p>',
      '<p>Мы сдаём в аренду профессиональное звуковое, DJ и световое оборудование и обеспечиваем полное техническое сопровождение.</p><h2>Опыт</h2><p>Мы годами работаем на свадьбах, корпоративах, фестивалях и в клубах.</p>'
    ) },
  { id: 'page-terms', slug: 'rental-conditions', order: 1, inNavigation: true,
    title: L('გაქირავების პირობები', 'Rental Conditions', 'Условия аренды'),
    content: L('<p>გაქირავების პირობები განისაზღვრება ხელშეკრულებით.</p>', '<p>Rental conditions are set out in the agreement.</p>', '<p>Условия аренды определяются договором.</p>') },
];

const navigation = [
  { id: 'nav-equipment', order: 0, url: '/equipment', label: L('აპარატურა', 'Equipment', 'Оборудование') },
  { id: 'nav-packages', order: 1, url: '/packages', label: L('პაკეტები', 'Packages', 'Пакеты') },
  { id: 'nav-services', order: 2, url: '/services', label: L('სერვისები', 'Services', 'Услуги') },
  { id: 'nav-projects', order: 3, url: '/projects', label: L('პროექტები', 'Projects', 'Проекты') },
  { id: 'nav-about', order: 4, url: '/about', label: L('ჩვენ შესახებ', 'About', 'О нас') },
  { id: 'nav-contact', order: 5, url: '/contact', label: L('კონტაქტი', 'Contact', 'Контакты') },
];

async function put(collection: string, id: string, data: Record<string, unknown>) {
  await setDoc(doc(db, collection, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  console.log(`  ✓ ${collection}/${id}`);
}

async function main() {
  const email = env('SEED_ADMIN_EMAIL');
  const password = env('SEED_ADMIN_PASSWORD');
  console.log(`Signing in as ${email}…`);
  await signInWithEmailAndPassword(auth, email, password);

  console.log('Settings…');
  await put('settings', 'site', DEFAULT_SETTINGS as unknown as Record<string, unknown>);
  await put('settings', 'hero3d', DEFAULT_HERO as unknown as Record<string, unknown>);

  console.log('Homepage sections…');
  for (const [i, section] of DEFAULT_SECTIONS.entries()) {
    await put('homepageSections', `section-${String(i).padStart(2, '0')}`, { ...section, order: i });
  }

  const base = { active: true, deleted: false };
  console.log('Catalog…');
  for (const c of categories) await put('categories', c.id, { ...base, ...c });
  for (const e of equipment) await put('equipment', e.id, { ...base, gallery: [], relatedIds: [], ...e });
  for (const s of services) await put('services', s.id, { ...base, gallery: [], showPrice: false, currency: 'GEL', ...s });
  for (const p of packages) await put('packages', p.id, { ...base, gallery: [], ...p });
  for (const p of projects) await put('projects', p.id, { ...base, gallery: [], ...p });
  for (const f of faqs) await put('faqs', f.id, { ...base, ...f });
  for (const p of pages) await put('pages', p.id, { ...base, ...p });
  for (const n of navigation) await put('navigation', n.id, { ...base, newTab: false, parentId: '', ...n });

  console.log('\nSeed complete. Open /admin to edit everything.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
