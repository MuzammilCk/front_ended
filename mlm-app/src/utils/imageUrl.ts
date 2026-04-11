// src/utils/imageUrl.ts
// Converts a Supabase storage_key into a public CDN URL.
// If the key is already a full URL, it is returned as-is.

type ViteEnv = { VITE_SUPABASE_URL?: string };

const SUPABASE_URL: string =
  (import.meta as { env?: ViteEnv }).env?.VITE_SUPABASE_URL ?? '';

export function getImageUrl(storageKey: string | undefined | null): string {
  if (!storageKey) return '';
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  if (!SUPABASE_URL) return storageKey;
  // Supabase public URL format: {project_url}/storage/v1/object/public/{key}
  return `${SUPABASE_URL}/storage/v1/object/public/${storageKey}`;
}
