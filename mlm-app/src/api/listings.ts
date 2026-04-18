// src/api/listings.ts
// Listings and categories — public read endpoints.
// Endpoints: GET /listings, GET /listings/:id, GET /categories, GET /categories/:id

import { apiRequest } from './client';
import type { Listing, PaginatedListings, ProductCategory } from './types';

// ─── Listings ────────────────────────────────────────────────────────────────

export interface ListingSearchParams {
  q?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  intensity_min?: number;
  intensity_max?: number;
  page?: number;
  limit?: number;
}

export async function getListings(params: ListingSearchParams = {}): Promise<PaginatedListings> {
  const query = new URLSearchParams();
  if (params.q !== undefined) query.set('q', params.q);
  if (params.category_id !== undefined) query.set('category_id', params.category_id);
  if (params.min_price !== undefined) query.set('min_price', String(params.min_price));
  if (params.max_price !== undefined) query.set('max_price', String(params.max_price));
  if (params.intensity_min !== undefined) query.set('intensity_min', String(params.intensity_min));
  if (params.intensity_max !== undefined) query.set('intensity_max', String(params.intensity_max));
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<PaginatedListings>(`/listings${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getListingById(id: string): Promise<Listing> {
  return apiRequest<Listing>(`/listings/${id}`, {
    method: 'GET',
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ProductCategory[]> {
  return apiRequest<ProductCategory[]>('/categories', {
    method: 'GET',
  });
}

export async function getCategoryById(id: string): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/categories/${id}`, {
    method: 'GET',
  });
}

