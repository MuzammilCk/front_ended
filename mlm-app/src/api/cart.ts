// src/api/cart.ts
// Cart reservation API — add/remove/update items, fetch cart.

import { apiRequest } from './client';
import type { CartResponse, CartApiItem } from './types';

export async function getCart(): Promise<CartResponse> {
  return apiRequest<CartResponse>('/cart', {
    method: 'GET',
  });
}

export async function addToCart(
  skuId: string,
  qty: number,
): Promise<CartApiItem> {
  return apiRequest<CartApiItem>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ sku_id: skuId, qty }),
  });
}

export async function updateCartItemQty(
  itemId: string,
  qty: number,
): Promise<CartApiItem> {
  return apiRequest<CartApiItem>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  });
}

export async function removeCartItem(itemId: string): Promise<void> {
  return apiRequest<void>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}
