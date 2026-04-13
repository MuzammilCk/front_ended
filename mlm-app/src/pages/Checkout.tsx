import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { createOrder } from "../api/orders";
import { ApiError } from "../api/client";
import type { Order, CartApiItem } from "../api/types";
import { useCart } from "../context/CartContext";
import { Alert } from "../components/ui/Alert";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "../constants/cart.constants";
import Sidebar from "../components/Sidebar";

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

export default function Checkout() {
  const navigate = useNavigate();
  const { items: ctxItems, clearCart } = useCart();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'address' | 'confirmed'>('address');

  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pinLoading, setPinLoading] = useState(false);

  const idempotencyKeyRef = useRef<string>(generateUUID());

  // Prevent accessing checkout with empty cart
  useEffect(() => {
    if (ctxItems.length === 0 && checkoutStep !== 'confirmed') {
      navigate('/cart');
    }
  }, [ctxItems, navigate, checkoutStep]);

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
    setShippingForm({ ...shippingForm, postal_code: val });
    setFormErrors({ ...formErrors, postal_code: '' });

    if (val.length === 6 && /^[0-9]{6}$/.test(val)) {
      setPinLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        
        if (data && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
           const postOffice = data[0].PostOffice[0];
           setShippingForm(prev => ({
             ...prev,
             city: postOffice.District,
             state: postOffice.State
           }));
           setFormErrors(prev => ({ ...prev, city: '', state: '' }));
        } else {
           setFormErrors(prev => ({ ...prev, postal_code: "Invalid PIN" }));
        }
      } catch (e) {
        setFormErrors(prev => ({ ...prev, postal_code: "Could not lookup PIN" }));
      } finally {
        setPinLoading(false);
      }
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setCheckoutError("");
    setCheckoutLoading(true);
    
    // Process items matching API specs perfectly
    const cartItems = ctxItems.map((item: CartApiItem) => ({
      listingId: item.listing_id,
      quantity: item.qty,
      price: parseFloat(item.price)
    }));

    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

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
      setCheckoutError("");
      setCheckoutStep('confirmed');
      clearCart();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setCheckoutError("Some items are out of stock. Please refresh your cart.");
        } else if (err.status === 422 || (err.body && typeof err.body === 'string' && err.body.includes('price'))) {
          setCheckoutError("A product's price has changed since you added it. Please return to your cart and review the updated prices.");
        } else {
          setCheckoutError(err.body || "Checkout failed. Please try again.");
        }
        // Business errors: keep the same idempotency key (server rejected cleanly)
      } else {
        // Fix B2: Network error — the request may not have reached the server.
        // Regenerate the idempotency key so retry creates a fresh order attempt
        // instead of being permanently stuck on the old key.
        idempotencyKeyRef.current = generateUUID();
        setCheckoutError("Network error during checkout. Please try again.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 p-4 flex items-center justify-between">
         <button
          type="button"
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10"
         >
           <svg className="w-6 h-6 text-[#e8dcc8]" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
         <span className="text-sm text-[#c9a96e]">Checkout</span>
      </div>

      <div className="relative px-4 py-8 mx-auto max-w-7xl md:px-8 md:py-12 flex justify-center">
        {checkoutStep === 'confirmed' && lastOrder ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="mb-2 text-3xl text-[#c9a96e]">Order Confirmed!</h2>
            <p className="mb-2 text-xl text-[#e8dcc8]">Order #{lastOrder.id.slice(0, 8)}</p>
            <p className="mb-8 text-white/50">Your order has been placed successfully.<br/>We will notify you once it ships.</p>
            <div className="flex gap-4">
              <Link to="/product" className="px-6 py-3 bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20 rounded-lg hover:bg-[#c9a96e]/20 transition">Continue Shopping →</Link>
              <Link to="/profile" className="px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg hover:bg-[#c9a96e]/90 transition">View All Orders →</Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl p-6 md:p-8 border border-[#c9a96e]/20 rounded-lg bg-[#0a0705]">
            <Link to="/cart" className="flex items-center gap-2 text-[#c9a96e]/70 hover:text-[#c9a96e] mb-6 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>
            <h2 className="text-2xl text-[#c9a96e] mb-2">Delivery Details</h2>
            <div className="h-px bg-[#c9a96e]/20 mb-6" />
            
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
              
              <h3 className="text-lg text-[#e8dcc8] mt-4 mb-2">Delivery Address</h3>
              
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
        )}
      </div>
    </div>
  );
}
