import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import CartItemCard from "../components/Cart-components/CartItemCard";
import OrderSummary from "../components/Cart-components/OrderSummary";
import RecommendedProducts from "../components/Cart-components/RecommendedProducts";
import { useToast } from '../hooks/useToast';
import CartToast from '../components/ui/CartToast';

import { getListings } from "../api/listings";
import type { CartApiItem } from "../api/types";
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
  available_qty?: number;
  expiresAt?: string | null;
}

function mapApiCartItem(item: CartApiItem): CartItem {
  return {
    id: item.id,
    listingId: item.listing_id,
    listing_id: item.listing_id,
    name: item.title,
    // TODO: store type in CartApiItem when backend cart module is added
    type: 'Eau de Parfum',
    price: parseFloat(item.price),
    quantity: item.qty,
    image: item.image_url,
    notes: item.notes,
    inStock: item.in_stock,
    available_qty: (item as any).available_qty ?? undefined,
    expiresAt: item.expires_at,
  };
}

export default function Cart() {
  const { items: ctxItems, updateQty: contextUpdateQty, removeItem: contextRemoveItem, lastMutationError } = useCart();
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (lastMutationError) {
      addToast(lastMutationError, 'error', 5000);
    }
  }, [lastMutationError]);
  const cartItems = ctxItems.map(mapApiCartItem);
  const availableItems = cartItems.filter(i => i.inStock !== false);
  const unavailableItems = cartItems.filter(i => i.inStock === false);
  const cartLoading = false;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const updateQuantity = async (id: string, qty: number) => {
    contextUpdateQty(id, qty);
  };

  const removeItem = async (id: string) => {
    contextRemoveItem(id);
  };

  const subtotal = availableItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const { data: recommendedData } = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: () => getListings({ limit: 3 }),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    retry: 1,
  });

  const recommendedProducts = (recommendedData?.data ?? []).map((listing: any) => ({
    id: listing.id,
    name: listing.title,
    price: parseFloat(listing.price),
    type: listing.category?.name ?? 'Parfum',
    image: getImageUrl(listing.images?.[0]?.storage_key ?? listing.image_url),
  }));

  const isCartValid = availableItems.length > 0;

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
                {availableItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </div>
              {unavailableItems.length > 0 && (
                <div className="mt-6 border border-rose-500/20 rounded-lg">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-xs uppercase tracking-widest text-rose-400/80">
                      Currently Unavailable
                    </p>
                  </div>
                  {unavailableItems.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                    />
                  ))}
                </div>
              )}
              <RecommendedProducts products={recommendedProducts} />
            </div>

            {/* Order Summary — visible on all breakpoints */}
            <div>
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
      <CartToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
