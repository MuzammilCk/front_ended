// src/api/homepage.ts
// Public homepage content endpoint.

import { apiRequest } from './client';
import type { HomepageContent } from './types';

export async function getHomepageContent(): Promise<HomepageContent> {
  const sections = await apiRequest<any[]>('/public/homepage', {
    method: 'GET',
  });

  if (!Array.isArray(sections)) {
    return sections as HomepageContent;
  }

  const result: any = {};
  sections.forEach((section) => {
    if (section.section_key === 'featured_collection') {
      result[section.section_key] = section.content?.items || [];
    } else {
      result[section.section_key] = section.content;
    }
  });

  return result as HomepageContent;
}
