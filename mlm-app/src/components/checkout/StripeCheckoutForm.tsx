import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Shield } from 'lucide-react';

interface StripeCheckoutFormProps {
  orderTotal: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function StripeCheckoutForm({ orderTotal, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout',
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          onError(error.message || 'Payment failed.');
        } else {
          onError("Payment failed. Please try a different card or contact support.");
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      onError("An unexpected error occurred. Your card has not been charged.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PaymentElement options={{ theme: 'night' }} />
      
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="mt-6 bg-[#c9a96e] text-[#0a0705] w-full py-4 rounded-lg font-medium hover:bg-[#c9a96e]/90 transition disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-[#0a0705]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          `Pay Now — INR ${orderTotal.toLocaleString('en-IN')}`
        )}
      </button>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>256-bit SSL Secure Checkout</span>
        </div>
        <div className="flex items-center gap-3 opacity-40">
          <span className="text-[10px] uppercase tracking-widest text-white/60">We accept</span>
          <span className="text-xs font-mono text-white/60 border border-white/10 px-2 py-0.5 rounded">VISA</span>
          <span className="text-xs font-mono text-white/60 border border-white/10 px-2 py-0.5 rounded">MC</span>
          <span className="text-xs font-mono text-white/60 border border-white/10 px-2 py-0.5 rounded">UPI</span>
        </div>
        <p className="text-[10px] text-white/30 text-center">🔁 14-Day Free Returns &nbsp;|&nbsp; ✓ Authentic Products Guaranteed</p>
      </div>
    </form>
  );
}
