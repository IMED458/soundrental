# Sound, DJ & Event Equipment Rental — website + admin panel

A production-ready multilingual (KA / EN / RU) website for a professional sound, DJ and event
equipment rental company, with a full admin panel and a scroll-driven 3D hero.

Almost nothing the visitor sees is hardcoded: catalog, homepage sections, navigation, footer,
contact details, WhatsApp behaviour, SEO and the 3D hero are all edited from `/admin` and stored
in Firestore. Changes appear on the public site immediately — no rebuild.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (custom design tokens, no component library) |
| 3D | three.js · @react-three/fiber · @react-three/drei |
| Motion | Lenis smooth scroll · rect-driven scroll timeline |
| Database | Firebase Firestore (localized JSON fields, no per-language record duplication) |
| Auth | Firebase Auth (email + password) with an `adminUsers` roster and roles |
| Files | Firebase Storage, with an optional unsigned Cloudinary fallback |
| Hosting | Any static host — GitHub Pages by default |

## Setup

```bash
npm install
cp .env.example .env     # fill in the Firebase web config
npm run dev              # http://localhost:5180/soundrental/
```

### Firebase project

1. Create a Firebase project; enable **Authentication → Email/Password**, **Firestore** and **Storage**.
2. Copy the web app config into `.env`.
3. Deploy the security rules in this repo:

   ```bash
   npx firebase deploy --only firestore:rules,storage:rules
   ```

   `firestore.rules` makes content world-readable, restricts writes to listed admins, lets anyone
   submit a contact/quote request, and lets only admins read those requests.

### First administrator (bootstrap)

Admin access is granted by a document in `adminUsers`, so the first one is created by hand — no
public sign-up exists, by design:

1. **Authentication → Users → Add user** — email + password.
2. **Firestore → `adminUsers` → document id = that user's UID**, with fields:
   `email` (string), `role` = `superadmin`, `active` = `true`, `createdAt` = current epoch ms.
3. Sign in at `/admin`. Further admins are created inside **Admin users** — no console needed.

### Demo content

```bash
# .env: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD = the admin created above
npm run seed
```

Seeds settings, homepage sections, six categories, six equipment items, four services, three
packages, two projects, FAQ, the About page and the navigation menu — all three languages.
Re-running overwrites the seeded records (fixed ids) and leaves your own content alone.

## Build & deploy

```bash
npm run build                              # -> dist/
SITE_URL=https://you.github.io npm run sitemap   # -> dist/sitemap.xml + robots.txt
npm run deploy                             # gh-pages -d dist
```

`VITE_BASE` controls the base path: `/soundrental/` for a GitHub Pages project site, `/` for a
custom domain. When you move to a custom domain, also set `segments = 0` in `public/404.html`
(that file restores deep links, which GitHub Pages otherwise 404s).

## Content model

All text lives in localized objects — `{ ka, en, ru }` — on a single record, so no content is
duplicated per language. A missing translation falls back to the configured default language, and
the admin list views flag it (`KA ✓ EN ✓ RU ⚠`).

| Collection | Purpose |
| --- | --- |
| `settings/site`, `settings/hero3d` | Global settings and 3D hero configuration |
| `navigation`, `homepageSections`, `pages` | Menu, homepage layout, custom pages |
| `categories`, `equipment`, `services`, `packages` | Catalog |
| `projects`, `faqs`, `testimonials` | Portfolio and extras |
| `media` | Media library metadata (alt text, dimensions) |
| `contactRequests`, `quoteRequests` | Leads, with a status workflow |
| `adminUsers` | Admin roster and roles |

Deleting content from the admin panel is a soft delete: records move to **Trash**, can be restored,
and are only removed permanently after a second confirmation. Deleting a media file warns you first
if anything still references it.

## The 3D hero

A ~450vh pinned section whose entire state is a pure function of scroll progress: headline →
product movement → exploded view → technical labels → rental storytelling → reassembly → final CTA.
Scrolling back reverses it; stopping stops it. Progress is measured from the section's own
`getBoundingClientRect()` every frame — that stays correct under smooth scrolling, resizes and hot
reloads, where a cached scroll-trigger range silently sticks at zero.

Two built-in products ship with it, selectable in **Admin → 3D hero settings**:

- **DJ controller** (default) — two jog wheels, four channel strips with EQ and faders, crossfader,
  performance pads, FX section with display, brushed top plate, chassis, internal board and rear
  I/O. Being a wide flat console, it separates into *layers* along Y, the way a technical drawing of
  a console reads.
- **PA speaker** — grille, horn, woofer, cabinet, amplifier, I/O panel and handles, separating
  mostly along Z.

Both work before anyone uploads anything. Upload a GLB/GLTF instead and each top-level object in the
file becomes an explodable part — the animation system is unchanged. The product is auto-scaled to
the viewport (and to its own exploded spread), so it stays framed from phone to ultrawide.

Everything else is admin-controlled too: model, mobile model, fallback image, scale, rotation,
camera distance, intensity, explode distance, section height, labels, copy and both CTAs.

Degradation is deliberate:

- `prefers-reduced-motion` → a still, assembled product presentation, no scroll hijack.
- No WebGL, Save-Data on, or 3D disabled for mobile → static hero with the fallback image.
- Phones → lower pixel ratio, no shadows, no contact shadows, optional lighter model.
- `three.js` ships in its own chunk and is only downloaded when the 3D hero actually runs.

## Admin panel

`/admin` — Dashboard · Homepage · Pages · Navigation · Categories · Equipment · Services ·
Packages · Media library · Projects · FAQ · Testimonials · Inquiries · Website settings ·
3D hero settings · Admin users.

Notes worth knowing:

- **Prices are never mandatory.** Turn *Show price* off and the site shows “Contact for price” in
  the visitor's language.
- **WhatsApp** deep links are built from the admin-set number and per-language message templates;
  on an equipment page `{item}` is replaced with the item's name.
- **Uploads** are downscaled and converted to WebP in the browser before they reach Storage.
- **Roles**: `superadmin` (everything, incl. the roster), `admin` (everything except the roster),
  `editor` (content only). New admin accounts are created on a secondary Firebase app instance so
  creating one does not sign you out.
- Failed logins are rate-limited client-side; forms use a honeypot, a minimum fill time and a
  submit cooldown, and the Firestore rules do the real server-side validation.

## Accessibility & SEO

Semantic landmarks, a skip link, keyboard-operable dialogs and accordions, visible focus rings,
`prefers-reduced-motion` support, and localized `alt` text stored per image. Per-page title,
description, canonical, `hreflang` (plus `x-default`), Open Graph, Twitter cards and JSON-LD
(`LocalBusiness`, `Product`, `FAQPage`) are set from the CMS.

## Roadmap hooks

The quote flow stores structured requests with a status workflow but takes no payment — the
`quoteRequests` shape leaves room for an online payment step later without a data migration.
