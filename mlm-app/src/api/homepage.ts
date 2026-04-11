// src/api/homepage.ts
// Public homepage content endpoint.

import { apiRequest } from './client';
import type { HomepageContent } from './types';

export async function getHomepageContent(): Promise<HomepageContent> {
  const sections = await apiRequest<any[]>('/public/homepage', {
    method: 'GET',
  });

  // If the backend returns the content as a flat object, use it directly.
  if (!Array.isArray(sections)) {
    return sections as HomepageContent;
  }

  // Otherwise map the array of { section_key, content } into a flat object,
  // providing explicit defaults so consuming components never get undefined.
  const result: Partial<HomepageContent> = {
    hero: undefined,
    featured_collection: [],
    brand_statement: undefined,
    testimonials: [],
    scent_families: [],
    families: [],
  };

  sections.forEach((section) => {
    if (section.section_key === 'featured_collection') {
      result[section.section_key as keyof HomepageContent] =
        section.content?.items || [];
    } else {
      result[section.section_key as keyof HomepageContent] = section.content;
    }
  });

  return result as HomepageContent;
}
