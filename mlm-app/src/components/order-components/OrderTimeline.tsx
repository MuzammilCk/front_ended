// src/components/order-components/OrderTimeline.tsx
// Visual status progression for an order, with GSAP stagger animation. MNC Audit Compliant.

import { useRef } from 'react';
import { useGsapContext } from '../../hooks/useGsapContext';
import gsap from 'gsap';
import {
  PackageSearch,
  PackageCheck,
  Truck,
  CheckCircle,
} from 'lucide-react';

// Ordered lifecycle steps visible to the buyer based on Audit: 4 steps
const LIFECYCLE_STEPS = [
  { key: 'placed',     label: 'Order Placed',    icon: PackageSearch },
  { key: 'preparing',  label: 'Preparing',       icon: PackageCheck },
  { key: 'dispatched', label: 'Dispatched',      icon: Truck },
  { key: 'delivered',  label: 'Delivered',       icon: CheckCircle },
] as const;

// Map backend states to the 4 UI steps
const STATUS_STEP_MAP: Record<string, number> = {
  created: 0,
  payment_pending: 0,
  payment_authorized: 0,
  paid: 0,
  packing: 1,
  shipped: 2,
  delivered: 3,
  completed: 3,
};

export default function OrderTimeline({ status }: { status: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Terminal states are now handled in the parent OrderDetails page with an Alert box.
  // This component only renders if the status is NOT terminal.
  const currentStep = STATUS_STEP_MAP[status.toLowerCase()] ?? 0;

  useGsapContext(
    () => {
      gsap.from('[data-timeline-dot]', {
        scale: 0,
        opacity: 0,
        stagger: 0.12,
        duration: 0.5,
        ease: 'back.out(1.7)',
      });
      gsap.from('[data-timeline-label]', {
        y: 10,
        opacity: 0,
        stagger: 0.12,
        duration: 0.4,
        ease: 'power2.out',
        delay: 0.15,
      });
      gsap.from('[data-timeline-bar]', {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.8,
        ease: 'power3.inOut',
        delay: 0.3
      });
    },
    containerRef,
    [status],
  );

  return (
    <div ref={containerRef} className="w-full font-sans">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between relative">
        {/* Connecting line track */}
        <div className="absolute top-[14px] left-[10%] right-[10%] h-0.5 bg-[#c9a96e]/10 z-0 rounded-full" />
        
        {/* Active line fill */}
        <div
          data-timeline-bar
          className="absolute top-[14px] left-[10%] h-0.5 bg-[#c9a96e] z-0 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(201,169,110,0.5)]"
          style={{ width: `${(currentStep / (LIFECYCLE_STEPS.length - 1)) * 80}%` }}
        />

        {LIFECYCLE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isPast = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                data-timeline-dot
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCurrent
                    ? 'bg-[#c9a96e] border-[#c9a96e] shadow-[0_0_16px_rgba(201,169,110,0.4)] text-[#0a0705]'
                    : isPast
                      ? 'bg-[#0d0a07] border-[#c9a96e] text-[#c9a96e]'
                      : 'bg-[#0d0a07] border-[#c9a96e]/15 text-[#c9a96e]/30'
                  }
                `}
              >
                <Icon className="w-4 h-4" strokeWidth={isCurrent ? 2.5 : 2} />
              </div>
              <span
                data-timeline-label
                className={`
                  mt-3 text-[10px] uppercase tracking-[0.15em] text-center
                  ${isCurrent ? 'text-[#c9a96e] font-medium' : isPast ? 'text-[#e8dcc8]/70' : 'text-[#e8dcc8]/50'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical compact */}
      <div className="sm:hidden flex flex-col gap-1 pl-2">
        {LIFECYCLE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isPast = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  data-timeline-dot
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center border-2
                    ${isCurrent
                      ? 'bg-[#c9a96e] border-[#c9a96e] shadow-[0_0_12px_rgba(201,169,110,0.3)] text-[#0a0705]'
                      : isPast
                        ? 'bg-[#0d0a07] border-[#c9a96e] text-[#c9a96e]'
                        : 'bg-[#0d0a07] border-[#c9a96e]/15 text-[#c9a96e]/30'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                {i < LIFECYCLE_STEPS.length - 1 && (
                  <div className={`w-[2px] h-6 my-1 rounded-full ${isPast ? 'bg-[#c9a96e]' : 'bg-[#c9a96e]/10'}`} />
                )}
              </div>
              <div className="pt-1.5 pb-6">
                 <span
                    data-timeline-label
                    className={`
                      text-[11px] uppercase tracking-[0.1em]
                      ${isCurrent ? 'text-[#c9a96e] font-medium' : isPast ? 'text-[#e8dcc8]/80' : 'text-[#e8dcc8]/50'}
                    `}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                     <p className="text-[11px] text-[#e8dcc8]/50 mt-1 capitalize font-body leading-snug pr-4">
                        {status === 'shipped' ? 'Your order is on its way via our logistics partner.' :
                         status === 'packing' ? 'We are carefully preparing your items.' :
                         status === 'delivered' ? 'Your order has been successfully delivered.' :
                         'Your payment is confirmed and order is placed.'}
                     </p>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
