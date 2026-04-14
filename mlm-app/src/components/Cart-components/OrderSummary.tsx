import { useState } from "react";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "../../constants/cart.constants";

interface OrderSummaryProps {
  subtotal: number;
  onCheckout: () => void;
  loading: boolean;
  disabled: boolean;
  error: string;
  lastOrderId: string | null;
}

export default function OrderSummary({
  subtotal,
  onCheckout,
  loading,
  disabled,
  error,
  lastOrderId,
}: OrderSummaryProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoFeedback, setPromoFeedback] = useState("");

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const amountToFreeShipping = SHIPPING_THRESHOLD - subtotal;
  const isFreeShippingUnlocked = amountToFreeShipping <= 0;

  const total = subtotal + shipping;

  const applyPromoCode = () => {
    setPromoFeedback("Promo codes are not yet available.");
  };

  return (
    <div className="p-6 border rounded-lg border-[#c9a96e]/10">
      <h2 className="mb-4">Order Summary</h2>

      <div className="mb-6">
        {isFreeShippingUnlocked ? (
          <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs px-3 py-2 rounded flex items-center justify-center font-medium">
            ✓ Free Express Shipping Unlocked
          </div>
        ) : (
          <div className="bg-[#1a1511] border border-[#c9a96e]/20 rounded p-3">
            <p className="text-xs text-[#c9a96e] mb-2 text-center">
              Add ₹{amountToFreeShipping.toLocaleString('en-IN')} more for FREE express shipping
            </p>
            <div className="h-1 bg-[#2a241f] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#c9a96e] transition-all duration-500"
                style={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 text-sm mb-6 pb-6 border-b border-[#c9a96e]/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Promo Code"
            className="flex-1 bg-transparent border border-[#c9a96e]/30 rounded-lg px-3 py-2 text-[#e8dcc8] placeholder-white/30 focus:outline-none focus:border-[#c9a96e]"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button
            onClick={applyPromoCode}
            disabled={!!promoFeedback || loading}
            className="px-4 py-2 border border-[#c9a96e] text-[#c9a96e] rounded-lg hover:bg-[#c9a96e] hover:text-[#0a0705] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
        {promoFeedback && <p className="text-xs text-white/50">{promoFeedback}</p>}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/70">Subtotal</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/70">Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹ ${shipping.toLocaleString('en-IN')}`}</span>
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-[#c9a96e]/10 font-bold text-base">
          <span>Total</span>
          <span className="text-[#c9a96e]">₹ {total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {error && <Alert variant="error">{error}</Alert>}
        {lastOrderId && (
          <Alert variant="success">
            Order placed! Reference: {lastOrderId.slice(0, 8)}…
          </Alert>
        )}
      </div>

      <Button
        variant="solidGold"
        className="w-full mt-6 py-4 rounded-lg text-sm tracking-widest uppercase font-medium"
        onClick={onCheckout}
        disabled={disabled || loading}
      >
        {loading ? "Processing…" : "Place Order"}
      </Button>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <ShieldCheck className="w-4 h-4 text-[#c9a96e]" />
          <span>Secure SSL Encrypted Checkout</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <Truck className="w-4 h-4 text-[#c9a96e]" />
          <span>Dispatched within 24 hours</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <RotateCcw className="w-4 h-4 text-[#c9a96e]" />
          <span>14-Day Authenticity Guarantee</span>
        </div>
      </div>
    </div>
  );
}