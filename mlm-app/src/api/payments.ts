// src/api/payments.ts
// Payment intent creation + verification.
// Endpoint: POST /payments/intent, POST /payments/verify
// Note: The Stripe webhook endpoint is server-side only — not called from frontend.

import { apiRequest } from './client';
import type { PaymentIntentResponse } from './types';

export interface CreatePaymentIntentPayload {
  idempotency_key: string;
  // DO NOT add order_id here, as it's passed as a separate argument from the UI.
}

export async function createPaymentIntent(
  orderId: string,
  payload: CreatePaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  // Inject the orderId directly into the JSON body payload
  const requestBody = {
    ...payload,
    order_id: orderId,
  };
  return apiRequest<PaymentIntentResponse>(`/payments/intent`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

/**
 * Synchronous payment verification fallback.
 * Call this after stripe.confirmPayment() succeeds to ensure
 * the backend order transitions to PAID even if the webhook is delayed.
 */
export async function verifyPayment(
  orderId: string,
): Promise<{ status: string; synced: boolean }> {
  return apiRequest<{ status: string; synced: boolean }>(`/payments/verify`, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
}

import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
export const stripePromise = loadStripe(stripePublishableKey);
