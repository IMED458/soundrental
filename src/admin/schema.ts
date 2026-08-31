import { COL, type CollectionName } from '../lib/db';
import type { Loc } from '../lib/types';

export type FieldType =
  | 'text' | 'number' | 'bool' | 'select' | 'slug' | 'date'
  | 'loc' | 'locArea' | 'locHtml'
  | 'image' | 'gallery' | 'multiref' | 'specs';

export interface FieldDef {
  key: string;
  type: FieldType;
  label: string;
  hint?: string;
  required?: boolean;
  group?: string;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  ref?: CollectionName;
  refLabel?: string;
  /** Hide the field unless the current record satisfies this predicate. */
  showIf?: (record: Record<string, unknown>) => boolean;
}

export interface EntitySchema {
  name: CollectionName;
  path: string;
  title: string;
  singular: string;
  titleField: string;
  imageField?: string;
  groups: string[];
  fields: FieldDef[];
  defaults: () => Record<string, unknown>;
  /** Localized fields checked for the KA/EN/RU completeness badges. */
  translated: string[];
}

const seoFields: FieldDef[] = [
  { key: 'seoTitle', type: 'loc', label: 'SEO title', group: 'SEO' },
  { key: 'seoDescription', type: 'locArea', label: 'SEO description', group: 'SEO', rows: 3 },
  { key: 'ogImage', type: 'image', label: 'Social sharing image', group: 'SEO' },
];

const emptyLoc = (): Loc => ({ ka: '', en: '', ru: '' });

export const SCHEMAS: Record<string, EntitySchema> = {
  categories: {
    name: COL.categories, path: 'categories', title: 'Categories', singular: 'Category',
    titleField: 'name', imageField: 'image',
    groups: ['Content', 'Media', 'SEO', 'Settings'],
    translated: ['name', 'description'],
    defaults: () => ({ name: emptyLoc(), description: emptyLoc(), slug: '', image: '', icon: '', order: 0, active: true }),
    fields: [
      { key: 'name', type: 'loc', label: 'Name', required: true, group: 'Content' },
      { key: 'description', type: 'locArea', label: 'Description', group: 'Content' },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content', hint: 'Used in the URL: /en/equipment?category=slug' },
      { key: 'image', type: 'image', label: 'Category image', group: 'Media' },
      { key: 'icon', type: 'text', label: 'Icon name', group: 'Media', hint: 'Optional lucide icon name.' },
      ...seoFields,
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible on the website', group: 'Settings' },
    ],
  },

  equipment: {
    name: COL.equipment, path: 'equipment', title: 'Equipment', singular: 'Equipment item',
    titleField: 'name', imageField: 'image',
    groups: ['Content', 'Media', 'Pricing', 'Details', 'Relations', 'SEO', 'Settings'],
    translated: ['name', 'shortDescription', 'description'],
    defaults: () => ({
      name: emptyLoc(), shortDescription: emptyLoc(), description: emptyLoc(), slug: '',
      image: '', gallery: [], video: '', brand: '', model: '', sku: '',
      categoryIds: [], showPrice: false, price: undefined, priceFrom: true,
      pricePeriod: 'day', pricePeriodCustom: emptyLoc(), currency: 'GEL',
      availability: 'available', featured: false, isNew: false, specs: [],
      accessories: emptyLoc(), deposit: emptyLoc(), minDuration: emptyLoc(),
      relatedIds: [], order: 0, active: true,
    }),
    fields: [
      { key: 'name', type: 'loc', label: 'Item name', required: true, group: 'Content' },
      { key: 'shortDescription', type: 'locArea', label: 'Short description', group: 'Content', rows: 3 },
      { key: 'description', type: 'locArea', label: 'Full description', group: 'Content', rows: 8 },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content' },
      { key: 'image', type: 'image', label: 'Main image', group: 'Media' },
      { key: 'gallery', type: 'gallery', label: 'Gallery', group: 'Media' },
      { key: 'video', type: 'text', label: 'Video embed URL', group: 'Media', hint: 'YouTube/Vimeo embed URL.' },
      { key: 'showPrice', type: 'bool', label: 'Show price', hint: 'Off = “Contact for price”.', group: 'Pricing' },
      { key: 'price', type: 'number', label: 'Price', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'priceFrom', type: 'bool', label: 'Show as “from”', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'currency', type: 'text', label: 'Currency', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      {
        key: 'pricePeriod', type: 'select', label: 'Price period', group: 'Pricing',
        showIf: (r) => Boolean(r.showPrice),
        options: [
          { value: 'day', label: 'Per day' }, { value: 'event', label: 'Per event' },
          { value: 'hour', label: 'Per hour' }, { value: 'custom', label: 'Custom' },
        ],
      },
      { key: 'pricePeriodCustom', type: 'loc', label: 'Custom period label', group: 'Pricing', showIf: (r) => r.showPrice === true && r.pricePeriod === 'custom' },
      { key: 'brand', type: 'text', label: 'Brand', group: 'Details' },
      { key: 'model', type: 'text', label: 'Model', group: 'Details' },
      { key: 'sku', type: 'text', label: 'Internal code / SKU', group: 'Details' },
      { key: 'specs', type: 'specs', label: 'Technical specifications', group: 'Details' },
      { key: 'accessories', type: 'locArea', label: 'Included accessories', group: 'Details', rows: 3 },
      { key: 'deposit', type: 'loc', label: 'Deposit', group: 'Details' },
      { key: 'minDuration', type: 'loc', label: 'Minimum rental duration', group: 'Details' },
      {
        key: 'availability', type: 'select', label: 'Availability', group: 'Details',
        options: [
          { value: 'available', label: 'Available' },
          { value: 'limited', label: 'Limited' },
          { value: 'unavailable', label: 'Unavailable' },
        ],
      },
      { key: 'categoryIds', type: 'multiref', label: 'Categories', ref: COL.categories, refLabel: 'name', group: 'Relations' },
      { key: 'relatedIds', type: 'multiref', label: 'Related equipment', ref: COL.equipment, refLabel: 'name', group: 'Relations' },
      ...seoFields,
      { key: 'featured', type: 'bool', label: 'Featured', group: 'Settings' },
      { key: 'isNew', type: 'bool', label: 'Mark as new', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible on the website', group: 'Settings' },
    ],
  },

  services: {
    name: COL.services, path: 'services', title: 'Services', singular: 'Service',
    titleField: 'title', imageField: 'image',
    groups: ['Content', 'Media', 'Pricing', 'SEO', 'Settings'],
    translated: ['title', 'shortDescription', 'description'],
    defaults: () => ({
      title: emptyLoc(), shortDescription: emptyLoc(), description: emptyLoc(), slug: '',
      image: '', gallery: [], icon: '', showPrice: false, price: undefined, currency: 'GEL',
      ctaLabel: emptyLoc(), ctaUrl: '', order: 0, active: true, featured: false,
    }),
    fields: [
      { key: 'title', type: 'loc', label: 'Title', required: true, group: 'Content' },
      { key: 'shortDescription', type: 'locArea', label: 'Short description', group: 'Content', rows: 3 },
      { key: 'description', type: 'locArea', label: 'Full description', group: 'Content', rows: 8 },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content' },
      { key: 'image', type: 'image', label: 'Cover image', group: 'Media' },
      { key: 'gallery', type: 'gallery', label: 'Gallery', group: 'Media' },
      { key: 'showPrice', type: 'bool', label: 'Show starting price', group: 'Pricing' },
      { key: 'price', type: 'number', label: 'Starting price', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'currency', type: 'text', label: 'Currency', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'ctaLabel', type: 'loc', label: 'CTA label', group: 'Content' },
      { key: 'ctaUrl', type: 'text', label: 'CTA link', group: 'Content' },
      ...seoFields,
      { key: 'featured', type: 'bool', label: 'Featured', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible on the website', group: 'Settings' },
    ],
  },

  packages: {
    name: COL.packages, path: 'packages', title: 'Packages', singular: 'Package',
    titleField: 'name', imageField: 'image',
    groups: ['Content', 'Media', 'Pricing', 'Contents', 'SEO', 'Settings'],
    translated: ['name', 'description'],
    defaults: () => ({
      name: emptyLoc(), description: emptyLoc(), slug: '', image: '', gallery: [],
      showPrice: false, price: undefined, priceFrom: true, currency: 'GEL',
      equipmentIds: [], guests: '', venueSize: emptyLoc(), featured: false, order: 0, active: true,
    }),
    fields: [
      { key: 'name', type: 'loc', label: 'Package name', required: true, group: 'Content' },
      { key: 'description', type: 'locArea', label: 'Description', group: 'Content', rows: 6 },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content' },
      { key: 'image', type: 'image', label: 'Cover image', group: 'Media' },
      { key: 'gallery', type: 'gallery', label: 'Gallery', group: 'Media' },
      { key: 'showPrice', type: 'bool', label: 'Show price', group: 'Pricing' },
      { key: 'price', type: 'number', label: 'Price', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'priceFrom', type: 'bool', label: 'Show as “from”', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'currency', type: 'text', label: 'Currency', group: 'Pricing', showIf: (r) => Boolean(r.showPrice) },
      { key: 'equipmentIds', type: 'multiref', label: 'Included equipment', ref: COL.equipment, refLabel: 'name', group: 'Contents' },
      { key: 'guests', type: 'text', label: 'Number of guests', group: 'Contents' },
      { key: 'venueSize', type: 'loc', label: 'Recommended venue size', group: 'Contents' },
      ...seoFields,
      { key: 'featured', type: 'bool', label: 'Featured', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible on the website', group: 'Settings' },
    ],
  },

  projects: {
    name: COL.projects, path: 'projects', title: 'Projects / Events', singular: 'Project',
    titleField: 'title', imageField: 'image',
    groups: ['Content', 'Media', 'Relations', 'SEO', 'Settings'],
    translated: ['title', 'description'],
    defaults: () => ({
      title: emptyLoc(), location: emptyLoc(), description: emptyLoc(), slug: '',
      date: '', client: '', image: '', gallery: [], video: '',
      equipmentIds: [], serviceIds: [], featured: false, order: 0, active: true,
    }),
    fields: [
      { key: 'title', type: 'loc', label: 'Project title', required: true, group: 'Content' },
      { key: 'location', type: 'loc', label: 'Location', group: 'Content' },
      { key: 'date', type: 'date', label: 'Date', group: 'Content' },
      { key: 'client', type: 'text', label: 'Client', group: 'Content' },
      { key: 'description', type: 'locArea', label: 'Description', group: 'Content', rows: 8 },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content' },
      { key: 'image', type: 'image', label: 'Cover image', group: 'Media' },
      { key: 'gallery', type: 'gallery', label: 'Gallery', group: 'Media' },
      { key: 'video', type: 'text', label: 'Video embed URL', group: 'Media' },
      { key: 'equipmentIds', type: 'multiref', label: 'Equipment used', ref: COL.equipment, refLabel: 'name', group: 'Relations' },
      { key: 'serviceIds', type: 'multiref', label: 'Services provided', ref: COL.services, refLabel: 'title', group: 'Relations' },
      ...seoFields,
      { key: 'featured', type: 'bool', label: 'Featured', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible on the website', group: 'Settings' },
    ],
  },

  pages: {
    name: COL.pages, path: 'pages', title: 'Pages', singular: 'Page',
    titleField: 'title', imageField: 'heroImage',
    groups: ['Content', 'Media', 'SEO', 'Settings'],
    translated: ['title', 'content'],
    defaults: () => ({
      title: emptyLoc(), content: emptyLoc(), slug: '', heroImage: '',
      inNavigation: false, order: 0, active: true,
    }),
    fields: [
      { key: 'title', type: 'loc', label: 'Page title', required: true, group: 'Content' },
      { key: 'slug', type: 'slug', label: 'Slug', required: true, group: 'Content', hint: 'URL: /en/p/slug — the slug “about” powers the About page.' },
      { key: 'content', type: 'locHtml', label: 'Content (HTML)', group: 'Content' },
      { key: 'heroImage', type: 'image', label: 'Hero image', group: 'Media' },
      ...seoFields,
      { key: 'inNavigation', type: 'bool', label: 'Show in footer navigation', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Published', group: 'Settings' },
    ],
  },

  faqs: {
    name: COL.faqs, path: 'faqs', title: 'FAQ', singular: 'Question',
    titleField: 'question',
    groups: ['Content', 'Settings'],
    translated: ['question', 'answer'],
    defaults: () => ({ question: emptyLoc(), answer: emptyLoc(), order: 0, active: true }),
    fields: [
      { key: 'question', type: 'loc', label: 'Question', required: true, group: 'Content' },
      { key: 'answer', type: 'locArea', label: 'Answer', group: 'Content', rows: 5 },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible', group: 'Settings' },
    ],
  },

  testimonials: {
    name: COL.testimonials, path: 'testimonials', title: 'Testimonials', singular: 'Testimonial',
    titleField: 'quote',
    groups: ['Content', 'Settings'],
    translated: ['quote', 'role'],
    defaults: () => ({ author: '', role: emptyLoc(), quote: emptyLoc(), image: '', order: 0, active: true }),
    fields: [
      { key: 'author', type: 'text', label: 'Author', required: true, group: 'Content' },
      { key: 'role', type: 'loc', label: 'Role / company', group: 'Content' },
      { key: 'quote', type: 'locArea', label: 'Quote', group: 'Content', rows: 4 },
      { key: 'image', type: 'image', label: 'Photo', group: 'Content' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible', group: 'Settings' },
    ],
  },

  navigation: {
    name: COL.navigation, path: 'navigation', title: 'Navigation', singular: 'Menu item',
    titleField: 'label',
    groups: ['Content', 'Settings'],
    translated: ['label'],
    defaults: () => ({ label: emptyLoc(), url: '/', order: 0, active: true, newTab: false, parentId: '' }),
    fields: [
      { key: 'label', type: 'loc', label: 'Label', required: true, group: 'Content' },
      { key: 'url', type: 'text', label: 'Destination', required: true, group: 'Content', hint: 'Internal path such as /equipment, or a full https:// URL.' },
      { key: 'parentId', type: 'text', label: 'Parent item id', group: 'Settings', hint: 'Leave empty for a top-level item.' },
      { key: 'newTab', type: 'bool', label: 'Open in a new tab', group: 'Settings' },
      { key: 'order', type: 'number', label: 'Display order', group: 'Settings' },
      { key: 'active', type: 'bool', label: 'Visible', group: 'Settings' },
    ],
  },
};

export const SCHEMA_LIST = Object.values(SCHEMAS);
