import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Shield, Lock } from 'lucide-react';

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
      
      <p className="mt-5 mb-3 text-[11px] text-white/30 text-center leading-relaxed">
        Payments are processed securely by{' '}
        <span className="text-white/50">Stripe</span>.
        Hadi Perfumes does not store or access your card details.
      </p>

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full mt-2 py-4 rounded-lg font-medium text-[0.8rem] uppercase tracking-widest transition-all
          bg-[#c9a96e] text-[#0a0705] hover:bg-[#d4b97e] active:scale-[0.99]
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2.5 shadow-lg shadow-[#c9a96e]/10"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-4 w-4 text-[#0a0705]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing…</span>
          </>
        ) : (
          <>
            <Lock size={14} />
            <span>Pay ₹{orderTotal.toLocaleString('en-IN')}</span>
          </>
        )}
      </button>

      <div className="mt-5 space-y-3">
        {/* Accepted methods */}
        <div className="flex items-center justify-center gap-2.5 opacity-45">
          <span className="text-[9px] uppercase tracking-widest text-white/50">Accepted</span>
          {['VISA', 'MC', 'UPI', 'RuPay'].map(m => (
            <span key={m} className="text-[10px] font-mono text-white/50 border border-white/10 px-1.5 py-0.5 rounded">
              {m}
            </span>
          ))}
        </div>
        {/* Guarantee line */}
        <p className="text-[10px] text-white/25 text-center">
          14-day free returns &nbsp;·&nbsp; Authentic products guaranteed
        </p>
      </div>
    </form>
  );
}
