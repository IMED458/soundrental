import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, type QueryConstraint } from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase';
import { COL, type CollectionName } from './db';

interface State<T> { data: T[]; loading: boolean; error: Error | null; }

/**
 * Live collection subscription. Content edited in the admin panel appears on the
 * public site immediately, with no rebuild.
 */
export function useCollection<T extends { id: string; order?: number; active?: boolean }>(
  name: CollectionName,
  opts: { activeOnly?: boolean; constraints?: QueryConstraint[]; enabled?: boolean } = {}
): State<T> {
  const { activeOnly = true, constraints, enabled = true } = opts;
  const key = JSON.stringify(constraints?.map((c) => c.type) ?? []);
  const [state, setState] = useState<State<T>>({ data: [], loading: enabled, error: null });

  useEffect(() => {
    if (!enabled) { setState({ data: [], loading: false, error: null }); return; }
    if (!firebaseConfigured) { setState({ data: [], loading: false, error: null }); return; }
    setState((s) => ({ ...s, loading: true }));
    const q = constraints?.length ? query(collection(db, name), ...constraints) : collection(db, name);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[];
        const filtered = activeOnly ? rows.filter((r) => r.active !== false) : rows;
        filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setState({ data: filtered, loading: false, error: null });
      },
      (error) => {
        console.error(`[content] ${name}:`, error);
        setState({ data: [], loading: false, error: error as Error });
      }
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, activeOnly, enabled, key]);

  return state;
}

export function useCategories(activeOnly = true) {
  return useCollection<any>(COL.categories, { activeOnly });
}
export function useEquipment(activeOnly = true) {
  return useCollection<any>(COL.equipment, { activeOnly });
}
export function useFeaturedEquipment() {
  const constraints = useMemo(() => [where('featured', '==', true)], []);
  return useCollection<any>(COL.equipment, { constraints });
}
export function useServices(activeOnly = true) {
  return useCollection<any>(COL.services, { activeOnly });
}
export function usePackages(activeOnly = true) {
  return useCollection<any>(COL.packages, { activeOnly });
}
export function useProjects(activeOnly = true) {
  return useCollection<any>(COL.projects, { activeOnly });
}
export function usePages(activeOnly = true) {
  return useCollection<any>(COL.pages, { activeOnly });
}
export function useFaqs(activeOnly = true) {
  return useCollection<any>(COL.faqs, { activeOnly });
}
export function useTestimonials(activeOnly = true) {
  return useCollection<any>(COL.testimonials, { activeOnly });
}
export function useNavigation(activeOnly = true) {
  return useCollection<any>(COL.navigation, { activeOnly });
}
export function useHomepageSections(activeOnly = false) {
  return useCollection<any>(COL.homepageSections, { activeOnly });
}

interface DocState<T> { data: T | null; loading: boolean; notFound: boolean; }

/** Fetch a single record by slug without pulling the whole collection. */
export function useDocBySlug<T extends { id: string }>(name: CollectionName, slug: string | undefined): DocState<T> {
  const [state, setState] = useState<DocState<T>>({ data: null, loading: true, notFound: false });

  useEffect(() => {
    if (!slug || !firebaseConfigured) { setState({ data: null, loading: false, notFound: !slug }); return; }
    setState({ data: null, loading: true, notFound: false });
    const unsub = onSnapshot(
      query(collection(db, name), where('slug', '==', slug)),
      (snap) => {
        const doc = snap.docs[0];
        setState({
          data: doc ? ({ id: doc.id, ...(doc.data() as object) } as T) : null,
          loading: false,
          notFound: snap.empty,
        });
      },
      (error) => {
        console.error(`[content] ${name}/${slug}:`, error);
        setState({ data: null, loading: false, notFound: true });
      }
    );
    return unsub;
  }, [name, slug]);

  return state;
}

/** Resolve a handful of records by id — related items, package contents. */
export function useDocsByIds<T extends { id: string }>(name: CollectionName, ids: string[]): T[] {
  const key = ids.join(',');
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
    if (!ids.length || !firebaseConfigured) { setRows([]); return; }
    let cancelled = false;
    (async () => {
      const { getDoc, doc: docRef } = await import('firebase/firestore');
      const results = await Promise.all(
        ids.slice(0, 40).map(async (id) => {
          const snap = await getDoc(docRef(db, name, id));
          return snap.exists() ? ({ id: snap.id, ...(snap.data() as object) } as T) : null;
        })
      );
      if (!cancelled) setRows(results.filter(Boolean) as T[]);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);
  return rows;
}
