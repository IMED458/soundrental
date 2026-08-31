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

/** Demo photography that ships in public/demo. Replace it from the Media library. */
const BASE = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BASE
  ?? process.env.VITE_BASE ?? '/soundrental/';
const img = (file: string) => `${BASE.replace(/\/$/, '')}/demo/${file}`;

const categories = [
  { id: 'cat-speakers', slug: 'speakers', order: 0, name: L('დინამიკები', 'Speakers', 'Акустика'),
    description: L('აქტიური და პასიური PA სისტემები დარბაზისა და ღია სივრცისთვის.', 'Active and passive PA systems for indoor and open-air events.', 'Активные и пассивные PA-системы для залов и открытых площадок.') },
  { id: 'cat-subs', slug: 'subwoofers', order: 1, name: L('სუბვუფერები', 'Subwoofers', 'Сабвуферы'),
    description: L('დაბალი სიხშირეების გამაძლიერებელი სისტემები.', 'Low-frequency systems that carry the room.', 'Системы низких частот.') },
  { id: 'cat-dj', slug: 'dj-equipment', order: 2, image: img('cdj-setup.jpg'), name: L('DJ აპარატურა', 'DJ Equipment', 'DJ-оборудование'),
    description: L('CDJ, მიქშერები, კონტროლერები და DJ ბუთები.', 'CDJs, mixers, controllers and DJ booths.', 'CDJ, микшеры, контроллеры и DJ-стойки.') },
  { id: 'cat-mics', slug: 'microphones', order: 3, name: L('მიკროფონები', 'Microphones', 'Микрофоны'),
    description: L('სადენიანი და უსადენო მიკროფონები, სტენდები.', 'Wired and wireless microphones and stands.', 'Проводные и беспроводные микрофоны, стойки.') },
  { id: 'cat-light', slug: 'lighting', order: 4, name: L('განათება', 'Lighting', 'Свет'),
    description: L('Moving head, LED და სასცენო განათება.', 'Moving heads, LED and stage lighting.', 'Moving head, LED и сценический свет.') },
  { id: 'cat-stage', slug: 'stage', order: 5, image: img('dj-booth-2.jpg'), name: L('სცენა და ტრასები', 'Stage & Truss', 'Сцена и фермы'),
    description: L('სასცენო კონსტრუქციები და ტრასის სისტემები.', 'Stage decks and truss systems.', 'Сценические конструкции и фермы.') },
];

const equipment = [
  {
    id: 'eq-pa-15', slug: 'active-pa-speaker-15', order: 0, categoryIds: ['cat-speakers'],
    name: L('აქტიური PA დინამიკი 15"', 'Active PA Speaker 15"', 'Активная PA-акустика 15"'),
    shortDescription: L('1000W აქტიური სისტემა საშუალო ზომის ღონისძიებისთვის.', '1000W active cabinet for mid-size events.', 'Активная система 1000 Вт для средних мероприятий.'),
    description: L('ტურ-კლასის აქტიური დინამიკი ჩაშენებული გამაძლიერებლითა და DSP-ით. კომფორტულად ფარავს 150–300 სტუმარს.', 'Tour-grade active cabinet with built-in amplification and DSP. Comfortable for 150–300 guests.', 'Активная система гастрольного класса со встроенным усилителем и DSP. Комфортно для 150–300 гостей.'),
    brand: 'RCF', model: 'ART 915-A', showPrice: true, price: 90, priceFrom: false, pricePeriod: 'day',
    currency: 'GEL', featured: true, isNew: false, availability: 'available',
    specs: [
      { key: L('სიმძლავრე', 'Power', 'Мощность'), value: L('1000 W', '1000 W', '1000 Вт') },
      { key: L('მაქს. SPL', 'Max SPL', 'Макс. SPL'), value: L('129 dB', '129 dB', '129 дБ') },
      { key: L('სიხშირული დიაპაზონი', 'Frequency range', 'Диапазон частот'), value: L('45 Hz – 20 kHz', '45 Hz – 20 kHz', '45 Гц – 20 кГц') },
      { key: L('წონა', 'Weight', 'Вес'), value: L('19 კგ', '19 kg', '19 кг') },
    ],
    accessories: L('სპიკერ-სტენდი, XLR კაბელი, კვების კაბელი.', 'Speaker stand, XLR cable, power cable.', 'Стойка, XLR-кабель, кабель питания.'),
    minDuration: L('1 დღე', '1 day', '1 сутки'),
    relatedIds: ['eq-sub-18', 'eq-pa-12'],
  },
  {
    id: 'eq-pa-12', slug: 'active-pa-speaker-12', order: 1, categoryIds: ['cat-speakers'],
    name: L('აქტიური PA დინამიკი 12"', 'Active PA Speaker 12"', 'Активная PA-акустика 12"'),
    shortDescription: L('კომპაქტური სისტემა პატარა დარბაზისთვის და მონიტორინგისთვის.', 'Compact cabinet for small rooms and stage monitoring.', 'Компактная система для небольших залов и мониторинга.'),
    description: L('მსუბუქი და მრავალფუნქციური — გამოდგება როგორც ძირითადი, ისე სასცენო მონიტორის როლში.', 'Light and versatile — works as a main speaker or a stage monitor.', 'Лёгкая и универсальная — работает как основная система или сценический монитор.'),
    brand: 'RCF', model: 'ART 912-A', showPrice: true, price: 70, pricePeriod: 'day',
    currency: 'GEL', availability: 'available',
    specs: [
      { key: L('სიმძლავრე', 'Power', 'Мощность'), value: L('700 W', '700 W', '700 Вт') },
      { key: L('წონა', 'Weight', 'Вес'), value: L('15 კგ', '15 kg', '15 кг') },
    ],
    relatedIds: ['eq-pa-15'],
  },
  {
    id: 'eq-sub-18', slug: 'subwoofer-18', order: 2, categoryIds: ['cat-subs'],
    name: L('სუბვუფერი 18"', 'Subwoofer 18"', 'Сабвуфер 18"'),
    shortDescription: L('აქტიური სუბვუფერი ღრმა და კონტროლირებადი ბასისთვის.', 'Active subwoofer for deep, controlled low end.', 'Активный сабвуфер для глубокого контролируемого низа.'),
    description: L('აქტიური 18-დუიმიანი სუბვუფერი, რომელიც წონას მატებს ნებისმიერ PA სისტემას. ცეკვის ზონისთვის რეკომენდებულია წყვილი.', 'Active 18" subwoofer that gives any PA system its weight. A pair is recommended for a dance floor.', 'Активный 18" сабвуфер, добавляющий вес любой PA-системе. Для танцпола рекомендуем пару.'),
    brand: 'RCF', model: 'SUB 8004-AS', showPrice: true, price: 120, pricePeriod: 'day', currency: 'GEL',
    featured: true, availability: 'available',
    specs: [
      { key: L('სიმძლავრე', 'Power', 'Мощность'), value: L('2500 W', '2500 W', '2500 Вт') },
      { key: L('ქვედა სიხშირე', 'Low frequency', 'Нижняя частота'), value: L('30 Hz', '30 Hz', '30 Гц') },
    ],
    relatedIds: ['eq-pa-15'],
  },
  {
    id: 'eq-line-array', slug: 'line-array-element', order: 3, categoryIds: ['cat-speakers'],
    name: L('Line Array ელემენტი', 'Line Array Element', 'Элемент линейного массива'),
    shortDescription: L('მოდულური სისტემა დიდი ღონისძიებებისთვის.', 'Modular system for large-scale events.', 'Модульная система для крупных мероприятий.'),
    description: L('იკიდება მასივად და თანაბრად ფარავს დიდ ღია და დახურულ სივრცეებს.', 'Flown as an array, it covers large indoor and open-air areas evenly.', 'Подвешивается массивом и равномерно покрывает большие площадки.'),
    brand: 'RCF', showPrice: false, currency: 'GEL', availability: 'limited', specs: [],
  },
  {
    id: 'eq-xdj-rr', slug: 'pioneer-xdj-rr', order: 4, categoryIds: ['cat-dj'],
    image: img('xdj-rr.jpg'),
    name: L('Pioneer XDJ-RR ოლ-ინ-ვან სისტემა', 'Pioneer XDJ-RR All-in-One System', 'Pioneer XDJ-RR — всё в одном'),
    shortDescription: L('ორდეკიანი ავტონომიური DJ სისტემა ეკრანით.', 'Two-deck standalone DJ system with a display.', 'Двухдековая автономная DJ-система с дисплеем.'),
    description: L('rekordbox-თან სრულად თავსებადი ავტონომიური სისტემა — ლეპტოპი არ სჭირდება. იდეალურია ქორწილებისა და კორპორატიული ღონისძიებებისთვის.', 'A standalone rekordbox-compatible system — no laptop required. Ideal for weddings and corporate events.', 'Автономная система с поддержкой rekordbox — ноутбук не нужен. Идеальна для свадеб и корпоративов.'),
    brand: 'Pioneer DJ', model: 'XDJ-RR', showPrice: true, price: 180, pricePeriod: 'event',
    currency: 'GEL', featured: true, isNew: false, availability: 'available',
    specs: [
      { key: L('არხები', 'Channels', 'Каналы'), value: L('2', '2', '2') },
      { key: L('ეკრანი', 'Display', 'Дисплей'), value: L('7" ფერადი', '7" full colour', '7" цветной') },
      { key: L('მედია', 'Media', 'Носители'), value: L('USB / rekordbox', 'USB / rekordbox', 'USB / rekordbox') },
    ],
    accessories: L('კვების კაბელი, RCA კაბელები, USB ფლეშ-მეხსიერება.', 'Power cable, RCA cables, USB stick.', 'Кабель питания, RCA-кабели, USB-накопитель.'),
    relatedIds: ['eq-djm-750', 'eq-djs-1000'],
  },
  {
    id: 'eq-djm-750', slug: 'pioneer-djm-750mk2', order: 5, categoryIds: ['cat-dj'],
    image: img('djm-750mk2.jpg'),
    gallery: [img('djm-750mk2-rear.jpg')],
    name: L('Pioneer DJM-750MK2 მიქშერი', 'Pioneer DJM-750MK2 Mixer', 'Микшер Pioneer DJM-750MK2'),
    shortDescription: L('4-არხიანი კლუბური მიქშერი Beat FX-ით.', '4-channel club mixer with Beat FX.', '4-канальный клубный микшер с Beat FX.'),
    description: L('კლუბური სტანდარტის მიქშერი მაღალი ხარისხის ხმით, ჩაშენებული ეფექტებითა და პროფესიონალური კომუტაციით.', 'Club-standard mixer with high-grade sound, onboard effects and professional connectivity.', 'Микшер клубного стандарта с качественным звуком, эффектами и профессиональной коммутацией.'),
    brand: 'Pioneer DJ', model: 'DJM-750MK2', showPrice: true, price: 140, pricePeriod: 'event',
    currency: 'GEL', featured: true, availability: 'available',
    specs: [
      { key: L('არხები', 'Channels', 'Каналы'), value: L('4', '4', '4') },
      { key: L('ეფექტები', 'Effects', 'Эффекты'), value: L('Beat FX / Sound Color FX', 'Beat FX / Sound Color FX', 'Beat FX / Sound Color FX') },
      { key: L('გამოსასვლელები', 'Outputs', 'Выходы'), value: L('XLR / RCA / Booth', 'XLR / RCA / Booth', 'XLR / RCA / Booth') },
    ],
    relatedIds: ['eq-xdj-rr', 'eq-cdj'],
  },
  {
    id: 'eq-djs-1000', slug: 'pioneer-djs-1000', order: 6, categoryIds: ['cat-dj'],
    image: img('djs-1000.jpg'),
    name: L('Pioneer DJS-1000 სემპლერი', 'Pioneer DJS-1000 Sampler', 'Сэмплер Pioneer DJS-1000'),
    shortDescription: L('სასცენო სემპლერი ცოცხალი ელემენტებისთვის.', 'Stage sampler for live elements in the set.', 'Сценический сэмплер для живых элементов.'),
    description: L('16 პედი, სენსორული ეკრანი და ჩაშენებული ეფექტები — DJ სეტს ცოცხალი შესრულების ელემენტს მატებს.', '16 pads, a touch display and onboard effects — adds live performance to a DJ set.', '16 пэдов, сенсорный экран и эффекты — добавляет живое исполнение в DJ-сет.'),
    brand: 'Pioneer DJ', model: 'DJS-1000', showPrice: false, currency: 'GEL',
    isNew: true, availability: 'limited', specs: [],
    relatedIds: ['eq-djm-750'],
  },
  {
    id: 'eq-cdj', slug: 'cdj-2000nxs2', order: 7, categoryIds: ['cat-dj'],
    image: img('cdj-setup.jpg'),
    name: L('CDJ-2000NXS2 პლეიერი', 'CDJ-2000NXS2 Player', 'Плеер CDJ-2000NXS2'),
    shortDescription: L('კლუბური სტანდარტის DJ პლეიერი.', 'The club-standard professional DJ player.', 'Клубный стандарт профессионального DJ-плеера.'),
    description: L('ინდუსტრიის სტანდარტი დიდი ეკრანით და ზუსტი ჯოგ-ბორბლით. ქირავდება წყვილად, მიქშერთან ერთად.', 'The industry standard, with a large display and precise jog wheel. Rented as a pair with a mixer.', 'Индустриальный стандарт с большим дисплеем и точным джог-колесом. Сдаётся парой с микшером.'),
    brand: 'Pioneer DJ', model: 'CDJ-2000NXS2', showPrice: false, currency: 'GEL',
    featured: true, availability: 'available', specs: [],
    relatedIds: ['eq-djm-750'],
  },
  {
    id: 'eq-wireless-mic', slug: 'wireless-microphone', order: 8, categoryIds: ['cat-mics'],
    name: L('უსადენო მიკროფონი', 'Wireless Microphone', 'Беспроводной микрофон'),
    shortDescription: L('ორარხიანი უსადენო სისტემა ტოსტმასტერისთვის.', 'Dual-channel wireless system for hosts and speeches.', 'Двухканальная радиосистема для ведущего и речей.'),
    description: L('სტაბილური UHF სისტემა ორი ხელის მიკროფონითა და ავტომატური სიხშირის შერჩევით.', 'Reliable UHF system with two handhelds and automatic frequency scanning.', 'Надёжная UHF-система с двумя ручными микрофонами и автосканированием частот.'),
    brand: 'Shure', model: 'BLX288', showPrice: true, price: 60, pricePeriod: 'event', currency: 'GEL',
    availability: 'available', specs: [],
  },
  {
    id: 'eq-wired-mic', slug: 'wired-vocal-microphone', order: 9, categoryIds: ['cat-mics'],
    name: L('სადენიანი ვოკალური მიკროფონი', 'Wired Vocal Microphone', 'Проводной вокальный микрофон'),
    shortDescription: L('ინდუსტრიის სტანდარტი ცოცხალი ვოკალისთვის.', 'The industry standard for live vocals.', 'Индустриальный стандарт для живого вокала.'),
    description: L('გამძლე დინამიური მიკროფონი სტენდითა და კაბელით.', 'A rugged dynamic microphone, supplied with a stand and cable.', 'Прочный динамический микрофон со стойкой и кабелем.'),
    brand: 'Shure', model: 'SM58', showPrice: true, price: 15, pricePeriod: 'day', currency: 'GEL',
    availability: 'available', specs: [],
  },
  {
    id: 'eq-moving-head', slug: 'moving-head-beam', order: 10, categoryIds: ['cat-light'],
    name: L('Moving Head სანათი', 'Moving Head Beam', 'Moving Head Beam'),
    shortDescription: L('დინამიური სასცენო სანათი პრიზმითა და გობოებით.', 'Dynamic stage fixture with prism and gobos.', 'Динамический прибор с призмой и гобо.'),
    description: L('ენერგიული სხივი, რომელიც ცოცხალ სივრცეს ქმნის ცეკვის ზონაში.', 'An energetic beam that shapes the dance floor.', 'Энергичный луч, формирующий пространство танцпола.'),
    brand: 'Chauvet', showPrice: true, price: 45, pricePeriod: 'day', currency: 'GEL',
    availability: 'available', specs: [],
  },
  {
    id: 'eq-led-par', slug: 'led-par-set', order: 11, categoryIds: ['cat-light'],
    name: L('LED PAR კომპლექტი', 'LED PAR Set', 'Комплект LED PAR'),
    shortDescription: L('ოთხი RGBW პროჟექტორი დარბაზის შესაფერად.', 'Four RGBW fixtures for room washes.', 'Четыре RGBW-прибора для заливки зала.'),
    description: L('თბილი და ფერადი შუქი კედლებისა და სცენის შესაფერად, DMX მართვით.', 'Warm and coloured washes for walls and stage, controlled over DMX.', 'Тёплая и цветная заливка стен и сцены, управление по DMX.'),
    brand: 'Chauvet', showPrice: true, price: 80, priceFrom: true, pricePeriod: 'event', currency: 'GEL',
    availability: 'available', specs: [],
  },
  {
    id: 'eq-booth', slug: 'dj-booth-stand', order: 12, categoryIds: ['cat-stage', 'cat-dj'],
    image: img('dj-booth-2.jpg'),
    name: L('DJ ბუთი / სადგამი', 'DJ Booth / Stand', 'DJ-стойка'),
    shortDescription: L('პროფესიონალური სადგამი აპარატურისა და კაბელაჟისთვის.', 'A professional stand for the gear and its cabling.', 'Профессиональная стойка для оборудования и коммутации.'),
    description: L('მდგრადი კონსტრუქცია სუფთა კაბელაჟითა და დეკორატიული ფრონტ-პანელით.', 'A stable structure with clean cabling and a decorative front panel.', 'Устойчивая конструкция с аккуратной коммутацией и декоративной панелью.'),
    showPrice: true, price: 100, pricePeriod: 'event', currency: 'GEL',
    availability: 'available', specs: [],
  },
];

const services = [
  { id: 'srv-rental', slug: 'equipment-rental', order: 0, featured: true,
    title: L('აპარატურის გაქირავება', 'Equipment Rental', 'Аренда оборудования'),
    shortDescription: L('ხმა, შუქი და სცენა — ერთი შეთანხმებით.', 'Sound, light and stage — under one agreement.', 'Звук, свет и сцена — по одному договору.'),
    description: L('ჩვენ ვაწვდით სრულ ტექნიკურ კომპლექტს ღონისძიების მასშტაბის მიხედვით.', 'We supply a complete technical package sized to your event.', 'Мы предоставляем полный технический комплект под масштаб мероприятия.') },
  { id: 'srv-dj', slug: 'dj-service', order: 1, featured: true, image: img('dj-booth-1.jpg'),
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
    image: img('dj-booth-3.jpg'),
    equipmentIds: ['eq-pa-12', 'eq-wireless-mic'], guests: '40–80', showPrice: true, price: 350, priceFrom: true, currency: 'GEL' },
  { id: 'pkg-wedding', slug: 'wedding', order: 1, featured: true,
    name: L('ქორწილის პაკეტი', 'Wedding Package', 'Свадебный пакет'),
    description: L('150–300 სტუმარი. სრული PA სისტემა სუბვუფერებით, DJ აპარატურა, უსადენო მიკროფონები და განათება.', '150–300 guests. Full PA with subwoofers, DJ equipment, wireless microphones and lighting.', '150–300 гостей. Полная PA-система с сабвуферами, DJ-оборудование, радиомикрофоны и свет.'),
    image: img('dj-booth-1.jpg'),
    equipmentIds: ['eq-pa-15', 'eq-sub-18', 'eq-xdj-rr', 'eq-djm-750', 'eq-wireless-mic', 'eq-moving-head', 'eq-led-par'],
    guests: '150–300', showPrice: true, price: 1200, priceFrom: true, currency: 'GEL' },
  { id: 'pkg-club', slug: 'club-setup', order: 2,
    name: L('კლუბური სეტაპი', 'Club Setup', 'Клубный сетап'),
    description: L('DJ ბუთი კლუბური სტანდარტის პლეიერებითა და მიქშერით.', 'A DJ booth with club-standard players and mixer.', 'DJ-стойка с плеерами и микшером клубного стандарта.'),
    image: img('dj-booth-2.jpg'),
    equipmentIds: ['eq-cdj', 'eq-djm-750', 'eq-djs-1000', 'eq-sub-18', 'eq-booth'], showPrice: false, currency: 'GEL' },
];

const projects = [
  { id: 'prj-open-air', slug: 'open-air-summer', order: 0, featured: true, date: '2025-07-19',
    title: L('ღია ცის ქვეშ ზაფხულის ღონისძიება', 'Open-Air Summer Event', 'Летнее мероприятие под открытым небом'),
    location: L('კახეთი', 'Kakheti', 'Кахетия'),
    description: L('600 სტუმარი, ორი სცენა, სრული ხმისა და განათების უზრუნველყოფა.', '600 guests, two stages, full sound and lighting supply.', '600 гостей, две сцены, полное звуковое и световое обеспечение.'),
    image: img('dj-booth-1.jpg'), gallery: [img('dj-booth-2.jpg'), img('dj-booth-3.jpg')],
    equipmentIds: ['eq-pa-15', 'eq-sub-18', 'eq-moving-head', 'eq-xdj-rr'], serviceIds: ['srv-rental', 'srv-support'] },
  { id: 'prj-corporate', slug: 'corporate-conference', order: 1, date: '2025-11-08',
    title: L('კორპორატიული კონფერენცია', 'Corporate Conference', 'Корпоративная конференция'),
    location: L('თბილისი', 'Tbilisi', 'Тбилиси'),
    description: L('კონფერენციის ხმა, პრეზენტაციის აუდიო და უსადენო მიკროფონები.', 'Conference sound, presentation audio and wireless microphones.', 'Звук конференции, аудио презентаций и радиомикрофоны.'),
    image: img('dj-booth-3.jpg'),
    equipmentIds: ['eq-pa-12', 'eq-wireless-mic'], serviceIds: ['srv-rental', 'srv-install'] },
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
