import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import CartItemCard from "../components/Cart-components/CartItemCard";
import OrderSummary from "../components/Cart-components/OrderSummary";
import RecommendedProducts from "../components/Cart-components/RecommendedProducts";

import { listOrders } from "../api/orders";
import { getListingById, getListings } from "../api/listings";
import type { Order, CartApiItem } from "../api/types";
import { useCart } from "../context/CartContext";
import { getImageUrl } from "../utils/imageUrl";

import { ShoppingBag, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Alert } from "../components/ui/Alert";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "../constants/cart.constants";

interface CartItem {
  id: string;
  listingId: string;
  listing_id?: string;
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
    listingId: item.listing_id,
    listing_id: item.listing_id,
    name: item.title,
    // TODO: store type in CartApiItem when backend cart module is added
    type: item.notes?.includes('ml') ? 'Eau de Parfum' : 'Eau de Parfum',
    price: parseFloat(item.price),
    quantity: item.qty,
    image: item.image_url,
    notes: item.notes,
    inStock: item.in_stock,
    expiresAt: item.expires_at,
  };
}

export default function Cart() {
  const { items: ctxItems, updateQty: contextUpdateQty, removeItem: contextRemoveItem } = useCart();
  const cartItems = ctxItems.map(mapApiCartItem);
  const cartLoading = false;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Fetch past orders — only if authenticated
  // Fix B1: listOrders requires a valid JWT. Without this guard, guest users
  // would trigger a 401 error on every Cart page visit.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let cancelled = false;
    listOrders({ limit: 5 })
      .then((result) => {
        if (!cancelled) setPastOrders(result.data);
      })
      .catch(() => {
        // Silently fail
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateQuantity = async (id: string, qty: number) => {
    contextUpdateQty(id, qty);
  };

  const removeItem = async (id: string) => {
    contextRemoveItem(id);
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    getListings({ limit: 3 })
      .then((result) => {
        if (!cancelled) {
          setRecommendedProducts(
            result.data.map((listing: any) => ({
              id: listing.id,
              name: listing.title,
              price: parseFloat(listing.price),
              type: listing.category?.name ?? 'Parfum',
              image: getImageUrl(listing.images?.[0]?.storage_key ?? listing.image_url),
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

  const { data: liveInventory } = useQuery({
    queryKey: ['cart-inventory', cartItems.map(i => i.listingId)],
    queryFn: async () => {
      const results = await Promise.all(
        cartItems.map(i => getListingById(i.listingId))
      );
      
      const inventory: Record<string, { status: string; qty: number }> = {};
      results.forEach((res: any) => {
        const item = res?.data ? res.data : res;
        if (item && item.id) {
          inventory[item.id] = { 
            status: item.status, 
            qty: item.quantity 
          };
        }
      });
      return inventory;
    },
    enabled: cartItems.length > 0,
    refetchInterval: 60000,
  });

  const isCartValid = !liveInventory ? true : cartItems.every(i => liveInventory[i.listingId]?.status === 'active');

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif pb-24 md:pb-0">
      <Sidebar
        cartCount={cartItems.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg className="w-6 h-6 text-[#e8dcc8]" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm text-[#c9a96e]">Cart</span>
      </div>

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
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c9a96e]" />
            <span className="text-sm text-white/50">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>
        </div>

        <h1 className="mb-8 text-3xl md:text-4xl">
          Shopping <span className="text-[#c9a96e]">Cart</span>
        </h1>

        {!isCartValid && (
          <div className="mb-8">
            <Alert variant="error">
              One or more items in your cart are no longer available. Please review your cart.
            </Alert>
          </div>
        )}

        {cartLoading ? (
          <div className="py-20 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-[#c9a96e]/10 rounded-full" />
              <div className="h-4 w-32 bg-[#c9a96e]/10 rounded" />
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="w-20 h-20 mx-auto text-[#c9a96e]/30 mb-6" />
            <h2 className="mb-2 text-2xl">Your cart is empty</h2>
            <Link
              to="/product"
              className="px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg inline-block hover:bg-[#c9a96e]/90 transition"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="border border-[#c9a96e]/10 rounded-lg">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={{
                      ...item,
                      available_qty: liveInventory?.[item.listingId]?.qty,
                      inStock: liveInventory ? liveInventory[item.listingId]?.status === 'active' : item.inStock
                    }}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </div>
              <RecommendedProducts products={recommendedProducts} />
            </div>

            {/* Desktop Only Order Summary */}
            <div className="hidden md:block">
               <OrderSummary
                 subtotal={subtotal}
                 onCheckout={() => navigate('/checkout')}
                 loading={false}
                 disabled={!isCartValid}
                 error={""}
                 lastOrderId={null}
               />
            </div>
          </div>
        )}

        {pastOrders.length > 0 && (
          <div className="mt-12 border-t border-[#c9a96e]/10 pt-8">
            <h3 className="text-lg mb-4 text-[#e8dcc8]">Recent Orders</h3>
            <div className="space-y-3">
              {pastOrders.map((order) => (
               <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 border border-[#c9a96e]/10 rounded-lg text-sm"
                >
                  <span className="text-white/50 font-mono">
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

      {/* STICKY BOTTOM CHECKOUT TRIGGER (MOBILE ONLY) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0a0705] border-t border-[#c9a96e]/20 z-50 flex items-center justify-between px-6 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Total</span>
            <span className="text-xl font-serif text-[#c9a96e]">INR {(subtotal + shipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <button 
            onClick={() => navigate('/checkout')}
            disabled={!isCartValid}
            className="px-6 h-12 bg-[#c9a96e] text-[#0a0705] tracking-widest uppercase font-medium text-xs hover:bg-[#b0935d] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}
