import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, Package, Truck, CreditCard, RotateCcw, HeadphonesIcon, X } from "lucide-react";
import LuxuryImage from "../components/ui/LuxuryImage";
import { getImageUrl } from "../utils/imageUrl";
import { Alert } from "../components/ui/Alert";
import { getOrder, cancelOrder } from "../api/orders";
import type { OrderWithItems } from "../api/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function OrderDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:px-8">
        {/* Breadcrumb skeleton */}
        <div className="h-3 w-48 bg-[#c9a96e]/8 rounded animate-pulse mb-8" />
        {/* Headline skeleton */}
        <div className="h-8 w-56 bg-[#c9a96e]/10 rounded animate-pulse mb-3" />
        <div className="h-3 w-36 bg-[#c9a96e]/6 rounded animate-pulse mb-12" />
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Timeline skeleton */}
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6 space-y-4">
              <div className="h-3 w-32 bg-[#c9a96e]/8 rounded animate-pulse" />
              <div className="h-1 w-full bg-[#c9a96e]/8 rounded animate-pulse" />
              <div className="flex justify-between">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#c9a96e]/10 animate-pulse" />
                    <div className="h-2 w-14 bg-[#c9a96e]/6 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            {/* Items skeleton */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-6 py-6 border-b border-[#c9a96e]/10 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-[#c9a96e]/8 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 bg-[#c9a96e]/10 rounded" />
                  <div className="h-3 w-24 bg-[#c9a96e]/6 rounded" />
                  <div className="h-3 w-16 bg-[#c9a96e]/6 rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Right column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6 space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-20 bg-[#c9a96e]/6 rounded" />
                  <div className="h-3 w-16 bg-[#c9a96e]/8 rounded" />
                </div>
              ))}
            </div>
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6 space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 w-full bg-[#c9a96e]/6 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_STEPS = [
  { key: "created", label: "Placed" },
  { key: "paid",    label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function getStepIndex(status: string): number {
  if (["created", "payment_pending", "payment_authorized", "payment_failed"].includes(status)) return 0;
  if (["paid", "packing"].includes(status)) return 1;
  if (status === "shipped") return 2;
  if (["delivered", "completed"].includes(status)) return 3;
  return -1; // cancelled, refunded, disputed, chargeback
}

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [deliveryRating, setDeliveryRating] = useState<number | null>(null);

  const { mutate: doCancel, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setShowCancelConfirm(false);
    },
    onError: () => {
      setShowCancelConfirm(false);
    },
  });

  const { data, isLoading, isError, error } = useQuery<OrderWithItems>({
    queryKey: ["order", id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) return <OrderDetailsSkeleton />;

  if (isError) {
    const is404 = (error as any)?.status === 404 || (error as any)?.statusCode === 404;
    return (
      <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-display text-[#e8dcc8] mb-2">
              {is404 ? "Order Not Found" : "Something Went Wrong"}
            </h1>
            <p className="text-sm text-white/40">
              {is404
                ? "This order doesn't exist or doesn't belong to your account."
                : "We couldn't load your order. Please try again."}
            </p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c9a96e] hover:text-[#e8c87a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, items } = data;

  // State-machine: only created / payment_pending / payment_authorized are user-cancellable
  const isCancellable = ["created", "payment_pending", "payment_authorized"].includes(order.status);

  // Return is valid if delivered/completed AND within 30 days
  const isReturnable = (() => {
    if (!["delivered", "completed"].includes(order.status)) return false;
    const completedAt = order.completed_at || order.updated_at;
    const daysSince = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  })();

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] pb-24 md:pb-0">
      {/* Grain texture — identical to Cart.tsx */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')" }} />

      <main aria-label="Order Details" className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:px-8 md:py-16 animate-[slideInUp_0.4s_ease-out]">
        {/* SECTION: Page Header — added in Prompt 3 */}
        {/* SECTION: Grid Layout — added in Prompts 3-6 */}
        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="mb-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-widest mb-6">
            <Link to="/profile" className="hover:text-[#c9a96e] transition-colors">Profile</Link>
            <span>/</span>
            <span className="text-[#c9a96e]/60">Order #{order.id.slice(0, 8).toUpperCase()}</span>
          </nav>

          {/* Headline + meta */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-light font-display text-[#e8dcc8] tracking-tight">
                Order <span className="text-[#c9a96e] italic">Details</span>
              </h1>
              <p className="text-xs text-white/40 mt-2 tracking-wide">
                Placed on {formatOrderDate(order.created_at)}
              </p>
            </div>
            {/* Status badge */}
            <span className={`self-start md:self-auto inline-block text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border font-sans
              ${["delivered", "completed"].includes(order.status) ? "text-emerald-400/80 bg-emerald-400/8 border-emerald-400/20" :
                ["cancelled", "refunded", "chargeback"].includes(order.status) ? "text-red-400/80 bg-red-400/8 border-red-400/20" :
                ["shipped"].includes(order.status) ? "text-blue-400/80 bg-blue-400/8 border-blue-400/20" :
                "text-[#c9a96e]/80 bg-[#c9a96e]/8 border-[#c9a96e]/20"}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* ── Cancelled / Refunded Alert ────────────────────────── */}
        {["cancelled", "refunded", "chargeback", "disputed"].includes(order.status) && (
          <div className="mb-8">
            <Alert variant={order.status === "cancelled" ? "error" : "warn"}>
              <span className="font-sans text-sm">
                {order.status === "cancelled" && order.cancelled_at
                  ? `This order was cancelled on ${formatOrderDate(order.cancelled_at)}.`
                  : order.status === "refunded"
                  ? "A refund has been issued for this order."
                  : order.status === "disputed"
                  ? "This order is under dispute review."
                  : "This order was subject to a chargeback."}
              </span>
            </Alert>
          </div>
        )}

        {/* ── 12-Col Grid ───────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start" role="region">

          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">

            {/* Status Timeline / Progress Tracker */}
            {!["cancelled", "refunded", "chargeback"].includes(order.status) && (
              <div
                className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6"
                aria-label="Order Status Timeline"
              >
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 mb-6 font-sans">
                  Order Progress
                </p>

                {/* Progress bar */}
                <div className="relative h-[2px] bg-white/8 rounded-full mb-6">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a] transition-all duration-700"
                    style={{
                      width: `${getStepIndex(order.status) < 0 ? 0 : Math.min((getStepIndex(order.status) / 3) * 100, 100)}%`,
                    }}
                  />
                </div>

                {/* Step nodes */}
                <div className="flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(order.status);
                    const isComplete = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-2"
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-500
                          ${isComplete
                            ? "bg-[#c9a96e] border-[#c9a96e] shadow-[0_0_12px_rgba(201,169,110,0.3)]"
                            : "bg-[#0a0705] border-[#c9a96e]/20"
                          }`}
                        >
                          {isComplete && (
                            <svg className="w-3.5 h-3.5 text-[#0a0705]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] tracking-wide font-sans uppercase
                          ${isComplete ? "text-[#c9a96e]" : "text-white/25"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ORDER ITEMS — Prompt 4 will go here */}
            {/* ── Order Items ─────────────────────────────────────── */}
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#c9a96e]/10 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 font-sans">
                  Items Ordered
                </p>
                <span className="text-[10px] text-white/30 font-sans">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-[#c9a96e]/8">
                {items.map((item) => {
                  const imageUrl = getImageUrl(item.listing_id);
                  const unitPrice = parseFloat(item.unit_price);
                  const lineTotal = parseFloat(item.line_total);

                  return (
                    <div key={item.id} className="flex gap-5 px-6 py-6 group hover:bg-[#c9a96e]/3 transition-colors">

                      {/* Thumbnail */}
                      <Link
                        to={`/product/${item.listing_id}`}
                        className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#130e08] border border-[#c9a96e]/10 block"
                        aria-label={`View ${item.title}`}
                      >
                        {imageUrl ? (
                          <LuxuryImage
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <Package className="w-5 h-5 text-[#c9a96e]/20" />
                            <span className="text-[8px] tracking-widest text-[#c9a96e]/20 font-sans uppercase">HADI</span>
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.listing_id}`}
                          className="block text-[#e8dcc8] font-display text-base leading-snug hover:text-[#c9a96e] transition-colors truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1 font-sans">
                          SKU: {item.sku}
                        </p>
                        <p className="text-xs text-white/40 mt-2 font-sans">
                          Qty: <span className="text-white/60">{item.qty}</span>
                          &nbsp;&nbsp;·&nbsp;&nbsp;
                          Unit: <span className="text-white/60">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: item.currency,
                              maximumFractionDigits: 0,
                            }).format(unitPrice)}
                          </span>
                        </p>
                      </div>

                      {/* Line total */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-display text-[#c9a96e]">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: item.currency,
                            maximumFractionDigits: 0,
                          }).format(lineTotal)}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Delivery Experience Rating ─── */}
            {["delivered", "completed"].includes(order.status) && (
              <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 font-sans mb-4">
                  How was your delivery experience?
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { score: 1, emoji: "😞", label: "Bad" },
                    { score: 2, emoji: "😐", label: "Ok" },
                    { score: 3, emoji: "😊", label: "Avg" },
                    { score: 4, emoji: "😄", label: "Good" },
                    { score: 5, emoji: "🤩", label: "Best" },
                  ].map(({ score, emoji, label }) => (
                    <button
                      key={score}
                      onClick={() => setDeliveryRating(score)}
                      className={`flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl border transition-all font-sans
                        ${deliveryRating === score
                          ? "border-[#c9a96e]/40 bg-[#c9a96e]/10"
                          : "border-white/8 hover:border-[#c9a96e]/20 hover:bg-[#c9a96e]/5"
                        }`}
                      aria-label={`Rate delivery: ${label}`}
                    >
                      <span className="text-xl leading-none">{emoji}</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
                    </button>
                  ))}
                </div>
                {deliveryRating !== null && (
                  <p className="text-xs text-[#c9a96e]/50 font-sans mt-3 text-center">
                    Thanks for your feedback!
                  </p>
                )}
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN — Prompt 5 will go here ─────────────── */}
          <div className="lg:col-span-4 sticky top-24 space-y-6 order-1 lg:order-2">

            {/* ── Payment Breakdown ─── */}
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-4 h-4 text-[#c9a96e]/50" />
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 font-sans">
                  Payment Summary
                </p>
              </div>

              {/* Receipt rows */}
              {[
                { label: "Subtotal", value: order.subtotal },
                { label: "Shipping", value: order.shipping_fee },
                { label: "Tax", value: order.tax_amount },
                ...(parseFloat(order.discount_amount) > 0
                  ? [{ label: "Discount", value: `-${order.discount_amount}`, isDiscount: true }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2">
                  <span className="text-xs text-white/40 font-sans">{row.label}</span>
                  <span className={`text-xs font-sans ${(row as any).isDiscount ? "text-emerald-400" : "text-white/60"}`}>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: order.currency,
                      maximumFractionDigits: 0,
                    }).format(Math.abs(parseFloat((row as any).isDiscount ? order.discount_amount : row.value)))}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center border-t border-[#c9a96e]/15 pt-4 mt-2">
                <span className="text-sm font-display text-[#e8dcc8]">Total</span>
                <span className="text-lg font-display text-[#c9a96e]">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: order.currency,
                    maximumFractionDigits: 0,
                  }).format(parseFloat(order.total_amount))}
                </span>
              </div>

              {/* Payment method note */}
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-sans mt-4 pt-4 border-t border-[#c9a96e]/8">
                Paid via Secure Gateway
              </p>
            </div>

            {/* ── Shipping Address ─── */}
            {(() => {
              let addr: any = null;
              let contact: any = null;
              try { addr = order.shipping_address ? JSON.parse(order.shipping_address) : null; } catch {}
              try { contact = order.contact ? JSON.parse(order.contact) : null; } catch {}

              if (!addr && !contact) return null;

              return (
                <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-4 h-4 text-[#c9a96e]/50" />
                    <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 font-sans">
                      Delivery Address
                    </p>
                  </div>

                  {contact?.name && (
                    <p className="text-sm text-[#e8dcc8] font-display mb-1">{contact.name}</p>
                  )}
                  {contact?.phone && (
                    <p className="text-xs text-white/40 font-sans mb-3">{contact.phone}</p>
                  )}

                  {addr && (
                    <address className="not-italic text-xs text-white/50 font-sans leading-6 space-y-0.5">
                      {addr.line1 && <div>{addr.line1}</div>}
                      {addr.line2 && <div>{addr.line2}</div>}
                      <div>
                        {[addr.city, addr.state].filter(Boolean).join(", ")}
                        {addr.postal_code && ` – ${addr.postal_code}`}
                      </div>
                      {addr.country && <div>{addr.country}</div>}
                    </address>
                  )}
                </div>
              );
            })()}

            {/* ── Order Actions ─────────────────────────── */}
            {(isCancellable || isReturnable) && (
              <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-6 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 font-sans mb-4">
                  Order Actions
                </p>

                {/* Return Order */}
                {isReturnable && (
                  <Link
                    to={`/orders/${order.id}/return`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#c9a96e]/15 text-[#c9a96e]/70 hover:text-[#c9a96e] hover:border-[#c9a96e]/30 hover:bg-[#c9a96e]/5 transition-all group"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span className="text-xs uppercase tracking-widest font-sans">Request Return</span>
                  </Link>
                )}

                {/* Cancel Order — shows inline confirm panel */}
                {isCancellable && !showCancelConfirm && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-red-500/15 text-rose-400/60 hover:text-rose-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-xs uppercase tracking-widest font-sans"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    Cancel Order
                  </button>
                )}

                {/* Inline cancel confirmation */}
                {isCancellable && showCancelConfirm && (
                  <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-rose-300 font-sans leading-relaxed">
                      Are you sure you want to cancel this order? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => doCancel()}
                        disabled={isCancelling}
                        className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-rose-300 hover:bg-red-500/30 transition-colors text-xs uppercase tracking-widest font-sans disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isCancelling ? "Cancelling…" : "Yes, Cancel"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="flex-1 py-2 rounded-lg border border-[#c9a96e]/15 text-white/40 hover:text-white/60 transition-colors text-xs uppercase tracking-widest font-sans"
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Support ────────────────────────────────── */}
            <div className="bg-[#0d0a07] border border-[#c9a96e]/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <HeadphonesIcon className="w-4 h-4 text-[#c9a96e]/40" />
                <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/40 font-sans">
                  Need Help?
                </p>
              </div>
              <p className="text-xs text-white/30 font-sans mb-3 leading-relaxed">
                Issue with your order? Our team is here to help.
              </p>
              <a
                href={`mailto:support@hadiperfumes.com?subject=Order%20%23${order.id.slice(0, 8).toUpperCase()}`}
                className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 hover:text-[#c9a96e] transition-colors font-sans"
              >
                Contact Support →
              </a>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
