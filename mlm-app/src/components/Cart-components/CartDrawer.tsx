import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import gsap from "gsap";
import LuxuryImage from "../ui/LuxuryImage";
import { SHIPPING_THRESHOLD } from "../../constants/cart.constants";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { items, total, removeItem, count } = useCart();
  const navigate = useNavigate();

  const availableTotal = items.reduce(
    (sum, i) => (i.in_stock !== false ? sum + parseFloat(i.price || '0') * i.qty : sum),
    0,
  );
  const progress = Math.min((availableTotal / SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(SHIPPING_THRESHOLD - availableTotal, 0);

  useEffect(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(drawerRef.current, { x: "0%", duration: 0.4, ease: "power3.out" });
      
      // Animate progress bar width on open
      gsap.fromTo(
        ".shipping-progress-fill",
        { width: "0%" },
        { width: `${progress}%`, duration: 0.8, ease: "power2.out", delay: 0.2 }
      );
    } else {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(drawerRef.current, { x: "100%", duration: 0.4, ease: "power3.in" });
    }
  }, [isOpen, progress]);

  return (
    <>
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] invisible opacity-0"
        onClick={onClose}
      />
      <div 
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0705] border-l border-[#2a2a2a] z-[101] shadow-2xl flex flex-col translate-x-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display text-[#e8dcc8] uppercase tracking-widest">Your Cart</h2>
            <span className="bg-[#c9a96e]/15 text-[#c9a96e] text-[10px] px-2 py-0.5 rounded-full font-medium">
              {count}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition">
            ✕
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-white/5">
          <p className="text-xs tracking-widest text-[#c9a96e] mb-2 font-medium">
            {remaining > 0 
              ? `INR ${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })} away from free shipping` 
              : "You've unlocked free shipping!"}
          </p>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="shipping-progress-fill h-full bg-[#c9a96e]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10">
              <p className="text-center text-white/40 tracking-widest text-sm mb-6">Your cart is empty.</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/product');
                }}
                className="px-6 py-2.5 text-xs tracking-widest uppercase border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e]/10 transition rounded"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-24 bg-[#111] overflow-hidden flex-shrink-0">
                  {item.image_url && <LuxuryImage src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-[#e8dcc8]">{item.title}</h3>
                  <p className="text-xs text-white/40 mt-1">Qty: {item.qty}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">₹{parseFloat(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })} each</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="mt-2 text-[10px] font-sans uppercase tracking-widest text-white/30 hover:text-rose-400 transition"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Remove
                  </button>
                  <p className="text-[#c9a96e] mt-2">INR {(parseFloat(item.price) * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-[#2a2a2a] bg-[#0a0705] space-y-4">
          <div className="flex justify-between items-center text-[#e8dcc8]">
            <span className="text-sm tracking-widest uppercase">Subtotal</span>
            <span className="text-xl font-light">
              INR {availableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-[#2a2a2a]">
            <button 
              onMouseEnter={() => (navigate as any).prefetch?.('/checkout')}
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
              className="w-full py-3 text-xs tracking-widest uppercase border border-[#c9a96e] bg-[#c9a96e] text-black hover:bg-[#b0935d] transition font-medium"
            >
              Proceed to Checkout →
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  onClose();
                  navigate('/cart');
                }}
                className="py-3 text-xs tracking-widest uppercase border border-white/20 text-white/70 hover:bg-white/5 transition"
              >
                View Full Cart
              </button>
              <button 
                onClick={onClose}
                className="py-3 text-xs tracking-widest uppercase border border-white/20 text-white/70 hover:bg-white/5 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
