// src/api/payments.ts
// Payment intent creation.
// Endpoint: POST /orders/:orderId/payment-intent
// Note: The Stripe webhook endpoint is server-side only — not called from frontend.

import { apiRequest } from './client';
import type { PaymentIntentResponse } from './types';

export interface CreatePaymentIntentPayload {
  idempotency_key: string; // UUID — exact field from CreatePaymentIntentDto
}

export async function createPaymentIntent(
  orderId: string,
  payload: CreatePaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  return apiRequest<PaymentIntentResponse>(`/orders/${orderId}/payment-intent`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

