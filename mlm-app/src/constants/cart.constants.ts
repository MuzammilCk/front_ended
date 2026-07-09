// src/constants/cart.constants.ts
// Single source of truth for cart-related business rules.
// Every component that references shipping, qty limits, or storage keys MUST import from here.

/** Free shipping threshold in INR */
export const SHIPPING_THRESHOLD = 15_000;

/** Flat shipping fee in INR when below threshold */
export const SHIPPING_FEE = 500;

/** Maximum quantity allowed per cart item */
export const MAX_QTY_PER_ITEM = 10;

/** localStorage key for guest cart data */
export const CART_STORAGE_KEY = 'hadi_cart';

/** localStorage key for guest session flag */
export const GUEST_STORAGE_KEY = 'hadi_guest';
