import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fbLimit, serverTimestamp, writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase';

export const COL = {
  settings: 'settings',
  navigation: 'navigation',
  homepageSections: 'homepageSections',
  categories: 'categories',
  equipment: 'equipment',
  services: 'services',
  packages: 'packages',
  projects: 'projects',
  pages: 'pages',
  faqs: 'faqs',
  testimonials: 'testimonials',
  media: 'media',
  contactRequests: 'contactRequests',
  quoteRequests: 'quoteRequests',
  adminUsers: 'adminUsers',
} as const;

export type CollectionName = (typeof COL)[keyof typeof COL];

function assertReady() {
  if (!firebaseConfigured) throw new Error('Firebase is not configured (see .env.example).');
}

/** Firestore rejects `undefined`; strip it recursively before every write. */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as unknown as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out as T;
  }
  return value;
}

export async function listDocs<T>(name: CollectionName, ...constraints: QueryConstraint[]): Promise<T[]> {
  assertReady();
  const snap = await getDocs(query(collection(db, name), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[];
}

/** Ordered, active-only content for the public site. */
export async function listPublic<T>(name: CollectionName): Promise<T[]> {
  const rows = await listDocs<T & { active?: boolean; order?: number }>(name);
  return rows
    .filter((r) => r.active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as unknown as T[];
}

export async function getDocById<T>(name: CollectionName, id: string): Promise<T | null> {
  assertReady();
  const snap = await getDoc(doc(db, name, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as object) } as T) : null;
}

export async function getBySlug<T>(name: CollectionName, slug: string): Promise<T | null> {
  const rows = await listDocs<T>(name, where('slug', '==', slug), fbLimit(1));
  return rows[0] ?? null;
}

export async function createDoc<T extends object>(name: CollectionName, data: T): Promise<string> {
  assertReady();
  const ref = await addDoc(collection(db, name), clean({ ...data, updatedAt: serverTimestamp() }));
  return ref.id;
}

export async function saveDoc<T extends object>(name: CollectionName, id: string, data: T): Promise<void> {
  assertReady();
  const { id: _drop, ...rest } = data as T & { id?: string };
  await setDoc(doc(db, name, id), clean({ ...rest, updatedAt: serverTimestamp() }), { merge: true });
}

export async function patchDoc(name: CollectionName, id: string, data: object): Promise<void> {
  assertReady();
  await updateDoc(doc(db, name, id), clean(data) as never);
}

export async function removeDoc(name: CollectionName, id: string): Promise<void> {
  assertReady();
  await deleteDoc(doc(db, name, id));
}

/** Persist a manual drag-and-drop ordering in one round trip. */
export async function saveOrder(name: CollectionName, ids: string[]): Promise<void> {
  assertReady();
  const batch = writeBatch(db);
  ids.forEach((id, i) => batch.update(doc(db, name, id), { order: i }));
  await batch.commit();
}

export { where, orderBy, fbLimit as limit, serverTimestamp };
