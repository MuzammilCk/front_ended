// src/pages/OrderDetails.tsx
// Full order detail page — MNC Audit Compliant
// Route: /orders/:id (guarded by AuthGuard in App.tsx)

import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Calendar,
  Lock,
  Download
} from 'lucide-react';
import gsap from 'gsap';

import { getOrder, cancelOrder } from '../api/orders';
import type { OrderWithItems, OrderItem } from '../api/types';
import { useGsapContext } from '../hooks/useGsapContext';

import OrderTimeline from '../components/order-components/OrderTimeline';
import OrderItemCard from '../components/order-components/OrderItemCard';
import PriceBreakdown from '../components/order-components/PriceBreakdown';
import ReturnModal from '../components/order-components/ReturnModal';
import DisputeModal from '../components/order-components/DisputeModal';

// ─── Status utilities ────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (['completed', 'delivered'].includes(s))
    return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
  if (['cancelled', 'refunded', 'chargeback'].includes(s))
    return 'text-red-400 bg-red-400/10 border border-red-400/20';
  if (['shipped', 'packing', 'paid'].includes(s))
    return 'text-blue-400 bg-blue-400/10 border border-blue-400/20';
  if (['disputed'].includes(s))
    return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
  return 'text-[#c9a96e] bg-[#c9a96e]/10 border border-[#c9a96e]/20';
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Statuses that allow return requests
const RETURNABLE_STATUSES = ['delivered', 'completed'];
// Statuses that allow disputes
const DISPUTABLE_STATUSES = ['paid', 'packing', 'shipped', 'delivered', 'completed'];
// Statuses that allow cancellation
const CANCELLABLE_STATUSES = ['created', 'payment_pending', 'payment_authorized', 'packing', 'payment_failed'];

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-5 w-40 rounded bg-[#c9a96e]/8 mb-8" />
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
         <div className="space-y-3">
             <div className="h-4 w-24 rounded bg-[#c9a96e]/8" />
             <div className="h-10 w-64 rounded bg-[#c9a96e]/8" />
             <div className="h-6 w-32 rounded bg-[#c9a96e]/8" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[70%_1fr] gap-8">
        <div className="space-y-8">
          <div className="h-32 rounded-2xl bg-white/[0.03]" />
          <div className="space-y-4">
             <div className="h-6 w-32 rounded bg-[#c9a96e]/8 mb-4" />
             {[0, 1].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-white/[0.03]" />
              ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-2xl bg-white/[0.03]" />
          <div className="h-48 rounded-2xl bg-white/[0.03]" />
          <div className="h-40 rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const {
    data: orderData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Order cancelled successfully.' });
      setCancelConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err?.body ?? err?.message ?? 'Failed to cancel order.' });
    }
  });

  // GSAP entrance
  useGsapContext(
    () => {
      gsap.from('[data-order-section]', {
        y: 20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power2.out',
      });
    },
    containerRef,
    [orderData],
  );

  useEffect(() => {
    if (actionMessage) {
      const t = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [actionMessage]);

  const handleReturnSuccess = () => {
    setActionMessage({ type: 'success', text: 'Return request submitted. Our team will review it shortly.' });
    queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
  };

  const handleDisputeSuccess = () => {
    setActionMessage({ type: 'success', text: "Dispute filed successfully. We'll investigate within 24–48 hours." });
    queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
  };

  const copyOrderId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Parse JSON fields
  const rawData: any = orderData;
  const order = rawData?.order ?? (rawData?.id ? rawData : undefined);
  const items = rawData?.items ?? rawData?.order_items ?? [];

  let shippingAddress: Record<string, any> | null = null;
  let contact: Record<string, any> | null = null;

  if (order) {
    shippingAddress = typeof order.shipping_address === 'string'
      ? (() => { try { return JSON.parse(order.shipping_address); } catch { return null; } })()
      : order.shipping_address as Record<string, any> | null;

    contact = typeof order.contact === 'string'
      ? (() => { try { return JSON.parse(order.contact); } catch { return null; } })()
      : order.contact as Record<string, any> | null;
  }

  // Calculate 30 days return window
  const isWithin30Days = (completedAt: string | Date | null) => {
    if (!completedAt) return false;
    const completedDate = new Date(completedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return completedDate >= thirtyDaysAgo;
  };

  const canReturn = order && RETURNABLE_STATUSES.includes(order.status) && isWithin30Days(order.completed_at);
  const canDispute = order && DISPUTABLE_STATUSES.includes(order.status);
  const canCancel = order && CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8]">
      <div ref={containerRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* ── Back button ── */}
        <Link
          to="/profile"
          state={{ tab: 'orders' }}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Collection / Profile
        </Link>

        {/* ── Loading ── */}
        {isLoading && <OrderDetailSkeleton />}

        {/* ── Error ── */}
        {fetchError && !isLoading && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-[#c9a96e]/20 mb-4" />
            <p className="font-display text-xl text-[#e8dcc8] mb-2">Order Not Found</p>
            <p className="text-sm text-[#e8dcc8]/40 mb-6">
              This order may not exist or you may not have permission to view it.
            </p>
            <Link
              to="/profile"
              state={{ tab: 'orders' }}
              className="inline-block px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-[#e8c87a] transition"
            >
              View All Orders
            </Link>
          </div>
        )}

        {/* ── Action message toast ── */}
        {actionMessage && (
          <div
            className={`mb-6 flex items-start gap-2 p-4 rounded-xl border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{actionMessage.text}</p>
          </div>
        )}

        {/* ── Order Content ── */}
        {!isLoading && order && (
          <>
            {/* Header */}
            <div data-order-section className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 mb-1">
                    Order Details
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl text-[#e8dcc8] leading-tight flex items-center gap-3">
                    Order #{order.id.slice(-8).toUpperCase()}
                    <button
                      onClick={copyOrderId}
                      className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-white/5 transition-colors"
                      aria-label="Copy Order ID"
                      title="Copy Order ID"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#e8dcc8]/40 hover:text-[#c9a96e]" />
                      )}
                    </button>
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${getStatusStyle(order.status)}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#e8dcc8]/40">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main grid: Left (Timeline + Items) [70%] + Right (Summary + Logistics + Actions) [30%] */}
            <div className="grid grid-cols-1 lg:grid-cols-[70%_1fr] gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-8 min-w-0">
                {/* Timeline */}
                <div data-order-section className="p-6 bg-[#0d0a07]/50 rounded-2xl border border-[#c9a96e]/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <h2 className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/50 mb-6">
                    Tracking Progress
                  </h2>
                  {['cancelled', 'refunded', 'payment_failed'].includes(order.status) ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Order {formatStatus(order.status)}</p>
                        <p className="text-xs opacity-70 mt-1">This order has reached a terminal state and will not be fulfilled.</p>
                      </div>
                    </div>
                  ) : (
                    <OrderTimeline status={order.status} />
                  )}
                </div>

                {/* Items */}
                <div data-order-section>
                  <h2 className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/50 mb-4 px-1">
                    Order Verification ({items.length} Items)
                  </h2>
                  <div className="space-y-4">
                    {items.map((item: OrderItem) => (
                      <OrderItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (Sticky on Desktop) */}
              <div className="lg:sticky lg:top-24 space-y-6 self-start">
                
                {/* Order Summary Card */}
                <div data-order-section className="bg-[#0d0a07] border border-[#c9a96e]/15 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <PriceBreakdown
                    subtotal={order.subtotal}
                    shippingFee={order.shipping_fee}
                    taxAmount={order.tax_amount}
                    discountAmount={order.discount_amount}
                    totalAmount={order.total_amount}
                    currency={order.currency}
                  />
                  <div className="px-5 py-4 border-t border-[#c9a96e]/8 bg-white/[0.01]">
                    <div className="flex flex-col gap-1 text-[11px] text-[#e8dcc8]/40">
                      <span className="flex items-center gap-1.5 justify-center">
                        <Lock className="w-3 h-3 text-[#c9a96e]/60" />
                        Paid via Secure Gateway (Stripe)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logistics / Info Card */}
                <div data-order-section className="bg-[#0d0a07] rounded-2xl border border-[#c9a96e]/15 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  
                  {/* Shipping Address */}
                  {shippingAddress && (
                    <div className="p-5 border-b border-[#c9a96e]/8">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/40 mb-3 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#c9a96e]/60" />
                        Delivery Address
                      </h3>
                      <div className="font-sans text-sm text-[#e8dcc8]/80 leading-relaxed pl-5.5">
                        <p>{shippingAddress.line1}</p>
                        {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                        <p>
                          {shippingAddress.city}
                          {shippingAddress.state ? `, ${shippingAddress.state}` : ''}
                          {shippingAddress.postal_code ? ` — ${shippingAddress.postal_code}` : ''}
                        </p>
                        <p className="text-[#e8dcc8]/40 mt-1">{shippingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Contact Details */}
                  {contact && (
                    <div className="p-5 border-b border-[#c9a96e]/8">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/40 mb-3 flex items-center gap-2">
                         <User className="w-3.5 h-3.5 text-[#c9a96e]/60" />
                        Contact Details
                      </h3>
                      <div className="font-sans text-sm text-[#e8dcc8]/80 space-y-2 pl-5.5">
                        {contact.name && (
                          <div className="flex items-center gap-3">
                            <span>{contact.name}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2.5">
                            <span className="opacity-90">{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2.5">
                            <span className="opacity-90">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes (if any) */}
                  {order.notes && (
                    <div className="p-5">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/40 mb-3">
                        Order Notes
                      </h3>
                      <div className="font-sans text-sm text-[#e8dcc8]/80">
                        <p className="italic">{order.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div data-order-section className="space-y-3">
                    
                    {/* Invoice */}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#c9a96e]/15 text-sm text-[#e8dcc8] hover:bg-white/5 hover:border-[#c9a96e]/30 transition-all group"
                    >
                      <Download className="w-4 h-4 text-[#c9a96e]/50 group-hover:text-[#c9a96e] transition-colors" />
                      <div className="text-left">
                        <p className="font-sans text-xs text-[#e8dcc8]/90 tracking-wide uppercase">Download Invoice</p>
                      </div>
                    </button>

                    {/* Return Action */}
                    {canReturn && (
                      <button
                        type="button"
                        onClick={() => setShowReturnModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#c9a96e]/15 text-sm text-[#e8dcc8] hover:bg-[#c9a96e]/5 hover:border-[#c9a96e]/40 transition-all group"
                      >
                        <RotateCcw className="w-4 h-4 text-[#c9a96e]/50 group-hover:text-[#c9a96e] transition-colors" />
                        <div className="text-left">
                          <p className="font-sans text-xs text-[#e8dcc8]/90 tracking-wide uppercase">Request Return</p>
                          <p className="text-[10px] text-[#e8dcc8]/40 mt-0.5">Return items for a refund</p>
                        </div>
                      </button>
                    )}

                    {/* Dispute Action */}
                    {canDispute && (
                      <button
                        type="button"
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/15 text-sm text-[#e8dcc8] hover:bg-amber-500/5 hover:border-amber-500/30 transition-all group"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
                        <div className="text-left">
                          <p className="font-sans text-xs text-[#e8dcc8]/90 tracking-wide uppercase">Need Help? Open Dispute</p>
                          <p className="text-[10px] text-[#e8dcc8]/40 mt-0.5">File an issue with this order</p>
                        </div>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {canCancel && (
                      <>
                        {!cancelConfirm ? (
                          <button
                            type="button"
                            onClick={() => setCancelConfirm(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/15 text-sm text-[#e8dcc8] hover:bg-red-500/5 hover:border-red-500/30 transition-all group"
                          >
                            <XCircle className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition-colors" />
                            <div className="text-left">
                              <p className="font-sans text-xs text-[#e8dcc8]/90 tracking-wide uppercase">Cancel Order</p>
                              <p className="text-[10px] text-[#e8dcc8]/40 mt-0.5">Cancel this order</p>
                            </div>
                          </button>
                        ) : (
                          <div className="space-y-3 p-4 rounded-xl bg-[#0d0a07] border border-red-500/30 shadow-[0_4px_24px_rgba(239,68,68,0.1)]">
                            <p className="text-xs text-red-400 font-sans">
                              Are you sure? This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setCancelConfirm(false)}
                                disabled={cancelMutation.isPending}
                                className="flex-1 py-2.5 rounded-lg border border-red-500/20 text-[10px] uppercase tracking-widest text-[#e8dcc8]/70 hover:text-white hover:bg-white/5 transition-all"
                              >
                                No, Keep
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelMutation.mutate()}
                                disabled={cancelMutation.isPending}
                                className="flex-1 py-2.5 rounded-lg bg-red-500/90 text-white text-[10px] uppercase tracking-widest font-medium hover:bg-red-500 transition-all disabled:opacity-50"
                              >
                                {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {order && (
        <>
          <ReturnModal
            isOpen={showReturnModal}
            onClose={() => setShowReturnModal(false)}
            orderId={order.id}
            items={items}
            onSuccess={handleReturnSuccess}
          />
          <DisputeModal
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            orderId={order.id}
            onSuccess={handleDisputeSuccess}
          />
        </>
      )}
    </div>
  );
}
