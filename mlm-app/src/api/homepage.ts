// src/api/homepage.ts
// Public homepage content endpoint.

import { apiRequest } from './client';
import type { HomepageContent } from './types';

export async function getHomepageContent(): Promise<HomepageContent> {
  return apiRequest<HomepageContent>('/public/homepage', {
    method: 'GET',
  });
}
