import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, AlertTriangle } from "lucide-react";

import { createOrder } from "../api/orders";
import { ApiError } from "../api/client";
import type { Order, CartApiItem } from "../api/types";
import { useCart } from "../context/CartContext";
import { Alert } from "../components/ui/Alert";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "../constants/cart.constants";
import { CheckoutStepCard } from "../components/checkout/CheckoutStepCard";
import { ReservationTimer } from "../components/checkout/ReservationTimer";
import { getImageUrl } from "../utils/imageUrl";

import { useAuth } from '../hooks/useAuth';
import { createPaymentIntent, stripePromise } from '../api/payments';
import { Elements } from '@stripe/react-stripe-js';
import { InlineOtpGate } from '../components/checkout/InlineOtpGate';
import { StripeCheckoutForm } from '../components/checkout/StripeCheckoutForm';

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

type CheckoutStep = 'auth' | 'details' | 'payment' | 'processing' | 'confirmed';

export default function Checkout() {
  const navigate = useNavigate();
  const { items: ctxItems, clearCart } = useCart();
  const { user, userName } = useAuth();
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  
  const [priceGuardModal, setPriceGuardModal] = useState<{
    visible: boolean;
    newTotal: number;
  } | null>(null);
  
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(user ? 'details' : 'auth');

  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingForm, setBillingForm] = useState({
    name: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pinLoading, setPinLoading] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const idempotencyKeyRef = useRef<string>(generateUUID());
  const paymentIdempotencyRef = useRef<string>(generateUUID());
  const skippedAuthRef = useRef(checkoutStep !== 'auth');

  // Prevent accessing checkout with empty cart
  useEffect(() => {
    if (
      ctxItems.length === 0 &&
      checkoutStep !== 'confirmed' &&
      checkoutStep !== 'payment' &&
      checkoutStep !== 'processing'
    ) {
      navigate('/cart');
    }
  }, [ctxItems, navigate, checkoutStep]);

  useEffect(() => {
    const saved = localStorage.getItem('hadi_saved_address');
    if (saved) {
      try {
        setShippingForm(JSON.parse(saved));
      } catch (e) {}
    } else if (user) {
      setShippingForm(prev => ({
        ...prev,
        name: userName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const cartItems = ctxItems.map((item: CartApiItem) => ({
    listingId: item.listing_id,
    quantity: item.qty,
    price: parseFloat(item.price),
  }));
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

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

  const handlePinChange = async (val: string) => {
    setShippingForm(prev => ({ ...prev, postal_code: val }));
    setFormErrors(prev => ({ ...prev, postal_code: '' }));

    if (val.length !== 6 || !/^[0-9]{6}$/.test(val)) return;

    setPinLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s hard timeout

      const res = await fetch(`https://api.postalpincode.in/pincode/${val}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (
        data &&
        Array.isArray(data) &&
        data[0]?.Status === 'Success' &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        setShippingForm(prev => ({
          ...prev,
          city: po.District ?? prev.city,
          state: po.State ?? prev.state,
        }));
        setFormErrors(prev => ({ ...prev, city: '', state: '' }));
      }
      // If status is not Success: silently do nothing — let user fill city/state manually
    } catch (_e) {
      // AbortError or network failure — silently allow manual entry
      // Do NOT set an error on postal_code field; the field is still valid
    } finally {
      setPinLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;

    setCheckoutError("");
    setCheckoutLoading(true);
    
    try {
      const order = await createOrder(
        {
          items: cartItems.map((item) => ({
            listing_id: item.listingId,
            qty: item.quantity,
            expected_unit_price: item.price,
          })),
          shipping_address: {
            line1: shippingForm.line1,
            city: shippingForm.city,
            state: shippingForm.state,
            postal_code: shippingForm.postal_code,
            country: "India",
          },
          billing_address: billingSameAsShipping
            ? {
                line1: shippingForm.line1,
                city: shippingForm.city,
                state: shippingForm.state,
                postal_code: shippingForm.postal_code,
                country: 'India',
              }
            : {
                line1: billingForm.line1,
                city: billingForm.city,
                state: billingForm.state,
                postal_code: billingForm.postal_code,
                country: 'India',
              },
          contact: {
            name: shippingForm.name,
            phone: shippingForm.phone,
          },
          shipping_fee: shipping,
          discount_amount: 0,
        },
        idempotencyKeyRef.current,
      );
      setLastOrder(order);
      
      localStorage.setItem('hadi_saved_address', JSON.stringify(shippingForm));
      
      const intent = await createPaymentIntent(order.id, { idempotency_key: paymentIdempotencyRef.current });
      setClientSecret(intent.clientSecret);
      setCheckoutStep('payment');
      
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setCheckoutError("Some items are out of stock. Please refresh your cart.");
        } else if (err.status === 422 || (err.body && typeof err.body === 'string' && err.body.includes('price'))) {
          // Price change detected — show modal instead of a flat error
          setPriceGuardModal({ visible: true, newTotal: subtotal + shipping });
        } else if (err.status === 503) {
          // Payment provider temporarily unavailable — safe to retry
          paymentIdempotencyRef.current = generateUUID();
          setCheckoutError("Payment processing is temporarily unavailable. Please try again in a moment.");
        } else {
          setCheckoutError(err.body || "Checkout failed. Please try again.");
        }
      } else {
        idempotencyKeyRef.current = generateUUID();
        paymentIdempotencyRef.current = generateUUID();
        setCheckoutError("Network error during checkout. Please try again.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOtpVerified = async (sessionToken: string, phone: string) => {
    setShippingForm(prev => ({ ...prev, phone }));
    setCheckoutStep('details');
  };

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8]" style={{ fontFamily: 'Jost, sans-serif' }}>
      {priceGuardModal?.visible && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#0d0a07] border border-[#c9a96e]/30 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
              {/* AlertTriangle icon from lucide-react */}
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <h3 className="font-serif text-xl text-[#e8dcc8] mb-2">Prices Updated</h3>
            <p className="text-sm text-white/55 mb-6 leading-relaxed">
              One or more products in your order have been repriced since you added them.
              Your new order total is{' '}
              <span className="text-[#c9a96e] font-medium">
                ₹{priceGuardModal.newTotal.toLocaleString('en-IN')}
              </span>
              .
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPriceGuardModal(null);
                  // Refresh cart context so items reflect updated prices
                  // (cart context already re-fetches on mount; user can re-proceed)
                }}
                className="flex-1 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg font-medium hover:bg-[#c9a96e]/90 transition text-sm"
              >
                Accept &amp; Continue
              </button>
              <Link
                to="/cart"
                className="flex-1 py-3 text-center border border-[#c9a96e]/25 text-[#c9a96e] rounded-lg hover:bg-[#c9a96e]/10 transition text-sm"
                onClick={() => setPriceGuardModal(null)}
              >
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-[#c9a96e]/10 bg-[#0a0705]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/cart" className="font-serif text-2xl tracking-[0.25em] text-[#e8dcc8] hover:text-[#c9a96e] transition">
            HADI
          </Link>
          {checkoutStep !== 'confirmed' && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest">
              {[
                { key: 'auth', label: 'Identity' },
                { key: 'details', label: 'Delivery' },
                { key: 'payment', label: 'Payment' },
              ]
              .filter(s => !(skippedAuthRef.current && s.key === 'auth'))
              .map((s, idx, arr) => {
                const stepOrder = skippedAuthRef.current
                  ? ['details', 'payment']
                  : ['auth', 'details', 'payment'];
                const currentIndex = stepOrder.indexOf(checkoutStep);
                const isCompleted = stepOrder.indexOf(s.key) < currentIndex;
                const isActive = s.key === checkoutStep;
                return (
                  <React.Fragment key={s.key}>
                    <span className={isCompleted ? 'text-[#c9a96e]/50 line-through' : isActive ? 'text-[#c9a96e]' : 'text-white/20'}>
                      {s.label}
                    </span>
                    {idx < arr.length - 1 && <span className="text-white/15">›</span>}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-white/35 text-[11px]">
            <Lock size={13} />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {checkoutStep === 'confirmed' && lastOrder ? (
          <div className="max-w-lg mx-auto py-20 text-center flex flex-col items-center">
            {/* Animated checkmark ring */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/5">
              <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-[11px] uppercase tracking-[0.3em] text-[#c9a96e]/60 mb-3">Order Confirmed</p>
            <h2 className="font-serif text-3xl text-[#e8dcc8] mb-2">Thank you.</h2>
            <p className="text-white/45 text-sm mb-1">
              Order #{lastOrder.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-white/35 text-xs mb-10 max-w-xs leading-relaxed">
              Your fragrance is being prepared. We will notify you once it ships.
            </p>

            {/* Order total summary */}
            <div className="w-full bg-[#0d0a07] border border-[#c9a96e]/15 rounded-lg px-6 py-4 mb-8 text-sm">
              <div className="flex justify-between text-white/50 mb-2">
                <span>Order total</span>
                <span className="text-[#c9a96e]">₹{parseFloat(lastOrder.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white/35 text-xs">
                <span>Payment</span>
                <span>Stripe · Paid</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                to="/product"
                className="flex-1 py-3 text-center text-sm border border-[#c9a96e]/20 text-[#c9a96e] rounded-lg hover:bg-[#c9a96e]/8 transition"
              >
                Continue Shopping
              </Link>
              <Link
                to="/profile"
                className="flex-1 py-3 text-center text-sm bg-[#c9a96e] text-[#0a0705] rounded-lg hover:bg-[#d4b97e] transition font-medium"
              >
                View My Orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">

            <div className="lg:col-span-7 space-y-4">
              <div className="lg:hidden bg-[#0d0a07] border border-[#c9a96e]/15 rounded-lg px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#c9a96e] uppercase tracking-widest">Order Total</p>
                  <p className="text-[#e8dcc8] font-serif text-lg">₹{(subtotal + shipping).toLocaleString('en-IN')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                  className="text-xs text-[#c9a96e] underline underline-offset-2"
                >
                  {showMobileSummary ? 'Hide' : `${ctxItems.length} item${ctxItems.length > 1 ? 's' : ''} ›`}
                </button>
              </div>

              {showMobileSummary && (
                <div className="lg:hidden bg-[#0d0a07] border border-[#c9a96e]/15 rounded-lg p-4 space-y-3 -mt-2">
                  {ctxItems.map((item: CartApiItem) => (
                    <div key={item.listing_id} className="flex justify-between items-center text-sm">
                      <span className="text-[#e8dcc8]/80 truncate max-w-[200px]">{item.title ?? 'Product'} × {item.qty}</span>
                      <span className="text-[#c9a96e] shrink-0 ml-2">₹{(parseFloat(item.price) * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#c9a96e]/10 flex justify-between text-xs text-white/50">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                </div>
              )}

              {!skippedAuthRef.current && (
                <CheckoutStepCard
                  stepNum={1}
                  title="Contact Information"
                  isActive={checkoutStep === 'auth'}
                  isCompleted={checkoutStep === 'details' || checkoutStep === 'payment' || checkoutStep === 'processing'}
                  summaryText={user ? user.phone : null}
                >
                  <InlineOtpGate onVerified={handleOtpVerified} />
                </CheckoutStepCard>
              )}

              <CheckoutStepCard
                stepNum={skippedAuthRef.current ? 1 : 2}
                title="Delivery Address"
                isActive={checkoutStep === 'details'}
                isCompleted={checkoutStep === 'payment' || checkoutStep === 'processing'}
                summaryText={
                  shippingForm.line1
                    ? `${shippingForm.name} · ${shippingForm.line1}, ${shippingForm.city} – ${shippingForm.postal_code}`
                    : null
                }
                onEdit={() => {
                  paymentIdempotencyRef.current = generateUUID();
                  setCheckoutStep('details');
                  setCheckoutError('');
                  setClientSecret(null);
                }}
              >
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
                        <span className="absolute left-3 top-3 text-white/40">+91</span>
                        <input type="tel" value={shippingForm.phone} onChange={(e) => { let val = e.target.value; if (val && !val.startsWith('+')) val = '+' + val; setShippingForm({...shippingForm, phone: val}); setFormErrors({...formErrors, phone: ''}); }} className={`w-full bg-transparent border ${formErrors.phone ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 pl-10 text-[#e8dcc8] outline-none transition`} placeholder="9876543210" />
                      </div>
                      {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-serif text-[#e8dcc8] mt-4 mb-2">Delivery Address</h3>
                  
                  <div>
                    <label className="block text-sm text-[#e8dcc8] mb-1">Line 1 / Street*</label>
                    <input type="text" value={shippingForm.line1} onChange={(e) => { setShippingForm({...shippingForm, line1: e.target.value}); setFormErrors({...formErrors, line1: ''}); }} className={`w-full bg-transparent border ${formErrors.line1 ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                    {formErrors.line1 && <p className="text-red-500 text-xs mt-1">{formErrors.line1}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm text-[#e8dcc8] mb-1">PIN Code*</label>
                      <div className="relative">
                        <input type="text" value={shippingForm.postal_code} onChange={(e) => handlePinChange(e.target.value)} maxLength={6} className={`w-full bg-transparent border ${formErrors.postal_code ? 'border-red-500' : 'border-[#c9a96e]/20'} focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition`} />
                        {pinLoading && (
                          <div className="absolute right-3 top-4 w-4 h-4 rounded-full border-2 border-[#c9a96e]/30 border-t-[#c9a96e] animate-spin" />
                        )}
                      </div>
                      {formErrors.postal_code && <p className="text-red-500 text-xs mt-1">{formErrors.postal_code}</p>}
                    </div>
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
                  </div>
                  
                  {/* Billing Address Toggle */}
                  <div className="mt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          billingSameAsShipping
                            ? 'bg-[#c9a96e] border-[#c9a96e]'
                            : 'bg-transparent border-[#c9a96e]/30 group-hover:border-[#c9a96e]/60'
                        }`}
                        onClick={() => setBillingSameAsShipping(!billingSameAsShipping)}
                      >
                        {billingSameAsShipping && (
                          <svg className="w-2.5 h-2.5 text-[#0a0705]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm text-[#e8dcc8]/70 select-none"
                        onClick={() => setBillingSameAsShipping(!billingSameAsShipping)}
                      >
                        Billing address same as delivery address
                      </span>
                    </label>
                  </div>

                  {/* Billing form — only shown when toggle is OFF */}
                  {!billingSameAsShipping && (
                    <div className="mt-4 p-4 border border-[#c9a96e]/15 rounded-lg bg-[#080503] space-y-4">
                      <p className="text-xs text-[#c9a96e] uppercase tracking-widest mb-2">Billing Address</p>
                      <div>
                        <label className="block text-sm text-[#e8dcc8] mb-1">Address Line 1*</label>
                        <input
                          type="text"
                          value={billingForm.line1}
                          onChange={(e) => setBillingForm(prev => ({ ...prev, line1: e.target.value }))}
                          className="w-full bg-transparent border border-[#c9a96e]/20 focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-[#e8dcc8] mb-1">PIN Code*</label>
                          <input
                            type="text"
                            value={billingForm.postal_code}
                            onChange={(e) => setBillingForm(prev => ({ ...prev, postal_code: e.target.value }))}
                            maxLength={6}
                            className="w-full bg-transparent border border-[#c9a96e]/20 focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#e8dcc8] mb-1">City*</label>
                          <input
                            type="text"
                            value={billingForm.city}
                            onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-transparent border border-[#c9a96e]/20 focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#e8dcc8] mb-1">State*</label>
                          <input
                            type="text"
                            value={billingForm.state}
                            onChange={(e) => setBillingForm(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full bg-transparent border border-[#c9a96e]/20 focus:border-[#c9a96e] rounded-lg p-3 text-[#e8dcc8] outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {checkoutError && <Alert variant="error" className="mt-4">{checkoutError}</Alert>}
                  
                  <button 
                    onClick={handleProceedToPayment} 
                    disabled={checkoutLoading}
                    className="w-full mt-6 px-6 py-4 bg-[#c9a96e] text-[#0a0705] rounded-lg font-medium hover:bg-[#c9a96e]/90 transition disabled:opacity-50"
                  >
                    {checkoutLoading ? "Preparing Payment..." : "Continue to Payment →"}
                  </button>
                </div>
              </CheckoutStepCard>

              <CheckoutStepCard
                stepNum={skippedAuthRef.current ? 2 : 3}
                title="Payment"
                isActive={checkoutStep === 'payment' || checkoutStep === 'processing'}
                isCompleted={false}
              >
                {checkoutError && <Alert variant="error" className="mb-4">{checkoutError}</Alert>}
                {checkoutLoading ? (
                  <div className="space-y-3 animate-pulse" aria-label="Loading payment gateway">
                    <div className="h-3 w-1/3 rounded bg-[#c9a96e]/10 mb-4" /> {/* label */}
                    <div className="h-12 rounded-lg bg-[#c9a96e]/8" />           {/* card number */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 rounded-lg bg-[#c9a96e]/8" />        {/* expiry */}
                      <div className="h-12 rounded-lg bg-[#c9a96e]/8" />        {/* cvv */}
                    </div>
                    <div className="h-12 rounded-lg bg-[#c9a96e]/8 mt-2" />     {/* name */}
                    <div className="h-12 rounded-full bg-[#c9a96e]/15 mt-4" />  {/* button */}
                    <p className="text-center text-xs text-white/25 mt-2">Securing your payment gateway…</p>
                  </div>
                ) : clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#c9a96e',
                          colorBackground: '#0d0a07',
                          colorText: '#e8dcc8',
                          colorDanger: '#ef4444',
                          fontFamily: 'Cormorant Garamond, serif',
                          borderRadius: '6px',
                        },
                      },
                    }}
                  >
                    <StripeCheckoutForm
                      orderTotal={subtotal + shipping}
                      onSuccess={() => { clearCart(); setCheckoutStep('confirmed'); }}
                      onError={(msg) => setCheckoutError(msg)}
                    />
                  </Elements>
                ) : null}
              </CheckoutStepCard>

            </div>

            <aside className="hidden lg:block lg:col-span-5">
              <div className="sticky top-[73px] bg-[#0d0a07] border border-[#c9a96e]/20 rounded-lg p-6 space-y-6">

                {/* Reservation timer — only show when step is details, payment, or processing */}
                {(checkoutStep === 'details' || checkoutStep === 'payment' || checkoutStep === 'processing') && (
                  <ReservationTimer ttlSeconds={900} />
                )}

                <h3 className="font-serif text-lg text-[#c9a96e] tracking-wide">Order Summary</h3>

                {/* Cart items list — scrollable if many items */}
                <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#c9a96e]/20">
                  {ctxItems.map((item: CartApiItem) => {
                    const imgSrc = getImageUrl(
                      (item as keyof typeof item & { images?: any[] }).images?.[0]?.storage_key ?? item.image_url ?? undefined
                    );
                    return (
                      <div key={item.listing_id} className="flex gap-3 items-start">
                        {/* Product thumbnail */}
                        <div className="w-14 h-14 shrink-0 bg-[#1a1410] border border-[#c9a96e]/10 rounded overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt={item.title ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#c9a96e]/20 text-xs">–</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#e8dcc8] leading-snug line-clamp-2">{item.title ?? 'Product'}</p>
                          <p className="text-xs text-white/40 mt-0.5">Qty {item.qty}</p>
                        </div>
                        <span className="text-sm text-[#c9a96e] shrink-0 ml-2">
                          ₹{(parseFloat(item.price) * item.qty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm border-t border-[#c9a96e]/15 pt-4">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-emerald-400 text-xs uppercase tracking-wider">Free</span> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-serif text-base text-[#e8dcc8] border-t border-[#c9a96e]/15 pt-3 mt-1">
                    <span>Total</span>
                    <span className="text-[#c9a96e]">₹{(subtotal + shipping).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#c9a96e]/10">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Guaranteed</p>
                  <p className="text-[11px] text-white/40">🔒 256-bit SSL encryption</p>
                  <p className="text-[11px] text-white/40">↩ 14-day free returns</p>
                  <p className="text-[11px] text-white/40">✓ Authentic products, always</p>
                </div>

              </div>
            </aside>

          </div>
        )}
      </main>
    </div>
  );
}
