import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import CartItemCard from "../components/Cart-components/CartItemCard";
import OrderSummary from "../components/Cart-components/OrderSummary";
import RecommendedProducts from "../components/Cart-components/RecommendedProducts";

import { createOrder, listOrders } from "../api/orders";
import { getListings } from "../api/listings";
import { ApiError } from "../api/client";
import type { Order, CartApiItem } from "../api/types";
import { useCart } from "../context/CartContext";

import { ShoppingBag, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Alert } from "../components/ui/Alert";

interface CartItem {
  id: string;
  listingId: string;
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Cart() {
  const { items: ctxItems, updateQty: contextUpdateQty, removeItem: contextRemoveItem, clearCart } = useCart();
  const cartItems = ctxItems.map(mapApiCartItem);
  const cartLoading = false;
  const cartError = "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  type CheckoutStep = 'cart' | 'address' | 'confirmed';
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');

  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const idempotencyKeyRef = useRef<string>(generateUUID());

  useEffect(() => {
    idempotencyKeyRef.current = generateUUID();
  }, [cartItems.map((i) => `${i.listingId}:${i.quantity}`).join(",")]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!shippingForm.name || shippingForm.name.length < 2) errors.name = "Name is required (min 2 chars)";
    if (!shippingForm.phone || !/^\+?[0-9]{10,13}$/.test(shippingForm.phone)) errors.phone = "Valid phone number required";
    if (!shippingForm.line1) errors.line1 = "Address line 1 is required";
    if (!shippingForm.city) errors.city = "City is required";
    if (!shippingForm.state) errors.state = "State is required";
    if (!shippingForm.postal_code || !/^[0-9]{6}$/.test(shippingForm.postal_code)) errors.postal_code = "Valid 6-digit PIN code required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch
  useEffect(() => {
    // Hydration happens via CartContext
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
    contextUpdateQty(id, qty);
  };

  const removeItem = async (id: string) => {
    contextRemoveItem(id);
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

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (checkoutStep === 'cart') {
      setCheckoutStep('address');
      return;
    }
    
    if (checkoutStep === 'address' && !validateForm()) return;

    setCheckoutError("");
    setCheckoutLoading(true);
    const idempotencyKey = idempotencyKeyRef.current;
    try {
      const order = await createOrder(
        {
          items: cartItems.map((item) => ({
            listing_id: item.listingId,
            qty: item.quantity,
          })),
          shipping_address: {
            line1: shippingForm.line1,
            city: shippingForm.city,
            state: shippingForm.state,
            postal_code: shippingForm.postal_code,
            country: "India",
          },
          contact: {
            name: shippingForm.name,
            phone: shippingForm.phone,
          },
          shipping_fee: shipping,
          discount_amount: 0,
        },
        idempotencyKey,
      );
      setLastOrder(order);
      setCheckoutError("");
      setCheckoutStep('confirmed');
      setCheckoutStep('confirmed');
      clearCart();
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
        cartCount={cartItems.length}
        wishlistCount={0}
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
            <span className="text-sm text-muted/80">
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
        ) : checkoutStep === 'confirmed' && lastOrder ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="mb-2 text-3xl text-[#c9a96e]">Order Confirmed!</h2>
            <p className="mb-2 text-xl text-[#e8dcc8]">Order #{lastOrder.id.slice(0, 8)}</p>
            <p className="mb-8 text-muted/80">Your order has been placed successfully.<br/>We will notify you once it ships.</p>
            <div className="flex gap-4">
              <Link to="/product" className="px-6 py-3 bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20 rounded-lg hover:bg-[#c9a96e]/20 transition">Continue Shopping →</Link>
              <Link to="/profile" className="px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg hover:bg-[#c9a96e]/90 transition">View All Orders →</Link>
            </div>
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
        ) : checkoutStep === 'address' ? (
          <div className="max-w-2xl mx-auto p-6 md:p-8 border border-[#c9a96e]/20 rounded-lg bg-[#0a0705]">
            <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-2 text-[#c9a96e]/70 hover:text-[#c9a96e] mb-6 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </button>
            <h2 className="text-2xl text-[#c9a96e] mb-2">Delivery Details</h2>
            <div className="h-px bg-[#c9a96e]/20 mb-6"></div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-[#e8dcc8] mb-1">Full Name*</label>
                  <input type="text" value={shippingForm.name} onChange={(e) => { setShippingForm({...shippingForm, name: e.target.value}); setFormErrors({...formErrors, name: ''}); }} className={`w-full bg-transparent border ${formErrors.name ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#e8dcc8] mb-1">Phone Number*</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted/50">+91</span>
                    <input type="tel" value={shippingForm.phone} onChange={(e) => { let val = e.target.value; if (val && !val.startsWith('+')) val = '+' + val; setShippingForm({...shippingForm, phone: val}); setFormErrors({...formErrors, phone: ''}); }} className={`w-full bg-transparent border ${formErrors.phone ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 pl-10 text-[#e8dcc8] outline-none transition`} placeholder="9876543210" />
                  </div>
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>
              </div>
              
              <h3 className="text-lg text-[#e8dcc8] mt-4 mb-2">Delivery Address</h3>
              
              <div>
                <label className="block text-sm text-[#e8dcc8] mb-1">Line 1 / Street*</label>
                <input type="text" value={shippingForm.line1} onChange={(e) => { setShippingForm({...shippingForm, line1: e.target.value}); setFormErrors({...formErrors, line1: ''}); }} className={`w-full bg-transparent border ${formErrors.line1 ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                {formErrors.line1 && <p className="text-red-500 text-xs mt-1">{formErrors.line1}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-[#e8dcc8] mb-1">City*</label>
                  <input type="text" value={shippingForm.city} onChange={(e) => { setShippingForm({...shippingForm, city: e.target.value}); setFormErrors({...formErrors, city: ''}); }} className={`w-full bg-transparent border ${formErrors.city ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#e8dcc8] mb-1">State*</label>
                  <input type="text" value={shippingForm.state} onChange={(e) => { setShippingForm({...shippingForm, state: e.target.value}); setFormErrors({...formErrors, state: ''}); }} className={`w-full bg-transparent border ${formErrors.state ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                  {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#e8dcc8] mb-1">PIN Code*</label>
                  <input type="text" value={shippingForm.postal_code} onChange={(e) => { setShippingForm({...shippingForm, postal_code: e.target.value}); setFormErrors({...formErrors, postal_code: ''}); }} maxLength={6} className={`w-full bg-transparent border ${formErrors.postal_code ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                  {formErrors.postal_code && <p className="text-red-500 text-xs mt-1">{formErrors.postal_code}</p>}
                </div>
              </div>
              
              {checkoutError && <Alert variant="error" className="mt-4">{checkoutError}</Alert>}
              
              <button 
                onClick={handleCheckout} 
                disabled={checkoutLoading}
                className="w-full mt-6 px-6 py-4 bg-[#c9a96e] text-[#0a0705] rounded-lg font-medium hover:bg-[#c9a96e]/90 transition disabled:opacity-50"
              >
                {checkoutLoading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
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
            <OrderSummary
              subtotal={subtotal}
              shipping={shipping}
              onCheckout={() => setCheckoutStep('address')}
              loading={checkoutLoading}
              disabled={cartItems.length === 0 || checkoutLoading}
              error={checkoutError}
              lastOrderId={lastOrder ? lastOrder.id : null}
            />
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
                  <span className="text-muted/60 font-mono">
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
