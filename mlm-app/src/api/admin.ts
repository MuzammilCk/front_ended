// src/api/admin.ts
// Admin API surface — listings, inventory, orders, network, compensation.
// All endpoints under /admin/* require JWT authentication with admin role.
// Authorization is handled centrally by client.ts Bearer token.

import { apiRequest, ApiError } from './client';
import type {
  Listing,
  ProductCategory,
  Order,
  PaginatedOrders,
  GraphCorrectionLog,
  PaginatedAuditLogs,
  AdminDashboardStats,
  Dispute,
  ReturnRequest,
  FraudSignal,
  PayoutRequest,
  LedgerEntry,
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

export async function adminGetCategories(): Promise<ProductCategory[]> {
  return apiRequest<ProductCategory[]>('/admin/categories', { method: 'GET' });
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

// ─── Admin Homepage CMS ──────────────────────────────────────────────────────

export interface UpsertHomepageSectionPayload {
  content: Record<string, any>;
  media_ids?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export async function adminGetHomepageSections(): Promise<any[]> {
  return apiRequest<any[]>('/admin/homepage', { method: 'GET' });
}

export async function adminUpsertHomepageSection(
  sectionKey: string,
  payload: UpsertHomepageSectionPayload,
): Promise<any> {
  return apiRequest<any>(`/admin/homepage/${sectionKey}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ─── Admin Network Tree ─────────────────────────────────────────────────────

export interface AdminDownlineNode {
  userId: string;
  depth: number;
  sponsorId: string | null;
  directCount: number;
}

export interface AdminDownlineResponse {
  rootNode: {
    userId: string;
    depth: number;
    sponsorId: string | null;
    directCount: number;
    totalDownline: number;
  };
  data: AdminDownlineNode[];
  total: number;
  page: number;
  limit: number;
}

export async function adminGetDownline(
  userId: string,
  params: { maxDepth?: number; page?: number; limit?: number } = {},
): Promise<AdminDownlineResponse> {
  const query = new URLSearchParams();
  if (params.maxDepth !== undefined) query.set('maxDepth', String(params.maxDepth));
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest<AdminDownlineResponse>(
    `/admin/network/${userId}/downline${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  );
}

export async function adminGetNetworkNode(userId: string): Promise<any> {
  return apiRequest<any>(`/admin/network/${userId}/node`, { method: 'GET' });
}

export async function adminGetUserQualification(userId: string): Promise<any> {
  return apiRequest<any>(`/admin/network/${userId}/qualification`, { method: 'GET' });
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

// ─── Admin Trust & Safety ──────────────────────────────────────────────────

// ─ Disputes ──────────────────────────────────────────────────────────────────

/**
 * List all disputes with optional status/pagination filters.
 * GET /admin/disputes?status=&page=&limit=
 */
export async function adminListDisputes(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: Dispute[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<{ data: Dispute[]; total: number; page: number; limit: number }>(
      `/admin/disputes${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Resolve a dispute.
 * PATCH /admin/disputes/:id/resolve
 * Body: { resolution: DisputeResolution, note?: string }
 */
export async function adminResolveDispute(
  disputeId: string,
  payload: { resolution: string; note?: string },
): Promise<Dispute> {
  try {
    return apiRequest<Dispute>(`/admin/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Escalate a dispute.
 * POST /admin/disputes/:id/escalate
 * Body: { note?: string }
 */
export async function adminEscalateDispute(
  disputeId: string,
  note?: string,
): Promise<Dispute> {
  try {
    return apiRequest<Dispute>(`/admin/disputes/${disputeId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Close a dispute.
 * POST /admin/disputes/:id/close
 * Body: { note?: string }
 */
export async function adminCloseDispute(
  disputeId: string,
  note?: string,
): Promise<Dispute> {
  try {
    return apiRequest<Dispute>(`/admin/disputes/${disputeId}/close`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

// ─ Returns ───────────────────────────────────────────────────────────────────

/**
 * List return requests with optional filters.
 * GET /admin/returns?status=&page=&limit=
 */
export async function adminListReturns(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: ReturnRequest[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<{ data: ReturnRequest[]; total: number; page: number; limit: number }>(
      `/admin/returns${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Approve a return request.
 * POST /admin/returns/:id/approve
 * Body: { note?: string }
 */
export async function adminApproveReturn(
  returnId: string,
  note?: string,
): Promise<ReturnRequest> {
  try {
    return apiRequest<ReturnRequest>(`/admin/returns/${returnId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Reject a return request.
 * POST /admin/returns/:id/reject
 * Body: { note?: string }
 */
export async function adminRejectReturn(
  returnId: string,
  note?: string,
): Promise<ReturnRequest> {
  try {
    return apiRequest<ReturnRequest>(`/admin/returns/${returnId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Mark a return request as completed.
 * POST /admin/returns/:id/complete
 * Body: { note?: string }
 */
export async function adminCompleteReturn(
  returnId: string,
  note?: string,
): Promise<ReturnRequest> {
  try {
    return apiRequest<ReturnRequest>(`/admin/returns/${returnId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

// ─ Fraud Signals ───────────────────────────────────────────────────────────

/**
 * List fraud signals with optional filters.
 * GET /admin/fraud-signals?status=&user_id=&page=&limit=
 * Note: backend filters by `status` (new/reviewed/actioned/false_positive),
 * not by `severity`/`risk_level`.
 */
export async function adminListFraudSignals(params: {
  status?: string;
  user_id?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: FraudSignal[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.user_id) query.set('user_id', params.user_id);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<{ data: FraudSignal[]; total: number; page: number; limit: number }>(
      `/admin/fraud-signals${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Review / action a fraud signal.
 * POST /admin/fraud-signals/:id/review
 * Body: { verdict: 'actioned' | 'false_positive', note?: string }
 *
 * Note: backend only supports 'actioned' and 'false_positive' verdicts.
 * For ban/suspend workflows use the user-management endpoints instead.
 */
export async function adminReviewFraudSignal(
  signalId: string,
  verdict: 'actioned' | 'false_positive',
  note?: string,
): Promise<FraudSignal> {
  try {
    return apiRequest<FraudSignal>(`/admin/fraud-signals/${signalId}/review`, {
      method: 'POST',
      body: JSON.stringify({ verdict, note }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

// ─── Admin Finance ────────────────────────────────────────────────────────────

// ─ Payouts ───────────────────────────────────────────────────────────────────

/**
 * List payout requests with optional filters.
 * GET /admin/payouts?status=&page=&limit=&user_id=
 */
export async function adminListPayouts(params: {
  status?: string;
  user_id?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: PayoutRequest[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.user_id) query.set('user_id', params.user_id);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<{ data: PayoutRequest[]; total: number; page: number; limit: number }>(
      `/admin/payouts${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Approve a payout request.
 * POST /admin/payouts/:id/approve
 */
export async function adminApprovePayout(payoutId: string): Promise<PayoutRequest> {
  try {
    return apiRequest<PayoutRequest>(`/admin/payouts/${payoutId}/approve`, {
      method: 'POST',
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

/**
 * Reject a payout request (backend has no on_hold state; rejection is the
 * closest equivalent to "holding" a payout).
 * POST /admin/payouts/:id/reject
 * Body: { reason: string }
 */
export async function adminRejectPayout(
  payoutId: string,
  reason: string,
): Promise<PayoutRequest> {
  try {
    return apiRequest<PayoutRequest>(`/admin/payouts/${payoutId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}

// ─ Ledger ─────────────────────────────────────────────────────────────────────

/**
 * Fetch ledger history for a specific user (admin view).
 * GET /wallet/ledger?user_id=<userId>&page=&limit=&entry_type=
 * The LedgerService.adminGetLedgerEntries() is called by the wallet controller
 * which accepts `user_id` as a query parameter when the caller is an admin.
 */
export async function adminGetUserLedger(
  userId: string,
  params: {
    page?: number;
    limit?: number;
    entry_type?: string;
    status?: string;
  } = {},
): Promise<{ data: LedgerEntry[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    query.set('user_id', userId);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.entry_type) query.set('entry_type', params.entry_type);
    if (params.status) query.set('status', params.status);
    return apiRequest<{ data: LedgerEntry[]; total: number; page: number; limit: number }>(
      `/wallet/ledger?${query.toString()}`,
      { method: 'GET' },
    );
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(0, String(err));
  }
}
