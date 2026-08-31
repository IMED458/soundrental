import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { COL, createDoc, listDocs, removeDoc, saveDoc } from './db';
import type { MediaItem } from './types';

export const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2200;
const WEBP_QUALITY = 0.86;

export interface UploadResult { url: string; item: MediaItem; }

export function validateFile(file: File, kind: 'image' | 'video' | 'model' = 'image'): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return `File is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`;
  if (kind === 'image' && !ACCEPTED_IMAGE.includes(file.type)) {
    return 'Unsupported image type. Use JPG, PNG, WebP, AVIF or SVG.';
  }
  if (kind === 'video' && !file.type.startsWith('video/')) return 'Please choose a video file.';
  if (kind === 'model' && !/\.(glb|gltf)$/i.test(file.name)) return 'Please choose a .glb or .gltf file.';
  return null;
}

/** Downscale + convert to WebP in the browser so uploads stay small without a server. */
async function optimizeImage(file: File): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  if (file.type === 'image/svg+xml' || file.type === 'image/avif') {
    return { blob: file, width: 0, height: 0, type: file.type };
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { blob: file, width: 0, height: 0, type: file.type };

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { blob: file, width: bitmap.width, height: bitmap.height, type: file.type };
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  );
  if (!blob || blob.size > file.size) {
    return { blob: file, width, height, type: file.type };
  }
  return { blob, width, height, type: 'image/webp' };
}

async function uploadToCloudinary(blob: Blob, filename: string): Promise<string | null> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return null;
  const form = new FormData();
  form.append('file', new File([blob], filename, { type: blob.type }));
  form.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: 'POST', body: form });
  if (!res.ok) return null;
  const json = (await res.json()) as { secure_url?: string };
  return json.secure_url ?? null;
}

export async function uploadMedia(
  file: File,
  kind: 'image' | 'video' | 'model' = 'image'
): Promise<UploadResult> {
  const problem = validateFile(file, kind);
  if (problem) throw new Error(problem);

  let blob: Blob = file;
  let width = 0;
  let height = 0;
  let filename = file.name;

  if (kind === 'image') {
    const opt = await optimizeImage(file);
    blob = opt.blob;
    width = opt.width;
    height = opt.height;
    if (opt.type === 'image/webp') filename = filename.replace(/\.[^.]+$/, '') + '.webp';
  }

  const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename.replace(/[^\w.-]/g, '_')}`;

  let url: string | null = null;
  let storagePath: string | undefined;
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: blob.type, cacheControl: 'public,max-age=31536000' });
    url = await getDownloadURL(storageRef);
    storagePath = path;
  } catch (err) {
    // Firebase Storage may not be enabled on the project — fall back if configured.
    url = await uploadToCloudinary(blob, filename);
    if (!url) throw err;
  }

  const item: Omit<MediaItem, 'id'> = {
    url,
    path: storagePath,
    filename,
    width: width || undefined,
    height: height || undefined,
    size: blob.size,
    contentType: blob.type,
    alt: {},
    createdAt: Date.now(),
  };
  const id = await createDoc(COL.media, item);
  return { url, item: { id, ...item } as MediaItem };
}

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await listDocs<MediaItem>(COL.media);
  return rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function updateMediaAlt(item: MediaItem): Promise<void> {
  await saveDoc(COL.media, item.id, { alt: item.alt });
}

/** Collections whose documents may reference a media URL. */
const REFERENCING = [
  COL.categories, COL.equipment, COL.services, COL.packages,
  COL.projects, COL.pages, COL.homepageSections, COL.settings, COL.testimonials,
] as const;

/** Returns the collections that still point at this URL — the caller warns before deleting. */
export async function findMediaUsage(url: string): Promise<string[]> {
  const used: string[] = [];
  await Promise.all(
    REFERENCING.map(async (name) => {
      const rows = await listDocs<Record<string, unknown>>(name);
      if (rows.some((r) => JSON.stringify(r).includes(url))) used.push(name);
    })
  );
  return used;
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  if (item.path) {
    try { await deleteObject(ref(storage, item.path)); }
    catch (e) { console.warn('storage delete failed (continuing):', e); }
  }
  await removeDoc(COL.media, item.id);
}
