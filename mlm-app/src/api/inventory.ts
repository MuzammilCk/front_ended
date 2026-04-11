// src/api/inventory.ts
// Inventory reservation API — cart item operations.

import { apiRequest } from './client';
import type { CartApiItem } from './types';

/**
 * Add item to cart with backend inventory reservation.
 * Throws ApiError with status 409 if out of stock.
 */
export async function addToCartReservation(
  skuId: string,
  qty: number,
): Promise<CartApiItem> {
  return apiRequest<CartApiItem>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ sku_id: skuId, qty }),
  });
}
