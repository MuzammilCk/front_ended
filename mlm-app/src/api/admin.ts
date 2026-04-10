// src/api/admin.ts
// Admin API surface — listings, inventory, orders, network, compensation.
// All endpoints under /admin/* require admin authentication.
// The AdminGuard checks x-admin-token header. This module sends it via
// the standard Authorization Bearer mechanism — backend must be configured
// to accept JwtAuthGuard for admin routes in production.
// For the current backend setup using x-admin-token, pass it as a custom header.

import { apiRequest } from './client';
import type {
  Listing,
  ProductCategory,
  Order,
  PaginatedOrders,
  GraphCorrectionLog,
} from './types';

// ─── Admin helper: attach admin token header ──────────────────────────────────
// The backend AdminGuard checks process.env.ADMIN_TOKEN via x-admin-token header.
// In production this will be replaced with proper RBAC JWT roles.
// Token is read from env — never hardcoded.

function adminHeaders(): Record<string, string> {
  type AdminEnv = { VITE_ADMIN_TOKEN?: string };
  const token = (import.meta as { env?: AdminEnv }).env?.VITE_ADMIN_TOKEN;
  if (!token) return {};
  return { 'x-admin-token': token };
}

// ─── Admin Listings ──────────────────────────────────────────────────────────

export interface CreateListingPayload {
  title: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  category_id?: string;
  condition?: string;
  authenticity_status?: string;
  status?: string;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  condition?: string;
  authenticity_status?: string;
  status?: string;
}

export interface AddImagePayload {
  storage_key: string;
  sort_order?: number;
}

export interface ReorderImagesPayload {
  ordered_ids: string[];
}

export interface ModerationActionPayload {
  action: string;
  reason: string;
  evidence?: string;
}

export async function adminCreateListing(payload: CreateListingPayload): Promise<Listing> {
  return apiRequest<Listing>('/admin/listings', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateListing(
  id: string,
  payload: UpdateListingPayload,
): Promise<Listing> {
  return apiRequest<Listing>(`/admin/listings/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminAddImage(
  listingId: string,
  payload: AddImagePayload,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminRemoveImage(
  listingId: string,
  imageId: string,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

export async function adminReorderImages(
  listingId: string,
  payload: ReorderImagesPayload,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images/reorder`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminModerateListing(
  id: string,
  payload: ModerationActionPayload,
): Promise<Listing> {
  // Extract and lowercase the action ('approve', 'reject') to map straight to the backend URL
  const actionPath = payload.action.toLowerCase();
  return apiRequest<Listing>(`/admin/listings/${id}/${actionPath}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

// ─── Admin Categories ────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

export async function adminCreateCategory(
  payload: CreateCategoryPayload,
): Promise<ProductCategory> {
  return apiRequest<ProductCategory>('/admin/categories', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/admin/categories/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminDeactivateCategory(id: string): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/admin/categories/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

// ─── Admin Inventory ─────────────────────────────────────────────────────────

export interface AddStockPayload {
  qty: number;            // min 1 — exact field from AddStockDto
}

export interface AdjustStockPayload {
  newTotalQty: number;    // min 0 — exact field from AdjustStockDto
  reason: string;         // min 5 chars — exact field from AdjustStockDto
}

export async function adminAddStock(
  listingId: string,
  payload: AddStockPayload,
): Promise<void> {
  return apiRequest<void>(`/admin/inventory/${listingId}/stock`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminAdjustStock(
  listingId: string,
  payload: AdjustStockPayload,
): Promise<void> {
  return apiRequest<void>(`/admin/inventory/${listingId}/stock`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

// ─── Admin Orders ────────────────────────────────────────────────────────────

export interface AdminListOrdersParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface AdminUpdateOrderStatusPayload {
  status: string;
  reason?: string;
}

export async function adminListOrders(
  params: AdminListOrdersParams = {},
): Promise<PaginatedOrders> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.from_date) query.set('from_date', params.from_date);
  if (params.to_date) query.set('to_date', params.to_date);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest<PaginatedOrders>(`/admin/orders${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: adminHeaders(),
  });
}

export async function adminGetOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${orderId}`, {
    method: 'GET',
    headers: adminHeaders(),
  });
}

export async function adminUpdateOrderStatus(
  orderId: string,
  payload: AdminUpdateOrderStatusPayload,
): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

// ─── Admin Network ───────────────────────────────────────────────────────────

export interface GraphCorrectionPayload {
  userId: string;
  newSponsorId: string;
  reason: string;         // min 10 chars — validated by backend
}

export async function adminApplyGraphCorrection(
  payload: GraphCorrectionPayload,
): Promise<GraphCorrectionLog> {
  return apiRequest<GraphCorrectionLog>('/admin/network/corrections', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adminListGraphCorrections(params: {
  userId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<GraphCorrectionLog[]> {
  const query = new URLSearchParams();
  if (params.userId) query.set('userId', params.userId);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest<GraphCorrectionLog[]>(`/admin/network/corrections${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: adminHeaders(),
  });
}

