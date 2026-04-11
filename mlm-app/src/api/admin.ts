// src/api/admin.ts
// Admin API surface — listings, inventory, orders, network, compensation.
// All endpoints under /admin/* require JWT authentication with admin role.
// Authorization is handled centrally by client.ts Bearer token.

import { apiRequest } from './client';
import type {
  Listing,
  ProductCategory,
  Order,
  PaginatedOrders,
  GraphCorrectionLog,
  PaginatedAuditLogs,
  AdminDashboardStats,
} from './types';

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
  media_ids?: string[];
  media_keys?: string[];
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  condition?: string;
  authenticity_status?: string;
  status?: string;
  media_ids?: string[];
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

export async function adminGetListings(params: { limit?: number; page?: number; status?: string } = {}): Promise<{ data: Listing[]; total: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.page !== undefined) query.set('page', String(params.page));
  const qs = query.toString();
  return apiRequest<{ data: Listing[]; total: number }>(`/admin/listings${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function adminCreateListing(payload: CreateListingPayload): Promise<Listing> {
  const { media_ids, media_keys, ...rest } = payload;
  const dto = { ...rest, currency: 'INR', media_keys };
  
  return apiRequest<Listing>('/admin/listings', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function adminUpdateListing(
  id: string,
  payload: UpdateListingPayload,
): Promise<Listing> {
  const { media_ids, ...rest } = payload;
  
  return apiRequest<Listing>(`/admin/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(rest),
  });
}

export async function adminAddImage(
  listingId: string,
  payload: AddImagePayload,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminRemoveImage(
  listingId: string,
  imageId: string,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export async function adminReorderImages(
  listingId: string,
  payload: ReorderImagesPayload,
): Promise<void> {
  return apiRequest<void>(`/admin/listings/${listingId}/images/reorder`, {
    method: 'PATCH',
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
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminDeactivateCategory(id: string): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/admin/categories/${id}`, {
    method: 'DELETE',
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
    body: JSON.stringify(payload),
  });
}

export async function adminAdjustStock(
  listingId: string,
  payload: AdjustStockPayload,
): Promise<void> {
  return apiRequest<void>(`/admin/inventory/${listingId}/stock`, {
    method: 'PATCH',
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
  });
}

export async function adminGetOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${orderId}`, {
    method: 'GET',
  });
}

export async function adminUpdateOrderStatus(
  orderId: string,
  payload: AdminUpdateOrderStatusPayload,
): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
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
  });
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return apiRequest<AdminDashboardStats>('/admin/dashboard/stats', {
    method: 'GET',
  });
}

// ─── Admin Audit Logs ────────────────────────────────────────────────────────

export interface AuditLogParams {
  entity_type?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(
  params: AuditLogParams = {},
): Promise<PaginatedAuditLogs> {
  const query = new URLSearchParams();
  if (params.entity_type) query.set('entity_type', params.entity_type);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiRequest<any>(`/admin/audit-logs${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
  
  // Map backend AuditLog entity to frontend PaginatedAuditLogs shape
  return {
    ...res,
    data: (res.data || []).map((log: any) => ({
      id: log.id,
      timestamp: log.created_at,
      actor: log.actor_id || "System",
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      changes: {
        Data: { 
          before: log.before_snapshot ? JSON.stringify(log.before_snapshot) : "none", 
          after: log.after_snapshot ? JSON.stringify(log.after_snapshot) : "none" 
        }
      }
    }))
  };
}
