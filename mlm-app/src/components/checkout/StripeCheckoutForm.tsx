import { useState } from 'react';
import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { Shield, Lock } from 'lucide-react';
import { verifyPayment } from '../../api/payments';

interface StripeCheckoutFormProps {
  orderTotal: number;
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function StripeCheckoutForm({ orderTotal, orderId, onSuccess, onError }: StripeCheckoutFormProps) {
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
        // Payment succeeded on Stripe's side.
        // Now verify with our backend to ensure the order transitions to PAID,
        // even if the Stripe webhook is delayed or unreachable.
        try {
          await verifyPayment(orderId);
        } catch (verifyErr) {
          // Verification failed — the webhook will eventually catch up.
          // Don't block the user; log and proceed to confirmation.
          console.warn('Payment verification fallback failed (webhook will retry):', verifyErr);
        }
        onSuccess();
      }
    } catch (err) {
      onError("An unexpected error occurred. Your card has not been charged.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-2">
        <ExpressCheckoutElement 
          onConfirm={() => setIsProcessing(true)}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            }
          }}
        />
      </div>

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-white/8" />
        <span className="flex-shrink-0 mx-6 text-[10px] uppercase tracking-widest text-[#e8dcc8]/30">or pay with card / upi</span>
        <div className="flex-grow border-t border-white/8" />
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }} 
        />
        
        <p className="mt-5 mb-3 text-[10px] uppercase tracking-widest text-[#e8dcc8]/25 text-center">
          Secured by Stripe · UPI approvals may take up to 5 minutes
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
              <span>Awaiting Confirmation…</span>
            </>
          ) : (
            <>
              <Lock size={14} />
              <span>Pay ₹{orderTotal.toLocaleString('en-IN')}</span>
            </>
          )}
        </button>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-center gap-2.5 opacity-45">
            <span className="text-[9px] uppercase tracking-widest text-white/50">Accepted</span>
            {['VISA', 'MC', 'UPI', 'RuPay'].map(m => (
              <span key={m} className="text-[10px] font-mono text-white/50 border border-white/10 px-1.5 py-0.5 rounded">
                {m}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-white/25 text-center">
            14-day free returns &nbsp;·&nbsp; Authentic products guaranteed
          </p>
        </div>
      </form>
    </div>
  );
}
