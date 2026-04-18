import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, Clock, CreditCard, Package, Truck, CheckCircle2 } from 'lucide-react';
import { getOrder, cancelOrder } from '../api/orders';
import { getListingById } from '../api/listings';
import type { OrderWithItems, Listing } from '../api/types';
import { ORDER_STATUS_CLS } from '../api/types';

function formatINR(value: string | number): string {
  return `₹${parseFloat(String(value)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeJsonParse<T>(data: any): T | null {
  if (!data) return null;
  if (typeof data === 'object') return data as T;
  try {
    if (typeof data === 'string') return JSON.parse(data) as T;
    return null;
  } catch {
    return null;
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatAddress(addr: Record<string, any> | null): string {
  if (!addr) return 'No shipping address provided.';
  const parts = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(', ');
}

function OrderSummaryItem({ item }: { item: any }) {
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    let mounted = true;
    getListingById(item.listing_id)
      .then((data) => {
        if (mounted) setListing(data);
      })
      .catch((err) => console.error('Failed to fetch product image', err));
    return () => {
      mounted = false;
    };
  }, [item.listing_id]);

  const imageUrl = (listing?.images?.[0] as any)?.cdn_url || listing?.images?.[0]?.storage_key || null;

  return (
    <div className="flex items-start gap-4 py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] p-4 -mx-4 rounded-xl transition-colors">
      <div className="h-20 w-20 sm:h-24 sm:w-24 bg-void/50 rounded-xl border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-white/20" size={24} />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="text-sm sm:text-base text-[#e8dcc8] font-serif tracking-wide truncate">
          {item.title}
        </h4>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1.5 mb-3">
          Ref: {item.sku || item.listing_id.slice(0, 8)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#c9a96e] bg-[#c9a96e]/10 inline-flex px-2 py-1 rounded-sm">
          Qty: {item.qty}
        </p>
      </div>
      <div className="flex-shrink-0 pt-1 text-right">
        <p className="text-sm sm:text-base text-white font-light tracking-wide">
          {formatINR(item.line_total)}
        </p>
      </div>
    </div>
  );
}

const TIMELINE_STEPS = [
  'created',
  'payment_pending',
  'paid',
  'packing',
  'shipped',
  'delivered',
  'completed',
] as const;

const INSTANT_MILESTONES = new Set(['created', 'paid', 'delivered', 'completed']);

const TIMELINE_META: Record<string, { title: string; description: string; Icon: React.ElementType }> = {
  created: { title: 'Order Created', description: 'Your order has been received.', Icon: Sparkles },
  payment_pending: { title: 'Awaiting Payment', description: 'Pending clearance from your bank.', Icon: Clock },
  paid: { title: 'Payment Confirmed', description: 'Your payment was successfully processed.', Icon: CreditCard },
  packing: { title: 'Hand-Packing', description: 'Your fragrance is being prepared at our atelier.', Icon: Package },
  shipped: { title: 'In Transit', description: 'Handed over to our delivery partner.', Icon: Truck },
  delivered: { title: 'Delivered', description: 'Your signature scent has arrived.', Icon: CheckCircle2 },
  completed: { title: 'Completed', description: 'Thank you for choosing Hadi Perfumes.', Icon: CheckCircle2 },
};
const TERMINAL_FAILURE_STATES = new Set([
  'cancelled',
  'payment_failed',
  'refunded',
  'chargeback',
  'disputed',
]);

const TERMINAL_MESSAGES: Record<string, string> = {
  cancelled:      'This order has been cancelled.',
  payment_failed: 'Payment for this order failed. Please contact support.',
  refunded:       'This order has been refunded.',
  chargeback:     'A chargeback has been raised for this order.',
  disputed:       'This order is currently under dispute review.',
};

const OrderDetails = () => {
  const [data, setData] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getOrder(orderId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!orderId) return;
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? This action cannot be undone.'
    );
    if (!confirmed) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(orderId);
      await fetchOrder(); // Re-fetch so status and permissions update
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const isTerminal = data ? TERMINAL_FAILURE_STATES.has(data.order.status) : false;
  const currentStepIndex = data
    ? TIMELINE_STEPS.indexOf(data.order.status as (typeof TIMELINE_STEPS)[number])
    : -1;

  return (
    <div className="min-h-screen bg-void text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 section-padding sm:px-6 lg:px-8">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors duration-500 mb-8"
        >
          ← My Collection
        </Link>
        <h1 className="font-display text-4xl md:text-5xl font-light text-[#e8dcc8] mb-2 leading-none">
          Your Order
        </h1>

        {loading === true && (
          <div className="space-y-6 animate-pulse">
            <div className="rounded-sm border border-white/10 bg-white/5 p-8 space-y-3 shadow-glass">
              <div className="h-4 w-1/3 bg-zinc-800 rounded" />
              <div className="h-4 w-1/2 bg-zinc-800 rounded" />
              <div className="h-5 w-24 bg-zinc-800 rounded-full" />
            </div>
            <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
              <div className="flex justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-800" />
                    <div className="h-3 w-14 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/5 p-8 space-y-4 shadow-glass">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 rounded-md bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                    <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading === false && error !== null && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchOrder}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && data !== null && (
          <div className="pb-20">
            <div className="py-10">
              {/* Subtle order reference above the status */}
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a96e]/40 mb-3">
                Order #{data.order.id.slice(0, 8).toUpperCase()}
              </p>

              {/* Hero status — large and dominant */}
              <p
                className={`text-5xl md:text-6xl font-display font-light leading-none mb-4 ${
                  isTerminal
                    ? 'text-red-400/70'
                    : data.order.status === 'delivered' || data.order.status === 'completed'
                    ? 'text-emerald-400/80'
                    : 'text-[#c9a96e]'
                }`}
              >
                {formatStatus(data.order.status)}
              </p>

              {/* Placed date in luxury format */}
              <p className="text-xs text-[#e8dcc8]/40">
                Placed on{' '}
                {(() => {
                  try {
                    const d = new Date(data.order.created_at);
                    const day = d.getDate();
                    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
                    return `${day}${suffix} of ${d.toLocaleString('en-IN', { month: 'long' })}, ${d.getFullYear()}`;
                  } catch {
                    return new Date(data.order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  }
                })()}
              </p>
            </div>

            {/* Split UI Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-6 -mx-4 sm:mx-0">
              
              {/* Left Column: Progress Tracker */}
              <div className="lg:col-span-5 px-4 sm:px-0">
                {isTerminal ? (
                  <div className="py-10 bg-red-500/5 border border-red-500/10 rounded-2xl p-8">
                    <p className="text-sm text-red-400/80 text-center uppercase tracking-widest leading-relaxed">
                      {TERMINAL_MESSAGES[data.order.status] ?? 'This order is in a terminal state.'}
                    </p>
                  </div>
                ) : (
                  <div className="py-10 lg:py-0">
                    <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-10">
                      Order Progress
                    </p>
                    <div className="relative ml-[1.25rem] sm:ml-[1.5rem]">
                      {TIMELINE_STEPS.map((step, index) => {
                        const meta = TIMELINE_META[step];
                        const isDone = index < currentStepIndex || (index === currentStepIndex && INSTANT_MILESTONES.has(step));
                        const isActive = index === currentStepIndex && !isDone;
                        const isFuture = index > currentStepIndex;
                        const isLineActive = index < currentStepIndex;
                        const Icon = meta.Icon;

                        return (
                          <div key={step} className="relative pl-8 sm:pl-10 pb-10 last:pb-0">
                            {/* Track Line (Background Default) */}
                            {index < TIMELINE_STEPS.length - 1 && (
                              <div className="absolute top-0 bottom-0 left-[-1px] w-[1px] bg-white/10 z-0" />
                            )}
                            
                            {/* Track Line (Active Gold Override) */}
                            {isLineActive && index < TIMELINE_STEPS.length - 1 && (
                              <div className="absolute top-0 bottom-0 left-[-1px] w-[1px] bg-[#c9a96e] z-0" />
                            )}

                            {/* Node */}
                            <div
                              className={`absolute top-0 left-0 -translate-x-1/2 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 bg-void transition-all duration-700 z-10
                                ${isDone ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/5' : isActive ? 'border-[#c9a96e] text-[#c9a96e] shadow-[0_0_15px_rgba(201,169,110,0.3)] bg-void' : 'border-white/10 text-white/20'}
                              `}
                            >
                              <Icon size={18} strokeWidth={isActive || isDone ? 2 : 1.5} />
                            </div>

                            {/* Content */}
                            <div className={`pt-1.5 sm:pt-2 transition-all duration-700 ${isFuture && !isActive ? 'opacity-40' : 'opacity-100'}`}>
                              <h4 className={`text-sm sm:text-base mb-1 tracking-wide ${isActive ? 'text-[#c9a96e] font-sans' : isDone ? 'text-white font-serif' : 'text-white/40 font-serif'}`}>
                                {meta.title}
                              </h4>
                              {isActive && (
                                <p className="text-xs text-[#e8dcc8]/60 mb-3 leading-relaxed">
                                  {meta.description}
                                </p>
                              )}
                              {isDone && !isActive && (
                                <p className="text-[10px] text-white/30 uppercase tracking-widest">{meta.description}</p>
                              )}
                              {isFuture && !isActive && (
                                <p className="text-[10px] text-white/20 uppercase tracking-widest">Pending</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Unified Order Summary Box */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border-y sm:border sm:border-white/10 bg-[#0d0905] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                  {/* Decorative background glow */}
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#c9a96e]/5 blur-[80px] rounded-full pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-base uppercase tracking-[0.2em] font-light text-[#c9a96e] mb-2">Order Manifesto</h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-8 border-b border-white/5 pb-6">Summary of Transaction</p>
                    
                    {/* Products List */}
                    <div className="mb-10">
                      {data.items.map((item) => (
                         <OrderSummaryItem key={item.id} item={item} />
                      ))}
                    </div>

                    {/* Shipping & Contact Block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 p-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Truck size={12} /> Shipping Address
                        </p>
                        <p className="text-sm text-zinc-300 leading-relaxed font-light mt-4">
                          {formatAddress(safeJsonParse<Record<string, any>>(data.order.shipping_address))}
                        </p>
                      </div>
                      {(() => {
                        const contact = safeJsonParse<{ name: string; phone: string; email?: string }>(data.order.contact);
                        if (!contact) return null;
                        return (
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                              Contact Info
                            </p>
                            <div className="mt-4 space-y-1">
                              <p className="text-sm text-zinc-300 font-light">{contact.name}</p>
                              <p className="text-sm text-zinc-400 font-light">{contact.phone}</p>
                              {contact.email && <p className="text-sm text-zinc-400 font-light">{contact.email}</p>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Settlement Block */}
                    <div className="space-y-3 pb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40 font-light">Subtotal</span>
                        <span className="text-zinc-200">{formatINR(data.order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40 font-light">Shipping</span>
                        <span className="text-zinc-200">{formatINR(data.order.shipping_fee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40 font-light">Tax</span>
                        <span className="text-zinc-200">{formatINR(data.order.tax_amount)}</span>
                      </div>
                      {parseFloat(String(data.order.discount_amount)) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40 font-light">Discount</span>
                          <span className="text-emerald-400/80 font-light">
                            −{formatINR(data.order.discount_amount)}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-6 mt-6 flex justify-between items-end border-t border-white/10">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-light text-[#c9a96e]">Grand Total</span>
                        <span className="text-2xl font-serif text-[#c9a96e]">
                          {formatINR(data.order.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {(data.permissions?.can_cancel || data.permissions?.can_return) && (
                      <div className="mt-2 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
                        {data.permissions?.can_return ? (
                          <button
                            onClick={() => navigate(`/returns/new?order_id=${data.order.id}`)}
                            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#c9a96e]/30 text-xs tracking-widest uppercase text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors"
                          >
                            Initiate Return
                          </button>
                        ) : (
                           <div /> 
                        )}
                        
                        {data.permissions?.can_cancel && (
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                            <button
                              onClick={handleCancel}
                              disabled={cancelling}
                              className="text-[10px] uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed border-b border-transparent hover:border-red-400/30 pb-0.5"
                            >
                              {cancelling ? 'Cancelling…' : 'Cancel Order'}
                            </button>
                            {cancelError && (
                              <p className="text-[10px] text-red-400/70">{cancelError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
