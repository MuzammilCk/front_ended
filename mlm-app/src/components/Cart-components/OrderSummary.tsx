import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  onCheckout: () => void;
  loading: boolean;
  disabled: boolean;
  error: string;
  lastOrderId: string | null;
}

export default function OrderSummary({
  subtotal,
  shipping,
  onCheckout,
  loading,
  disabled,
  error,
  lastOrderId,
}: OrderSummaryProps) {
  const total = subtotal + shipping;

  return (
    <div className="p-6 border rounded-lg border-[#c9a96e]/10">
      <h2 className="mb-4">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>INR {subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `INR ${shipping}`}</span>
        </div>

        <div className="flex justify-between mt-4 font-bold">
          <span>Total</span>
          <span className="text-[#c9a96e]">INR {total}</span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {lastOrderId && (
        <Alert variant="success">
          Order placed! Reference: {lastOrderId.slice(0, 8)}…
        </Alert>
      )}

      <Button
        variant="solidGold"
        className="w-full mt-6 py-3 rounded-lg"
        onClick={onCheckout}
        disabled={disabled || loading}
      >
        {loading ? "Processing…" : "Place Order"}
      </Button>
    </div>
  );
}