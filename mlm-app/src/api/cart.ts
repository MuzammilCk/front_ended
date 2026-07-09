// src/api/cart.ts
// Dual-mode cart API:
//   - Server-side functions (for authenticated users) → hits /cart endpoints
//   - localStorage functions (for guests) → unchanged from original
// CartContext decides which path to use based on auth state.

import { apiRequest } from './client';
import type { CartApiItem, CartResponse } from './types';
import { CART_STORAGE_KEY } from '../constants/cart.constants';

// ═══════════════════════════════════════════════════════════════════
//  Server-Side Cart API (authenticated users)
// ═══════════════════════════════════════════════════════════════════

/** Shape returned by the server for each cart item (live prices + stock) */
export interface ServerCartItem {
  id: string;
  listing_id: string;
  title: string;
  sku: string;
  price: string;
  qty: number;
  image_url: string;
  available_qty: number;
  in_stock: boolean;
  listing_status: string;
  created_at: string;
  updated_at: string;
}

export interface ServerCartResponse {
  items: ServerCartItem[];
}

/** Fetch the full cart with live prices and stock */
export async function getServerCart(): Promise<ServerCartResponse> {
  return apiRequest<ServerCartResponse>('/cart', { method: 'GET' });
}

/** Add an item to the server cart (upserts if already present) */
export async function addServerCartItem(
  listing_id: string,
  qty: number,
): Promise<ServerCartResponse> {
  return apiRequest<ServerCartResponse>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ listing_id, qty }),
  });
}

/** Update the quantity of a cart item */
export async function updateServerCartItem(
  itemId: string,
  qty: number,
): Promise<ServerCartResponse> {
  return apiRequest<ServerCartResponse>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  });
}

/** Remove a single item from the cart */
export async function removeServerCartItem(itemId: string): Promise<void> {
  return apiRequest<void>(`/cart/items/${itemId}`, { method: 'DELETE' });
}

/** Clear the entire cart on the server */
export async function clearServerCart(): Promise<void> {
  return apiRequest<void>('/cart', { method: 'DELETE' });
}

/** Merge guest localStorage cart items into the server cart on login */
export async function mergeGuestCart(
  items: Array<{ listing_id: string; qty: number }>,
): Promise<ServerCartResponse> {
  return apiRequest<ServerCartResponse>('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Guest Cart (localStorage) — fallback for unauthenticated users
// ═══════════════════════════════════════════════════════════════════

function readCart(): CartApiItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartApiItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartApiItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Remove guest cart items that are missing required fields.
 * This handles the case where an admin-deleted listing left a stale localStorage entry.
 * Does not make any network call.
 */
export function pruneStaleGuestItems(): void {
  try {
    const items = readCart();
    const valid = items.filter(
      (i) =>
        typeof i.listing_id === 'string' &&
        i.listing_id.length > 0 &&
        typeof i.title === 'string' &&
        i.title.length > 0 &&
        typeof i.price === 'string' &&
        parseFloat(i.price) >= 0,
    );
    if (valid.length !== items.length) {
      writeCart(valid);
    }
  } catch {
    // localStorage read/write failure — do nothing
  }
}

export async function getCart(): Promise<CartResponse> {
  return { items: readCart() };
}

export async function addToCart(
  skuId: string,
  qty: number,
  meta?: { title?: string; price?: string; image_url?: string; notes?: string },
): Promise<CartApiItem> {
  const items = readCart();
  const existing = items.find((i) => i.sku_id === skuId || i.listing_id === skuId);

  if (existing) {
    existing.qty += qty;
    writeCart(items);
    return existing;
  }

  const newItem: CartApiItem = {
    id: crypto.randomUUID?.() ?? `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sku_id: skuId,
    listing_id: skuId,
    title: meta?.title ?? 'Product',
    price: meta?.price ?? '0',
    qty,
    image_url: meta?.image_url ?? '',
    notes: meta?.notes ?? '',
    in_stock: true,
    expires_at: null,
  };

  items.push(newItem);
  writeCart(items);
  return newItem;
}

export async function updateCartItemQty(
  itemId: string,
  qty: number,
): Promise<CartApiItem> {
  const items = readCart();
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    throw new Error(`Cart item ${itemId} not found`);
  }

  item.qty = qty;
  writeCart(items);
  return item;
}

export async function removeCartItem(itemId: string): Promise<void> {
  const items = readCart().filter((i) => i.id !== itemId);
  writeCart(items);
}

export function clearLocalCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
}
