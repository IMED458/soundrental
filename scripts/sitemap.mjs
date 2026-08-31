/**
 * Builds dist/sitemap.xml from the live Firestore content.
 * Reads through the public REST API, so it needs no service account —
 * the same public-read rules the website uses.
 *
 *   SITE_URL=https://example.com node scripts/sitemap.mjs
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { config } from 'dotenv';

config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
const base = (process.env.VITE_BASE || '/').replace(/\/$/, '');
const LANGS = ['ka', 'en', 'ru'];

if (!projectId || !siteUrl) {
  console.error('Set VITE_FIREBASE_PROJECT_ID (in .env) and SITE_URL before running.');
  process.exit(1);
}

async function fetchCollection(name) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${name}?pageSize=300`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! ${name}: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return (json.documents ?? []).map((d) => ({
    slug: d.fields?.slug?.stringValue,
    active: d.fields?.active?.booleanValue !== false,
    deleted: d.fields?.deleted?.booleanValue === true,
  }));
}

const staticPaths = ['', '/equipment', '/services', '/packages', '/projects', '/about', '/contact', '/quote'];

const collections = [
  ['equipment', '/equipment'],
  ['services', '/services'],
  ['packages', '/packages'],
  ['projects', '/projects'],
  ['pages', '/p'],
];

const urls = [];
const push = (path) => {
  for (const lang of LANGS) urls.push(`${siteUrl}${base}/${lang}${path}`);
};

staticPaths.forEach(push);

for (const [name, prefix] of collections) {
  const rows = await fetchCollection(name);
  rows.filter((r) => r.slug && r.active && !r.deleted).forEach((r) => push(`${prefix}/${r.slug}`));
}

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;

if (!existsSync('dist')) mkdirSync('dist');
writeFileSync('dist/sitemap.xml', xml);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}${base}/sitemap.xml\n`);
console.log(`Wrote dist/sitemap.xml with ${urls.length} URLs.`);
