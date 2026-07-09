// src/components/order-components/ReturnModal.tsx
// Modal for submitting a return request on a delivered/completed order.

import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, ChevronDown, AlertCircle } from 'lucide-react';
import {
  createReturn,
  RETURN_REASON_LABELS,
  type ReturnReasonCode,
  type CreateReturnPayload,
} from '../../api/trust';
import type { OrderItem } from '../../api/types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  items: OrderItem[];
  onSuccess: () => void;
}

export default function ReturnModal({
  isOpen,
  onClose,
  orderId,
  items,
  onSuccess,
}: ReturnModalProps) {
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode | ''>('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  // Initialize all items as selected with full qty
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      items.forEach((item) => {
        initial[item.id] = item.qty;
      });
      setSelectedItems(initial);
      setReasonCode('');
      setReasonDetail('');
      setError('');
    }
  }, [isOpen, items]);

  const toggleItem = (itemId: string, qty: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = qty;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!reasonCode) {
      setError('Please select a reason for the return.');
      return;
    }
    if (Object.keys(selectedItems).length === 0) {
      setError('Please select at least one item to return.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload: CreateReturnPayload = {
      order_id: orderId,
      reason_code: reasonCode,
      reason_detail: reasonDetail.trim() || undefined,
      items: Object.entries(selectedItems).map(([id, qty]) => ({
        order_item_id: id,
        quantity: qty,
      })),
      idempotency_key: crypto.randomUUID?.() ?? `ret-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    try {
      await createReturn(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.body ?? err?.message ?? 'Failed to submit return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[#0d0a07] border border-[#c9a96e]/15 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col animate-[slideUp_300ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#c9a96e]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a96e]/10 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-[#c9a96e]" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[#e8dcc8]">Request Return</h3>
              <p className="text-[9px] uppercase tracking-widest text-[#c9a96e]/50">
                Order #{orderId.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#e8dcc8]/50" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Reason Select */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#c9a96e]/60 mb-2">
              Reason for Return
            </label>
            <div className="relative">
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                className="w-full appearance-none bg-[#0a0705] border border-[#c9a96e]/15 rounded-lg px-4 py-3 text-sm text-[#e8dcc8] focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
              >
                <option value="">Select a reason…</option>
                {(Object.entries(RETURN_REASON_LABELS) as [ReturnReasonCode, string][]).map(
                  ([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a96e]/40 pointer-events-none" />
            </div>
          </div>

          {/* Detail textarea */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#c9a96e]/60 mb-2">
              Additional Details <span className="text-[#e8dcc8]/30">(Optional)</span>
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Describe the issue…"
              className="w-full bg-[#0a0705] border border-[#c9a96e]/15 rounded-lg px-4 py-3 text-sm text-[#e8dcc8] placeholder:text-[#e8dcc8]/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors resize-none"
            />
            <p className="text-[9px] text-[#e8dcc8]/20 text-right mt-1">
              {reasonDetail.length}/1000
            </p>
          </div>

          {/* Items selection */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#c9a96e]/60 mb-2">
              Items to Return
            </label>
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = !!selectedItems[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id, item.qty)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                      ${isSelected
                        ? 'border-[#c9a96e]/30 bg-[#c9a96e]/5'
                        : 'border-[#c9a96e]/10 bg-transparent hover:border-[#c9a96e]/20'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
                        ${isSelected
                          ? 'bg-[#c9a96e] border-[#c9a96e]'
                          : 'border-[#c9a96e]/30 bg-transparent'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-[#0a0705]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8dcc8] truncate">{item.title}</p>
                      <p className="text-[10px] text-[#e8dcc8]/40 mt-0.5">
                        Qty: {item.qty} · {item.currency} {parseFloat(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#c9a96e]/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-lg border border-[#c9a96e]/15 text-xs uppercase tracking-widest text-[#e8dcc8]/60 hover:text-[#e8dcc8] hover:border-[#c9a96e]/30 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reasonCode}
            className="flex-1 py-3 rounded-lg bg-[#c9a96e] text-[#0a0705] text-xs uppercase tracking-widest font-medium hover:bg-[#e8c87a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
