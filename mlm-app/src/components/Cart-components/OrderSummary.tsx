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
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const amountToFreeShipping = SHIPPING_THRESHOLD - subtotal;
  const isFreeShippingUnlocked = amountToFreeShipping <= 0;
  const total = subtotal + shipping;

  return (
    <div className="p-6 md:p-8 bg-[#0d0a07] border rounded-xl border-[#c9a96e]/15 shadow-2xl">
      <h2 className="font-display text-2xl text-[#e8dcc8] mb-6">Order Summary</h2>

      <div className="mb-8">
        {isFreeShippingUnlocked ? (
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-4 py-3 rounded-lg flex items-center justify-center font-medium tracking-wide">
            ✓ Free Express Shipping Unlocked
          </div>
        ) : (
          <div className="bg-[#110d0a] border border-[#c9a96e]/20 rounded-lg p-4">
            <p className="text-xs text-[#c9a96e] mb-3 text-center tracking-wide font-medium">
              Add <span className="font-serif tabular-nums">₹{amountToFreeShipping.toLocaleString('en-IN')}</span> more for FREE express shipping
            </p>
            <div className="h-1.5 bg-[#000000] rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#8b6914] to-[#c9a96e] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 text-sm font-sans tracking-wide">
        <div className="flex justify-between items-center text-white/70">
          <span>Subtotal</span>
          <span className="tabular-nums">₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between items-center text-white/70">
          <span>Shipping</span>
          <span className="tabular-nums">{shipping === 0 ? "Free" : `₹ ${shipping.toLocaleString('en-IN')}`}</span>
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-[#c9a96e]/15">
          <span className="font-medium text-base text-[#e8dcc8]">Estimated Total</span>
          <span className="text-[#c9a96e] font-serif text-2xl tabular-nums">₹ {total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {error && <Alert variant="error">{error}</Alert>}
        {lastOrderId && (
          <Alert variant="success">
            Order placed! Ref: <span className="font-mono text-[10px]">{lastOrderId.slice(0, 8)}</span>
          </Alert>
        )}
      </div>

      <Button
        variant="solidGold"
        className="w-full mt-8 py-4 rounded-lg text-sm tracking-[0.2em] uppercase font-medium shadow-[0_0_20px_rgba(201,169,110,0.15)] hover:shadow-[0_0_25px_rgba(201,169,110,0.25)] transition-all"
        onClick={onCheckout}
        disabled={disabled || loading}
      >
        {loading ? "Processing..." : "Secure Checkout"}
      </Button>

      <div className="mt-8 pt-6 border-t border-[#c9a96e]/10 space-y-4">
        {[
          { icon: ShieldCheck, text: "Secure SSL Encrypted Checkout" },
          { icon: Truck, text: "Dispatched within 24 hours" },
          { icon: RotateCcw, text: "14-Day Authenticity Guarantee" }
        ].map((Benefit, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs text-white/40">
            <Benefit.icon className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.5} />
            <span className="tracking-wide">{Benefit.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
