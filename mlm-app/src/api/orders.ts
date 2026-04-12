// src/api/orders.ts
// Order lifecycle — reservation, checkout, history, cancellation.
// Endpoints:
//   POST   /inventory/reserve
//   POST   /inventory/reserve/:id/confirm
//   DELETE /inventory/reserve/:id
//   POST   /orders              (requires Idempotency-Key header)
//   GET    /orders
//   GET    /orders/:id
//   DELETE /orders/:id

import { apiRequest } from './client';
import type {
  InventoryReservation,
  Order,
  OrderWithItems,
  PaginatedOrders,
} from './types';

// ─── Inventory Reservation ───────────────────────────────────────────────────

export interface ReserveStockPayload {
  listingId: string; // UUID — exact field name from ReserveStockDto
  qty: number;
  ttlSeconds?: number; // 60–3600, default 900 (15 min)
}

export async function reserveStock(payload: ReserveStockPayload): Promise<InventoryReservation> {
  return apiRequest<InventoryReservation>('/inventory/reserve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmReservation(
  reservationId: string,
  orderId: string,
): Promise<InventoryReservation> {
  return apiRequest<InventoryReservation>(`/inventory/reserve/${reservationId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function releaseReservation(reservationId: string): Promise<void> {
  return apiRequest<void>(`/inventory/reserve/${reservationId}`, {
    method: 'DELETE',
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItemPayload {
  listing_id: string; // UUID — exact field from CreateOrderDto.items
  qty: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  contact: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  shipping_fee?: number;
  tax_amount?: number;
  discount_amount?: number;
}

// idempotencyKey must be a UUID v4 — caller is responsible for generating it
export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<Order> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    } as Record<string, string>,
    body: JSON.stringify(payload),
  });
}

export interface ListOrdersParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export async function listOrders(params: ListOrdersParams = {}): Promise<PaginatedOrders> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.from_date) query.set('from_date', params.from_date);
  if (params.to_date) query.set('to_date', params.to_date);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<PaginatedOrders>(`/orders${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getOrder(orderId: string): Promise<OrderWithItems> {
  return apiRequest<OrderWithItems>(`/orders/${orderId}`, {
    method: 'GET',
  });
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}/cancel`, {
    method: 'POST',
  });
}

