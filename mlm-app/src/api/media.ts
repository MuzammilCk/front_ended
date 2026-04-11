// src/api/media.ts
// Media asset management — signed URL upload flow.

import { apiRequest } from './client';
import type { SignedUploadResponse, MediaAsset } from './types';

export async function getSignedUploadUrl(
  filename: string,
  mimeType: string,
): Promise<SignedUploadResponse> {
  return apiRequest<SignedUploadResponse>('/admin/media/signed-url', {
    method: 'POST',
    body: JSON.stringify({ filename, mime_type: mimeType }),
  });
}

export async function confirmUpload(
  storage_key: string,
  metadata: { alt_text?: string; width?: number; height?: number } = {},
): Promise<MediaAsset> {
  return apiRequest<MediaAsset>('/admin/media/confirm', {
    method: 'POST',
    body: JSON.stringify({ storage_key, ...metadata }),
  });
}

export async function deleteMedia(id: string): Promise<void> {
  return apiRequest<void>(`/admin/media/${id}`, {
    method: 'DELETE',
  });
}
