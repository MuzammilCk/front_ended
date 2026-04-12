// src/utils/imageUrl.ts
// Converts a Supabase storage_key into a public CDN URL.
// If the key is already a full URL, it is returned as-is.

type ViteEnv = { VITE_SUPABASE_URL?: string, VITE_SUPABASE_STORAGE_BUCKET?: string };

const SUPABASE_URL: string =
  (import.meta as { env?: ViteEnv }).env?.VITE_SUPABASE_URL ?? 'https://sbboxyruxueeckrzdxpb.supabase.co';

const BUCKET: string =
  (import.meta as { env?: ViteEnv }).env?.VITE_SUPABASE_STORAGE_BUCKET ?? 'media';

export function getImageUrl(storageKey: string | undefined | null): string | undefined {
  if (!storageKey) return undefined;
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  if (!SUPABASE_URL) return storageKey;
  // Supabase public URL format: {project_url}/storage/v1/object/public/{bucket}/{key}
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey}`;
}
