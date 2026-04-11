// src/api/cart.ts
// Client-side cart backed by localStorage.
// The backend has no cart module — cart state lives entirely in the browser.
// At checkout, cart items are converted to order line-items via POST /orders.

import type { CartApiItem, CartResponse } from './types';

const CART_KEY = 'hadi_cart';

// ─── Internal helpers ────────────────────────────────────────────────────────

function readCart(): CartApiItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartApiItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartApiItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// ─── Public API (same signatures as before) ──────────────────────────────────

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

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}
