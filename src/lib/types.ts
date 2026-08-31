export type Lang = 'ka' | 'en' | 'ru';
export const LANGS: Lang[] = ['ka', 'en', 'ru'];
export const DEFAULT_LANG: Lang = 'ka';

/** Every translatable string is stored as one localized object, never as duplicated records. */
export type Loc = { ka?: string; en?: string; ru?: string };

export interface MediaItem {
  id: string;
  url: string;
  path?: string;          // storage path, for deletion
  filename: string;
  width?: number;
  height?: number;
  size?: number;
  contentType?: string;
  alt?: Loc;
  createdAt?: number;
}

export interface ImageRef {
  url: string;
  mediaId?: string;
  alt?: Loc;
}

export interface SeoFields {
  seoTitle?: Loc;
  seoDescription?: Loc;
  ogImage?: string;
}

export interface Category extends SeoFields {
  id: string;
  slug: string;
  name: Loc;
  description?: Loc;
  image?: string;
  icon?: string;
  order: number;
  active: boolean;
}

export type PricePeriod = 'day' | 'event' | 'hour' | 'custom';

export interface SpecRow { key: Loc; value: Loc; }

export interface Equipment extends SeoFields {
  id: string;
  slug: string;
  name: Loc;
  shortDescription?: Loc;
  description?: Loc;
  image?: string;
  gallery: string[];
  video?: string;
  brand?: string;
  model?: string;
  sku?: string;
  categoryIds: string[];
  showPrice: boolean;
  price?: number;
  priceFrom?: boolean;
  pricePeriod?: PricePeriod;
  pricePeriodCustom?: Loc;
  currency: string;
  availability: 'available' | 'limited' | 'unavailable';
  featured: boolean;
  isNew: boolean;
  specs: SpecRow[];
  accessories?: Loc;
  deposit?: Loc;
  minDuration?: Loc;
  relatedIds: string[];
  order: number;
  active: boolean;
}

export interface Service extends SeoFields {
  id: string;
  slug: string;
  title: Loc;
  shortDescription?: Loc;
  description?: Loc;
  image?: string;
  gallery: string[];
  icon?: string;
  showPrice: boolean;
  price?: number;
  currency: string;
  ctaLabel?: Loc;
  ctaUrl?: string;
  order: number;
  active: boolean;
  featured: boolean;
}

export interface RentalPackage extends SeoFields {
  id: string;
  slug: string;
  name: Loc;
  description?: Loc;
  image?: string;
  gallery: string[];
  showPrice: boolean;
  price?: number;
  priceFrom?: boolean;
  currency: string;
  equipmentIds: string[];
  guests?: string;
  venueSize?: Loc;
  featured: boolean;
  order: number;
  active: boolean;
}

export interface Project extends SeoFields {
  id: string;
  slug: string;
  title: Loc;
  location?: Loc;
  date?: string;
  client?: string;
  image?: string;
  gallery: string[];
  video?: string;
  description?: Loc;
  equipmentIds: string[];
  serviceIds: string[];
  featured: boolean;
  order: number;
  active: boolean;
}

export interface Page extends SeoFields {
  id: string;
  slug: string;
  title: Loc;
  content: Loc;           // rich text (HTML)
  heroImage?: string;
  inNavigation: boolean;
  order: number;
  active: boolean;
}

export interface Faq {
  id: string;
  question: Loc;
  answer: Loc;
  order: number;
  active: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  role?: Loc;
  quote: Loc;
  image?: string;
  order: number;
  active: boolean;
}

export interface NavItem {
  id: string;
  label: Loc;
  url: string;
  order: number;
  active: boolean;
  newTab: boolean;
  parentId?: string | null;
}

export type SectionType =
  | 'hero3d' | 'intro' | 'categories' | 'featured' | 'services' | 'packages'
  | 'why' | 'projects' | 'imagebreak' | 'process' | 'stats' | 'clients'
  | 'testimonials' | 'faq' | 'cta' | 'contact' | 'custom';

export interface HomepageSection {
  id: string;
  type: SectionType;
  visible: boolean;
  order: number;
  title?: Loc;
  subtitle?: Loc;
  content?: Loc;
  image?: string;
  imageMobile?: string;
  ctaLabel?: Loc;
  ctaUrl?: string;
  layout?: string;
  items?: Array<{
    id: string;
    title?: Loc;
    text?: Loc;
    value?: string;
    image?: string;
    icon?: string;
  }>;
}

export interface SocialLink {
  id: string;
  network: string;
  url: string;
  active: boolean;
}

export interface SiteSettings {
  siteName: Loc;
  companyName: string;
  logo?: string;
  logoLight?: string;
  logoFooter?: string;
  favicon?: string;
  accentColor: string;
  defaultLang: Lang;
  seoTitle: Loc;
  seoDescription: Loc;
  ogImage?: string;
  copyright: Loc;
  footerDescription: Loc;
  contact: {
    phones: string[];
    email: string;
    addresses: Loc;
    workingHours: Loc;
    mapEmbed?: string;
    mapLink?: string;
    registration?: Loc;
  };
  whatsapp: {
    enabled: boolean;
    number: string;
    floating: boolean;
    inHeader: boolean;
    defaultMessage: Loc;
    itemMessage: Loc;   // supports the {item} placeholder
  };
  socials: SocialLink[];
  analyticsId?: string;
}

export interface HeroSettings {
  enabled: boolean;
  enabledOnMobile: boolean;
  modelUrl?: string;          // GLB/GLTF; empty = built-in procedural PA speaker
  modelUrlMobile?: string;
  fallbackImage?: string;
  initialScale: number;
  initialRotationY: number;
  cameraDistance: number;
  intensity: number;          // overall motion amount
  explodeDistance: number;
  sectionHeight: number;      // in vh
  showLabels: boolean;
  background: string;
  accentLight: boolean;
  title: Loc;
  subtitle: Loc;
  ctaLabel: Loc;
  ctaUrl: string;
  ctaSecondaryLabel: Loc;
  ctaSecondaryUrl: string;
  storyTitle: Loc;
  storyItems: Array<{ id: string; title: Loc }>;
  finalTitle: Loc;
  labels: Array<{
    id: string;
    title: Loc;
    text: Loc;
    visible: boolean;
    order: number;
  }>;
}

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'confirmed' | 'closed';

export interface ContactRequest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  eventDate?: string;
  eventType?: string;
  location?: string;
  message: string;
  refType?: 'equipment' | 'package' | 'service';
  refId?: string;
  refName?: string;
  lang: Lang;
  status: LeadStatus;
  createdAt: number;
  notes?: string;
}

export interface QuoteRequest extends ContactRequest {
  guests?: string;
  equipmentIds: string[];
  packageId?: string;
}

export type AdminRole = 'superadmin' | 'admin' | 'editor';

export interface AdminUser {
  id: string;      // == Firebase Auth uid
  email: string;
  name?: string;
  role: AdminRole;
  active: boolean;
  createdAt: number;
  lastLoginAt?: number;
}
