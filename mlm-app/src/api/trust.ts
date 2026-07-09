// src/api/trust.ts
// User-facing Trust & Safety API — Returns and Disputes.
// Endpoints mirror backend controllers:
//   POST   /returns          → createReturn
//   GET    /returns/my       → listMyReturns
//   GET    /returns/:id      → getReturn
//   POST   /disputes         → openDispute
//   GET    /disputes/my      → listMyDisputes
//   GET    /disputes/:id     → getDispute

import { apiRequest } from './client';
import type { ReturnRequest, Dispute } from './types';

// ─── Reason Code Enums (mirrors backend entity enums exactly) ────────────────

export type ReturnReasonCode =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'damaged'
  | 'other';

export type DisputeReasonCode =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'unauthorized_charge'
  | 'duplicate_charge'
  | 'other';

// Human-readable labels for UI dropdowns
export const RETURN_REASON_LABELS: Record<ReturnReasonCode, string> = {
  defective: 'Defective Product',
  wrong_item: 'Wrong Item Received',
  not_as_described: 'Not As Described',
  damaged: 'Damaged in Transit',
  other: 'Other',
};

export const DISPUTE_REASON_LABELS: Record<DisputeReasonCode, string> = {
  item_not_received: 'Item Not Received',
  item_not_as_described: 'Item Not As Described',
  unauthorized_charge: 'Unauthorized Charge',
  duplicate_charge: 'Duplicate Charge',
  other: 'Other',
};

// ─── Return Payloads ─────────────────────────────────────────────────────────

export interface ReturnItemPayload {
  order_item_id: string;
  quantity: number;
  reason_code?: ReturnReasonCode;
}

export interface CreateReturnPayload {
  order_id: string;
  reason_code: ReturnReasonCode;
  reason_detail?: string;
  items?: ReturnItemPayload[];
  idempotency_key: string; // 8–64 chars
}

// ─── Dispute Payloads ────────────────────────────────────────────────────────

export interface OpenDisputePayload {
  order_id: string;
  reason_code: DisputeReasonCode;
  reason_detail?: string;
  return_request_id?: string;
  idempotency_key: string; // 8–64 chars
}

// ─── Returns API ─────────────────────────────────────────────────────────────

export async function createReturn(payload: CreateReturnPayload): Promise<ReturnRequest> {
  return apiRequest<ReturnRequest>('/returns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMyReturns(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: ReturnRequest[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest<{ data: ReturnRequest[]; total: number; page: number; limit: number }>(
    `/returns/my${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  );
}

export async function getReturn(returnId: string): Promise<ReturnRequest> {
  return apiRequest<ReturnRequest>(`/returns/${returnId}`, {
    method: 'GET',
  });
}

// ─── Disputes API ────────────────────────────────────────────────────────────

export async function openDispute(payload: OpenDisputePayload): Promise<Dispute> {
  return apiRequest<Dispute>('/disputes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMyDisputes(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ data: Dispute[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest<{ data: Dispute[]; total: number; page: number; limit: number }>(
    `/disputes/my${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  );
}

export async function getDispute(disputeId: string): Promise<Dispute> {
  return apiRequest<Dispute>(`/disputes/${disputeId}`, {
    method: 'GET',
  });
}
