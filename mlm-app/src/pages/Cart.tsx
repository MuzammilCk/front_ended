import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CartItemCard from "../components/Cart-components/CartItemCard";
import OrderSummary from "../components/Cart-components/OrderSummary";
import RecommendedProducts from "../components/Cart-components/RecommendedProducts";

import { createOrder, listOrders } from "../api/orders";
import { getListings } from "../api/listings";
import { getCart, updateCartItemQty, removeCartItem } from "../api/cart";
import { ApiError } from "../api/client";
import type { Order, CartApiItem } from "../api/types";

import { ShoppingBag, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";

interface CartItem {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  image: string;
  notes: string;
  inStock: boolean;
  expiresAt?: string | null;
}

function mapApiCartItem(item: CartApiItem): CartItem {
  return {
    id: item.id,
    name: item.title,
    type: "Eau de Parfum",
    price: parseFloat(item.price),
    quantity: item.qty,
    image: item.image_url,
    notes: item.notes,
    inStock: item.in_stock,
    expiresAt: item.expires_at,
  };
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Fetch cart from API on mount
  useEffect(() => {
    let cancelled = false;
    setCartLoading(true);
    getCart()
      .then((result) => {
        if (!cancelled) {
          setCartItems(result.items.map(mapApiCartItem));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCartError(err instanceof Error ? err.message : "Failed to load cart");
        }
      })
      .finally(() => {
        if (!cancelled) setCartLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch past orders
  useEffect(() => {
    let cancelled = false;
    listOrders({ limit: 5 })
      .then((result) => {
        if (!cancelled) setPastOrders(result.data);
      })
      .catch(() => {
        // Silently fail — user may not be logged in
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateQuantity = async (id: string, qty: number) => {
    if (qty < 1) return;
    // Optimistic update
    setCartItems((items) =>
      items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
    try {
      await updateCartItemQty(id, qty);
    } catch {
      // Revert on failure — re-fetch cart
      getCart()
        .then((result) => setCartItems(result.items.map(mapApiCartItem)))
        .catch(() => {});
    }
  };

  const removeItem = async (id: string) => {
    setCartItems((items) => items.filter((i) => i.id !== id));
    try {
      await removeCartItem(id);
    } catch {
      // Revert on failure
      getCart()
        .then((result) => setCartItems(result.items.map(mapApiCartItem)))
        .catch(() => {});
    }
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 25;

  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    getListings({ limit: 3 })
      .then((result) => {
        if (!cancelled) {
          setRecommendedProducts(
            result.data.map((listing) => ({
              id: listing.id,
              name: listing.title,
              price: parseFloat(listing.price),
              type: listing.category?.name ?? 'Parfum',
            }))
          );
        }
      })
      .catch(() => {
        // Silently fail
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const generateIdempotencyKey = (): string => {
    const c = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    const bytes = new Uint8Array(16);
    if (c?.getRandomValues) {
      c.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setCheckoutError("");
    setCheckoutLoading(true);
    const idempotencyKey = generateIdempotencyKey();
    try {
      const order = await createOrder(
        {
          items: cartItems.map((item) => ({
            listing_id: String(item.id),
            qty: item.quantity,
          })),
          shipping_address: "Pending — update in profile",
          contact: "Pending",
          shipping_fee: shipping,
          discount_amount: 0,
        },
        idempotencyKey,
      );
      setLastOrder(order);
      setCheckoutError("");
      setCartItems([]); // Clear cart after successful order
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setCheckoutError("Some items are out of stock. Please refresh your cart.");
        } else {
          setCheckoutError(err.body || "Checkout failed. Please try again.");
        }
      } else {
        setCheckoutError("Network error during checkout.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif">
      <Sidebar
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 p-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg
            className="w-6 h-6 text-[#e8dcc8]"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-sm text-[#c9a96e]">Cart</span>
      </div>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-noise" />
      </div>

      <div className="relative px-4 py-8 mx-auto max-w-7xl md:px-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            to="/product"
            className="flex items-center gap-2 py-2 text-[#c9a96e]/70 hover:text-[#c9a96e]"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c9a96e]" />
            <span className="text-sm text-[#c9b99a]/80">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>
        </div>

        <h1 className="mb-8 text-3xl md:text-4xl">
          Shopping <span className="text-[#c9a96e]">Cart</span>
        </h1>

        {cartLoading ? (
          <div className="py-20 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-[#c9a96e]/10 rounded-full" />
              <div className="h-4 w-32 bg-[#c9a96e]/10 rounded" />
            </div>
          </div>
        ) : cartError ? (
          <div className="py-20 text-center">
            <Alert variant="error">{cartError}</Alert>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="w-20 h-20 mx-auto text-[#c9a96e]/30 mb-6" />
              <h2 className="mb-2 text-2xl">Your cart is empty</h2>
            <Link
              to="/product"
              className="px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2">
              {/* Cart Items */}
              <div className="border border-[#c9a96e]/10 rounded-lg">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </div>

              {/* Recommended */}
              <RecommendedProducts products={recommendedProducts} />
            </div>

            {/* RIGHT SIDE */}
            <OrderSummary subtotal={subtotal} shipping={shipping} />

            {/* Checkout section — added below OrderSummary */}
            <div className="mt-4 space-y-3">
              {checkoutError && (
                <Alert variant="error">{checkoutError}</Alert>
              )}

              {lastOrder && (
                <Alert variant="success">
                  Order placed. Reference: {lastOrder.id.slice(0, 8)}…
                </Alert>
              )}

              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading || cartItems.length === 0}
                variant="outlineGold"
                className="w-full py-3 text-sm tracking-widest"
              >
                {checkoutLoading ? "Processing…" : "Place order"}
              </Button>
            </div>
          </div>
        )}

        {/* Past orders from API */}
        {pastOrders.length > 0 && (
          <div className="mt-12 border-t border-[#c9a96e]/10 pt-8">
            <h3 className="text-lg mb-4 text-[#e8dcc8]">Recent Orders</h3>
            <div className="space-y-3">
              {pastOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 border border-[#c9a96e]/10 rounded-lg text-sm"
                >
                  <span className="text-[#c9b99a]/60 font-mono">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-[#c9a96e]">{order.status}</span>
                  <span className="text-[#e8dcc8]">
                    {order.currency} {order.total_amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
