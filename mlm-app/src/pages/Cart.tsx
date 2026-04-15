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

import { ShoppingBag, ArrowLeft, ShieldCheck } from "lucide-react";
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
    if (lastMutationError) addToast(lastMutationError, 'error', 5000);
  }, [lastMutationError]);

  const cartItems = ctxItems.map(mapApiCartItem);
  const availableItems = cartItems.filter(i => i.inStock !== false);
  const unavailableItems = cartItems.filter(i => i.inStock === false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const updateQuantity = async (id: string, qty: number) => contextUpdateQty(id, qty);
  const removeItem = async (id: string) => contextRemoveItem(id);

  const subtotal = availableItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const { data: recommendedData } = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: () => getListings({ limit: 4 }), // Fetched 4 for better carousel feel
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const recommendedProducts = (recommendedData?.data ??[]).map((listing: any) => ({
    id: listing.id,
    name: listing.title,
    price: parseFloat(listing.price),
    type: listing.category?.name ?? 'Parfum',
    image: getImageUrl(listing.images?.[0]?.storage_key ?? listing.image_url),
  }));

  const isCartValid = availableItems.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif pb-28 md:pb-12">
      <Sidebar
        cartCount={cartItems.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-[#0a0705]/90 backdrop-blur-xl border-b border-[#c9a96e]/10 p-4 md:px-8 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 -ml-2 text-white/70 hover:text-white transition rounded-lg hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/product" className="hidden md:flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest text-[#c9a96e]/70 hover:text-[#c9a96e] transition">
            <ArrowLeft className="w-3 h-3" /> Continue Shopping
          </Link>
        </div>
        
        <Link to="/" className="font-display text-2xl tracking-[0.2em] text-[#e8dcc8] absolute left-1/2 -translate-x-1/2">
          HADI
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-[#c9a96e]">
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden md:inline tabular-nums">{cartItems.reduce((s, i) => s + i.quantity, 0)} Items</span>
        </div>
      </div>

      {/* Subtle Grain Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')" }} />

      <main className="relative z-10 px-4 py-8 mx-auto max-w-[1400px] md:px-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-light font-display text-[#e8dcc8] tracking-tight">
            Shopping <span className="text-[#c9a96e] italic">Cart</span>
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center justify-center border border-[#c9a96e]/10 rounded-2xl bg-[#0d0a07]">
            <div className="w-20 h-20 rounded-full bg-[#c9a96e]/5 flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-[#c9a96e]/40" />
            </div>
            <h2 className="mb-3 text-2xl font-display text-[#e8dcc8]">Your cart is empty</h2>
            <p className="text-white/40 font-sans font-light mb-8 max-w-sm">
              Discover your signature scent from our exclusive collection.
            </p>
            <Link
              to="/product"
              className="px-8 py-3.5 bg-[#c9a96e] text-[#0a0705] text-xs font-medium uppercase tracking-widest rounded-lg hover:bg-[#e8c87a] transition-all shadow-[0_0_20px_rgba(201,169,110,0.15)]"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:gap-12 xl:grid-cols-12 items-start">
            {/* Left Column: Cart Items */}
            <div className="xl:col-span-8 flex flex-col gap-8">
              <div className="border border-[#c9a96e]/15 rounded-xl overflow-hidden shadow-2xl bg-[#0d0a07]">
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
                <div className="border border-rose-500/20 rounded-xl overflow-hidden bg-[#0d0a07]">
                  <div className="px-6 py-4 bg-rose-500/5 border-b border-rose-500/10">
                    <p className="text-xs uppercase tracking-[0.2em] font-medium text-rose-400">
                      Currently Unavailable
                    </p>
                  </div>
                  <div className="opacity-60 grayscale-[50%]">
                    {unavailableItems.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Summary (Hidden on Mobile, sticky handling handled inside) */}
            <div className="hidden md:block xl:col-span-4 xl:row-span-2 self-stretch">
               <div className="sticky top-24">
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
            
            {/* Product Recommendations Gallery (Auto-places below Cart Items on Desktop) */}
            <div className="xl:col-span-8">
              <RecommendedProducts products={recommendedProducts} />
            </div>
          </div>
        )}
      </main>

      {/* MNC Fix: Floating Mobile Checkout Pill (Apple/Linear Style) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden animate-[slideInUp_0.4s_ease-out]">
          <div className="bg-[#111]/90 backdrop-blur-xl border border-[#c9a96e]/30 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(201,169,110,0.2)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#c9a96e]" /> Secure Total
              </span>
              <span className="text-xl font-serif text-[#c9a96e] tabular-nums mt-0.5">
                ₹ {(subtotal + shipping).toLocaleString('en-IN')}
              </span>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              disabled={!isCartValid}
              className="px-8 py-3.5 bg-[#c9a96e] text-[#0a0705] tracking-widest uppercase font-medium text-xs rounded-xl hover:bg-[#e8c87a] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(201,169,110,0.2)]"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
      <CartToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
