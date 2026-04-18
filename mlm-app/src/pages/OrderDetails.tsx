import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrder, cancelOrder } from '../api/orders';
import type { OrderWithItems } from '../api/types';
import { ORDER_STATUS_CLS } from '../api/types';

function formatINR(value: string | number): string {
  return `₹${parseFloat(String(value)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeJsonParse<T>(jsonStr: string | null | undefined): T | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
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

const TIMELINE_STEPS = [
  'created',
  'payment_pending',
  'paid',
  'packing',
  'shipped',
  'delivered',
  'completed',
] as const;

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
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/profile"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Orders
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-500">Order Details</span>
        </div>
        <h1 className="text-display text-4xl text-zinc-100 mb-8">
          Order Details
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
          <div className="space-y-8">
            <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-label text-zinc-500">Order</p>
                  <p className="text-lg font-mono font-semibold text-zinc-100">
                    #{data.order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Placed on{' '}
                    {new Date(data.order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`self-start text-xs font-medium px-3 py-1 rounded-full border ${
                    ORDER_STATUS_CLS[data.order.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {formatStatus(data.order.status)}
                </span>
              </div>
            </div>

            {isTerminal ? (
              <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
                <p className="text-sm text-zinc-400 text-center">
                  {TERMINAL_MESSAGES[data.order.status] ?? 'This order is in a terminal state.'}
                </p>
              </div>
            ) : (
              <div className="rounded-sm border border-white/10 bg-white/5 p-8 overflow-x-auto shadow-glass">
                <p className="text-label text-zinc-500 mb-6">
                  Order Progress
                </p>
                <div className="flex items-start min-w-max">
                  {TIMELINE_STEPS.map((step, index) => {
                    const isDone = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const isFuture = index > currentStepIndex;
                    return (
                      <div key={step} className="flex items-start">
                        <div className="flex flex-col items-center w-20">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isDone
                                ? 'bg-amber-500 border-amber-500'
                                : isActive
                                ? 'bg-transparent border-amber-400 ring-2 ring-amber-400/30'
                                : 'bg-transparent border-zinc-700'
                            }`}
                          >
                            {isDone && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-black"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {isActive && (
                              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            )}
                          </div>
                          <p
                            className={`text-center text-[10px] mt-2 leading-tight ${
                              isDone
                                ? 'text-zinc-400'
                                : isActive
                                ? 'text-amber-400 font-semibold'
                                : 'text-zinc-600'
                            }`}
                          >
                            {formatStatus(step)}
                          </p>
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 w-8 mt-4 flex-shrink-0 ${
                              index < currentStepIndex ? 'bg-amber-500' : 'bg-zinc-800'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
              <p className="text-label text-zinc-500 mb-6">
                Items Ordered
              </p>
              <div className="space-y-4">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-3 border-b border-zinc-800 last:border-0 last:pb-0"
                  >
                    <div className="h-16 w-16 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-zinc-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-medium text-zinc-100 flex-shrink-0">
                      {formatINR(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
              <p className="text-label text-zinc-500 mb-6">
                Delivery Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Shipping Address</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {formatAddress(safeJsonParse<Record<string, any>>(data.order.shipping_address))}
                  </p>
                </div>
                {(() => {
                  const contact = safeJsonParse<{ name: string; phone: string; email?: string }>(data.order.contact);
                  if (!contact) return null;
                  return (
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Contact</p>
                      <p className="text-sm text-zinc-300">{contact.name}</p>
                      <p className="text-sm text-zinc-400">{contact.phone}</p>
                      {contact.email && <p className="text-sm text-zinc-400">{contact.email}</p>}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
              <p className="text-label text-zinc-500 mb-6">
                Payment Summary
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-zinc-200">{formatINR(data.order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Shipping</span>
                  <span className="text-zinc-200">{formatINR(data.order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tax</span>
                  <span className="text-zinc-200">{formatINR(data.order.tax_amount)}</span>
                </div>
                {parseFloat(String(data.order.discount_amount)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Discount</span>
                    <span className="text-emerald-400">
                      −{formatINR(data.order.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-zinc-800 pt-3 mt-3 flex justify-between">
                  <span className="text-base font-semibold text-zinc-100">Total</span>
                  <span className="text-base font-bold text-amber-400">
                    {formatINR(data.order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {(data.permissions?.can_cancel || data.permissions?.can_return) && (
              <div className="rounded-sm border border-white/10 bg-white/5 p-8 shadow-glass">
                <p className="text-label text-zinc-500 mb-6">
                  Actions
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {data.permissions?.can_cancel && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="btn-base border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/60
                                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {cancelling && (
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                        )}
                        {cancelling ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                      {cancelError && (
                        <p className="text-xs text-red-400">{cancelError}</p>
                      )}
                    </div>
                  )}
                  {data.permissions?.can_return && (
                    <button
                      onClick={() => navigate(`/returns/new?order_id=${data.order.id}`)}
                      className="btn-base border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/60"
                    >
                      Request Return
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
